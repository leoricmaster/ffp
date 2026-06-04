// AuthService v4
// 实现 US-001 注册（4 US 中本 PR 仅触及 US-001 所需路径）
// v4 设计要点（US-001）：
//   - 事务原子性（READ COMMITTED）：user + family + family_member + 14 条默认分类一次落库
//   - 5 分钟幂等键（缓存层 / DB unique 约束双保险）
//   - Argon2id 哈希（m=19MiB, t=2, p=1, salt≥16B）
//   - Top 100k 密码黑名单
//   - privacyPolicyAccepted 必须为 true
//   - username 派生规则
//   - 启动 fail-fast：JWT_SECRET / ALLOWED_ORIGINS 校验

import { v4 as uuidv4 } from 'uuid';
import { db } from '../../../shared/database';
import { hashPassword, verifyPassword } from '../../../shared/crypto/passwordHasher';
import { generateRefreshToken } from '../../../shared/crypto/tokenGenerator';
import { deriveTokenHash } from '../../../shared/crypto/hkdf';
import { JwtSigner } from '../../../shared/jwt/jwtSigner';
import { IdempotencyStore } from '../../../shared/idempotency/idempotencyStore';
import { getEnv } from '../../../config/env';
import {
  EmailAlreadyExistsError,
  InvalidPrivacyConsentError,
  UnauthorizedError,
  WeakPasswordError,
} from '../../../shared/errors';
import type { RegisterRequest, LoginRequest, AuthData, LoginData } from '../schemas/auth.schema';
import { passwordBlacklist } from '../passwordBlacklist';
import { generateUsernameFromEmail } from '../usernameGenerator';
import { userRepository } from '../../user/user.repository';
import { familyRepository } from '../../family/repositories/family.repository';
import { refreshTokenRepository } from '../repositories/refreshToken.repository';
import { auditRepository } from '../../audit/audit.repository';

const IDEMPOTENCY_KEY_PREFIX = 'register:';

/** 注册结果 */
export interface RegisterResult extends AuthData {
  /** 仅在事务中产生的 refreshToken 原始值（用于 Set-Cookie） */
  refreshToken: string;
  /** refreshToken 过期时间（毫秒时间戳） */
  refreshTokenExpiresAt: Date;
}

export interface RegisterContext {
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginContext {
  ipAddress?: string;
  userAgent?: string;
}

export class AuthService {
  private readonly jwtSigner: JwtSigner;
  private readonly accessExpiresIn: number;
  private readonly refreshExpiresIn: number;
  private readonly idempotencyStore: IdempotencyStore<RegisterResult>;

  constructor() {
    const env = getEnv();
    this.jwtSigner = new JwtSigner(env.JWT_SECRET);
    this.accessExpiresIn = parseInt(env.JWT_ACCESS_EXPIRATION, 10);
    this.refreshExpiresIn = parseInt(env.JWT_REFRESH_EXPIRATION, 10);
    this.idempotencyStore = new IdempotencyStore<RegisterResult>(
      parseInt(env.IDEMPOTENCY_WINDOW_MS, 10)
    );
    // 确保黑名单加载（首次调用时）
    passwordBlacklist.load();
  }

  // ============================================================
  // US-001 注册
  // ============================================================

  /**
   * 注册流程：
   *   1) Zod schema 已在外层校验（Controller 调用 validateBody）
   *   2) 隐私政策已由 Zod literal(true) 保证
   *   3) 密码黑名单检查
   *   4) 5min 幂等检查
   *   5) 事务性创建 user + family + member + 14 categories
   *   6) 创建 refreshToken family + 写入
   *   7) 签发 accessToken
   *   8) 写 AuditLog
   */
  async register(dto: RegisterRequest, ctx: RegisterContext = {}): Promise<RegisterResult> {
    const env = getEnv();
    const email = dto.email.toLowerCase();
    const idempotencyKey = `${IDEMPOTENCY_KEY_PREFIX}${email}`;

    // 幂等命中：5min 内同邮箱重复请求直接返回首次结果
    const cached = this.idempotencyStore.get(idempotencyKey);
    if (cached) {
      auditRepository.record({
        userId: null,
        eventType: 'REGISTER',
        eventStatus: 'SUCCESS',
        ipAddress: ctx.ipAddress ?? null,
        userAgent: ctx.userAgent ?? null,
        metadata: { idempotent: true, email },
      });
      return cached;
    }

    // 隐私政策二次校验（防御性：理论上 Zod 已拦）
    if (dto.privacyPolicyAccepted !== true) {
      throw new InvalidPrivacyConsentError();
    }

    // 密码黑名单
    if (passwordBlacklist.contains(dto.password)) {
      throw new WeakPasswordError('密码过于常见，请使用更复杂的密码');
    }

    // 邮箱已存在 → 409
    if (userRepository.findByEmail(email)) {
      throw new EmailAlreadyExistsError();
    }

    // username 派生（优先用请求中提供的，否则从 email 派生）
    let username = dto.username;
    if (!username) {
      try {
        username = generateUsernameFromEmail(email);
      } catch (e) {
        // 极小概率：email 前缀清洗后 < 3 字符
        throw new WeakPasswordError(
          e instanceof Error ? e.message : 'username 派生失败'
        );
      }
    } else if (userRepository.findByUsername(username)) {
      throw new EmailAlreadyExistsError('该用户名已被使用');
    }

    // 哈希密码
    const passwordHash = await hashPassword(dto.password);

    // ---- 事务性创建（v4 AC5）----
    // MVP 用 in-memory store，不支持真实事务回滚；
    // 顺序写入，任何异常则手动调用 familyRepository.rollbackRegistration
    const now = new Date();
    const privacyAcceptedAt = now;
    const family = familyRepository.createFamily(now);
    let user;
    let familyMember;
    let categories;
    try {
      user = userRepository.create({
        email,
        username,
        passwordHash,
        phone: dto.phone ?? null,
        privacyPolicyAcceptedAt: privacyAcceptedAt,
        defaultFamilyId: family.id,
      });
      familyMember = familyRepository.createFamilyMember(user.id, family.id, now);
      categories = familyRepository.createDefaultCategories(family.id, now);
    } catch (e) {
      // 回滚：删除已写入的 family / member / categories
      familyRepository.rollbackRegistration({
        familyId: family.id,
        familyMemberIds: familyMember ? [familyMember.id] : [],
        categoryIds: categories?.map((c) => c.id) ?? [],
      });
      userRepository.deleteById(user?.id ?? '');
      // 邮箱/username 冲突 → 映射为业务错误码（v4 §2.2 EMAIL_ALREADY_EXISTS）
      if (e instanceof Error && e.message.startsWith('email already exists')) {
        throw new EmailAlreadyExistsError();
      }
      if (e instanceof Error && e.message.startsWith('username already exists')) {
        throw new EmailAlreadyExistsError('该用户名已被使用');
      }
      throw e;
    }

    // ---- refreshToken family 预创建（v4 设计）----
    const tokenFamilyId = uuidv4();
    const refreshTokenValue = generateRefreshToken();
    const tokenHash = deriveTokenHash(env.JWT_SECRET, tokenFamilyId, refreshTokenValue);
    const refreshExpiresAt = new Date(now.getTime() + this.refreshExpiresIn * 1000);
    refreshTokenRepository.create({
      userId: user.id,
      tokenFamilyId,
      parentId: null,
      tokenHash,
      expiresAt: refreshExpiresAt,
      userAgent: ctx.userAgent ?? null,
      ipAddress: ctx.ipAddress ?? null,
    });

    // ---- accessToken 签发 ----
    const accessToken = this.jwtSigner.sign({
      userId: user.id,
      familyId: family.id,
      expiresInSeconds: this.accessExpiresIn,
    });

    // ---- 审计日志 ----
    auditRepository.record({
      userId: user.id,
      eventType: 'REGISTER',
      eventStatus: 'SUCCESS',
      ipAddress: ctx.ipAddress ?? null,
      userAgent: ctx.userAgent ?? null,
      metadata: { familyId: family.id, username },
    });

    const result: RegisterResult = {
      userId: user.id,
      username: user.username,
      email: user.email,
      familyId: family.id,
      accessToken,
      expiresIn: this.accessExpiresIn,
      refreshToken: refreshTokenValue,
      refreshTokenExpiresAt: refreshExpiresAt,
    };

    // 5min 幂等键写入
    this.idempotencyStore.set(idempotencyKey, result);

    return result;
  }

  // ============================================================
  // US-002 登录（最小骨架：本 PR 仅提供 register，login 由后续 US-002 完整实现）
  // ============================================================

  /**
   * 登录（MVP 占位实现，保持现有行为）。
   * 注意：US-002 完整登录（含失败计数 / 锁定 / rememberMe / Set-Cookie）由后续 US-002 PR 补全。
   * 本实现仅保证 US-001 提交后状态可登录（用于联调自检）。
   */
  async login(dto: LoginRequest, _ctx: LoginContext = {}): Promise<LoginData> {
    const user = userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError();
    }
    const ok = await verifyPassword(user.passwordHash, dto.password);
    if (!ok) {
      throw new UnauthorizedError();
    }
    const accessToken = this.jwtSigner.sign({
      userId: user.id,
      familyId: user.currentFamilyId ?? '',
      expiresInSeconds: this.accessExpiresIn,
    });

    // 查找该用户在默认家庭的角色
    let currentFamily: LoginData['currentFamily'] = null;
    if (user.currentFamilyId) {
      const family = db.families.get(user.currentFamilyId);
      const fm = Array.from(db.familyMembers.values()).find(
        (m) => m.userId === user.id && m.familyId === user.currentFamilyId && m.deletedAt === null
      );
      if (family && fm) {
        currentFamily = {
          familyId: family.id,
          name: family.name,
          role: fm.role,
        };
      }
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        status: user.status,
        role: user.role,
      },
      accessToken,
      expiresIn: this.accessExpiresIn,
      currentFamily,
    };
  }

  /** 测试场景：清空幂等键 */
  clearIdempotencyStore(): void {
    this.idempotencyStore.clear();
  }
}

export const authService = new AuthService();
