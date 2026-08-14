package com.jingling.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jingling.common.BusinessException;
import com.jingling.config.AppProperties;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class TokenServiceTest {

  @Test
  void signAndVerifyAccessToken() {
    AppProperties props = new AppProperties(
        new AppProperties.Jwt("test-secret", 7200),
        new AppProperties.Auth("http://localhost:5555", "http://localhost:3000", 30, "精灵 <a@b.c>", false),
        new AppProperties.OAuth(
            new AppProperties.OAuth.Client("", ""),
            new AppProperties.OAuth.Client("", "")
        ),
        new AppProperties.Agent("http://localhost:8000", 5000, 600000),
        new AppProperties.Cors("http://localhost:5555")
    );
    TokenService tokenService = new TokenService(props, new ObjectMapper());
    String token = tokenService.signAccessToken("42", "a@b.com");
    Map<String, Object> payload = tokenService.verifyAccessToken(token);
    assertEquals("42", String.valueOf(payload.get("sub")));
    assertEquals("a@b.com", String.valueOf(payload.get("email")));

    String opaque = tokenService.createOpaqueToken(16);
    assertFalse(opaque.isBlank());
    assertNotEquals(opaque, tokenService.hashOpaqueToken(opaque));
  }

  @Test
  void signAccessToken_expiredToken() {
    AppProperties props = new AppProperties(
        new AppProperties.Jwt("test-secret", 7200),
        new AppProperties.Auth("http://localhost:5555", "http://localhost:3000", 30, "精灵 <a@b.c>", false),
        new AppProperties.OAuth(
            new AppProperties.OAuth.Client("", ""),
            new AppProperties.OAuth.Client("", "")
        ),
        new AppProperties.Agent("http://localhost:8000", 5000, 600000),
        new AppProperties.Cors("http://localhost:5555")
    );
    TokenService tokenService = new TokenService(props, new ObjectMapper());

    // 手工用相同的 secret 签一个已过期的 token（exp = now - 1）
    String expiredToken = signExpiredToken(props, "test-secret", "42", "test@example.com");

    BusinessException ex = assertThrows(BusinessException.class, () -> tokenService.verifyAccessToken(expiredToken));
    assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
    assertTrue(ex.getMessage().contains("过期"));
  }

  /** 用相同的 HS256 密钥手签一个过期 token，确保 verify 走真实签名路径。 */
  private static String signExpiredToken(AppProperties props, String secret, String sub, String email) {
    try {
      long now = System.currentTimeMillis() / 1000;
      Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
      Map<String, Object> payload = Map.of(
          "sub", sub,
          "email", email,
          "iat", now - 100,
          "exp", now - 1
      );
      ObjectMapper om = new ObjectMapper();
      String h = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(om.writeValueAsBytes(header));
      String p = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(om.writeValueAsBytes(payload));
      javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
      mac.init(new javax.crypto.spec.SecretKeySpec(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256"));
      String sig = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal((h + "." + p).getBytes(java.nio.charset.StandardCharsets.UTF_8)));
      return h + "." + p + "." + sig;
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  @Test
  void verifyAccessToken_invalidToken() {
    AppProperties props = new AppProperties(
        new AppProperties.Jwt("test-secret", 7200),
        new AppProperties.Auth("http://localhost:5555", "http://localhost:3000", 30, "精灵 <a@b.c>", false),
        new AppProperties.OAuth(
            new AppProperties.OAuth.Client("", ""),
            new AppProperties.OAuth.Client("", "")
        ),
        new AppProperties.Agent("http://localhost:8000", 5000, 600000),
        new AppProperties.Cors("http://localhost:5555")
    );
    TokenService tokenService = new TokenService(props, new ObjectMapper());

    // 格式错误的 token（不包含三个部分）
    BusinessException ex = assertThrows(BusinessException.class, () -> tokenService.verifyAccessToken("invalid.token"));
    assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
    assertTrue(ex.getMessage().contains("过期"));
  }
}