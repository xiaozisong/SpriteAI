import { UnauthorizedException } from '@nestjs/common';
import { TokenService } from './token.service';

/**
 * TokenService 单测只覆盖最关键的安全行为：
 * - 正常签发的 token 可以被校验
 * - 被篡改的 token 必须拒绝
 */
describe('TokenService', () => {
  const service = new TokenService();

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_ACCESS_TOKEN_TTL_SECONDS = '60';
  });

  it('signs and verifies an access token', () => {
    const token = service.signAccessToken({ sub: '1', email: 'user@qq.com' });
    const payload = service.verifyAccessToken(token);

    expect(payload.sub).toBe('1');
    expect(payload.email).toBe('user@qq.com');
  });

  it('rejects a tampered token', () => {
    const token = service.signAccessToken({ sub: '1' });
    const tampered = token.replace(/.$/, 'x');

    expect(() => service.verifyAccessToken(tampered)).toThrow(UnauthorizedException);
  });
});
