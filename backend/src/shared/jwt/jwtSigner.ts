// accessToken JWT 签发与校验
// v4 §5.2：HS256，payload { sub, familyId, iat, exp }，exp=900s

import jwt from 'jsonwebtoken';

export interface AccessTokenPayload {
  sub: string; // userId
  familyId: string;
  iat: number;
  exp: number;
}

export interface SignAccessTokenInput {
  userId: string;
  familyId: string;
  expiresInSeconds: number;
}

export class JwtSigner {
  constructor(private readonly secret: string) {
    if (secret.length < 32) {
      throw new Error('JWT secret 长度必须 ≥ 32 字节（256 bit）');
    }
  }

  sign({ userId, familyId, expiresInSeconds }: SignAccessTokenInput): string {
    return jwt.sign(
      { sub: userId, familyId },
      this.secret,
      { algorithm: 'HS256', expiresIn: expiresInSeconds }
    );
  }

  verify(token: string): AccessTokenPayload {
    return jwt.verify(token, this.secret, { algorithms: ['HS256'] }) as AccessTokenPayload;
  }
}
