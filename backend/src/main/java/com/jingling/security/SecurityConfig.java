package com.jingling.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jingling.common.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security 总开关：哪些接口要登录、401/403 怎么返回。
 *
 * <p>规则摘要：
 * <ul>
 *   <li>{@code /api/**} 默认需要 Bearer Token</li>
 *   <li>登录相关（发码、OAuth、refresh、logout）放行</li>
 *   <li>探活与 Swagger 放行</li>
 * </ul>
 *
 * <p>真正解析 JWT 的是 {@link JwtAuthenticationFilter}，挂在 UsernamePassword 过滤器之前。
 */
@Configuration
public class SecurityConfig {
  private final JwtAuthenticationFilter jwtAuthenticationFilter;
  private final ObjectMapper objectMapper;

  public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, ObjectMapper objectMapper) {
    this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    this.objectMapper = objectMapper;
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.csrf(AbstractHttpConfigurer::disable)
        .cors(Customizer.withDefaults())
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
            // 公开：登录与 OAuth 全链路（AuthController 下）
            .requestMatchers(
                "/api/auth/email/send-code",
                "/api/auth/email/verify-code",
                "/api/auth/oauth/url",
                "/api/auth/oauth/qq/callback",
                "/api/auth/oauth/wechat/callback",
                "/api/auth/oauth/exchange-ticket",
                "/api/auth/refresh"
            ).permitAll()
            // 公开：探活与 Swagger
            .requestMatchers("/api/health", "/actuator/**",
                "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
            // 公开：前端 Agent 流式 SSE 在带访问凭证时启用匿名访问
            // （SSE 兼容方案：后续可改为要求请求参数携带短期 ticket，由 Agent 网关再校验）
            .requestMatchers("/api/agent/stream/**").permitAll()
            .anyRequest().authenticated()
        )
        .exceptionHandling(ex -> ex
            .authenticationEntryPoint((req, res, e) -> writeError(res, 401, "未登录或登录已过期"))
            .accessDeniedHandler((req, res, e) -> writeError(res, 403, "无权限"))
        )
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }

  /** 未登录/无权限时也走统一 ApiResponse 信封，方便前端统一处理。 */
  private void writeError(HttpServletResponse res, int code, String message) throws java.io.IOException {
    res.setStatus(code);
    res.setContentType(MediaType.APPLICATION_JSON_VALUE);
    objectMapper.writeValue(res.getOutputStream(), ApiResponse.fail(code, message));
  }
}
