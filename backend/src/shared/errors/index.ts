// Custom application errors for FFP backend
// 错误码与 docs/api/openapi.yaml ErrorResponse.code 枚举一致

export interface ErrorDetail {
  field: string;
  message: string;
  value?: string;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: ErrorDetail[];

  constructor(code: string, message: string, statusCode: number, details?: ErrorDetail[]) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 400 - 必填字段缺失（US-001 AC1） */
export class MissingRequiredFieldError extends AppError {
  constructor(message: string, details?: ErrorDetail[]) {
    super('MISSING_REQUIRED_FIELD', message, 400, details);
    this.name = 'MissingRequiredFieldError';
  }
}

/** 400 - 邮箱格式 / 字段格式错误（US-001 AC2） */
export class InvalidFormatError extends AppError {
  constructor(message: string, details?: ErrorDetail[]) {
    super('INVALID_FORMAT', message, 400, details);
    this.name = 'InvalidFormatError';
  }
}

/** 400 - 密码强度不足 / 命中黑名单（US-001 AC2） */
export class WeakPasswordError extends AppError {
  constructor(message: string, details?: ErrorDetail[]) {
    super('WEAK_PASSWORD', message, 400, details);
    this.name = 'WeakPasswordError';
  }
}

/** 400 - 隐私政策未勾选（US-001 AC3） */
export class InvalidPrivacyConsentError extends AppError {
  constructor(message = '请勾选《用户协议》与《隐私政策》') {
    super('INVALID_PRIVACY_CONSENT', message, 400);
    this.name = 'InvalidPrivacyConsentError';
  }
}

/** 400 - 通用参数校验失败（兜底） */
export class ValidationError extends AppError {
  constructor(message: string, details?: ErrorDetail[]) {
    super('CONSTRAINT_VIOLATION', message, 400, details);
    this.name = 'ValidationError';
  }
}

/** 409 - 邮箱已注册（5min 幂等窗口外） */
export class EmailAlreadyExistsError extends AppError {
  constructor(message = '该邮箱已注册') {
    super('EMAIL_ALREADY_EXISTS', message, 409);
    this.name = 'EmailAlreadyExistsError';
  }
}

/** 401 - 凭证错误（邮箱不存在 / 密码错误，不区分以避免枚举攻击） */
export class UnauthorizedError extends AppError {
  constructor(message = '邮箱或密码错误', code = 'INVALID_CREDENTIALS') {
    super(code, message, 401);
    this.name = 'UnauthorizedError';
  }
}

/** 401 - 令牌已撤销重放（token family 撤销后强制重新登录） */
export class TokenReusedError extends AppError {
  constructor(message = '会话已失效，请重新登录') {
    super('TOKEN_REUSED', message, 401);
    this.name = 'TokenReusedError';
  }
}

/** 401 - 令牌过期 */
export class TokenExpiredError extends AppError {
  constructor(message = '登录已过期，请重新登录') {
    super('TOKEN_EXPIRED', message, 401);
    this.name = 'TokenExpiredError';
  }
}

/** 401 - 令牌不存在 / 格式不合法 */
export class InvalidTokenError extends AppError {
  constructor(message = '令牌无效') {
    super('INVALID_TOKEN', message, 401);
    this.name = 'InvalidTokenError';
  }
}

/** 423 - 账户锁定（US-002 AC3） */
export class AccountLockedError extends AppError {
  constructor(lockedUntil: Date) {
    super('ACCOUNT_LOCKED', '账户已锁定，请 15 分钟后重试', 423, [
      {
        field: 'lockedUntil',
        message: '账户锁定到期时间（ISO8601）',
        value: lockedUntil.toISOString(),
      },
    ]);
    this.name = 'AccountLockedError';
  }
}

/** 429 - 限流触发（IP / email / token 维度） */
export class RateLimitExceededError extends AppError {
  constructor(message = '操作过于频繁，请稍后重试', details?: ErrorDetail[]) {
    super('RATE_LIMIT_EXCEEDED', message, 429, details);
    this.name = 'RateLimitExceededError';
  }
}

/** 404 - 资源不存在（兜底） */
export class NotFoundError extends AppError {
  constructor(message: string, code = 'RECORD_NOT_FOUND') {
    super(code, message, 404);
    this.name = 'NotFoundError';
  }
}

/** 500 - 系统繁忙 */
export class InternalError extends AppError {
  constructor(message = '系统繁忙，请稍后重试') {
    super('INTERNAL_SERVER_ERROR', message, 500);
    this.name = 'InternalError';
  }
}
