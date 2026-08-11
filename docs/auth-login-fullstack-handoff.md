# 登录功能全栈交接文档

> 面向对象：前端转全栈、后端转全栈、新接手认证模块的同事  
> 范围：QQ 邮箱 / Gmail 验证码登录、QQ 扫码登录、微信扫码登录  
> 相关实现：`server/src/auth/`、`src/components/LoginDialog/`、`src/stores/loginStore/`、`src/api/auth.ts`

## 1. 一句话说明

本登录模块的核心思想是：**第三方平台只负责证明“这个人是谁”，我们自己的后端负责创建用户、绑定身份、签发登录态和保护业务接口。**

所以无论用户通过 QQ 邮箱、Gmail、QQ 扫码还是微信扫码登录，最终都会进入同一套内部账号体系：

```text
外部身份验证
  ↓
后端 AuthService 查找或创建用户
  ↓
写入 users / auth_identities / auth_sessions
  ↓
签发系统自己的 token
  ↓
前端保存 token 并进入已登录状态
```

## 2. 总体文件地图

| 文件 | 作用 | 适合谁先看 |
|---|---|---|
| `server/src/auth/auth.controller.ts` | 暴露 HTTP 接口，负责接请求、取参数、返回响应或重定向 | 前端、全栈 |
| `server/src/auth/auth.service.ts` | 核心业务逻辑，负责验证码、OAuth、用户创建、session、ticket | 后端、全栈 |
| `server/src/auth/dto.ts` | 请求参数校验模型，配合 NestJS ValidationPipe | 后端 |
| `server/src/auth/token.service.ts` | access token、refresh token、ticket 的生成和校验 | 后端 |
| `server/src/auth/guards/jwt-auth.guard.ts` | 保护需要登录的接口，校验 Bearer Token | 后端 |
| `server/src/auth/providers/*` | 对接外部服务：邮箱、QQ、微信 | 后端 |
| `server/src/db/schema/auth-*.ts` | Drizzle 数据表定义 | 后端 |
| `src/api/auth.ts` | 前端认证 API 封装 | 前端 |
| `src/stores/loginStore/index.ts` | 前端登录状态、登录动作、拦截行为 | 前端、全栈 |
| `src/components/LoginDialog/LoginDialog.tsx` | 登录弹窗 UI 与交互 | 前端 |
| `src/pages/auth-callback/index.tsx` | OAuth 回调落地页，负责 ticket 换 token | 前端、全栈 |

## 3. Controller 是什么？为什么需要它？

`Controller` 是 NestJS 里的“HTTP 接口层”。它不应该写复杂业务，而是负责：

1. 定义接口路径，例如 `POST /api/auth/email/send-code`。
2. 从请求里取参数，例如 `@Body()`、`@Query()`、`@Param()`。
3. 调用 `AuthService` 完成真正业务。
4. 对特殊 HTTP 行为做处理，例如 OAuth 回调时 `res.redirect()`。

本项目里 `AuthController` 的设计原因：

- 前端只需要关心 API，不需要知道数据库、OAuth 细节。
- OAuth 回调必须由服务端接住，因为 `client_secret` 不能暴露给浏览器。
- Controller 保持薄层，便于测试和维护。

## 4. Service 是什么？为什么核心逻辑放在 Service？

`Service` 是业务层。`AuthService` 负责把“登录”这件事完整串起来：

| 方法 | 做什么 | 为什么放在 Service |
|---|---|---|
| `sendEmailCode` | 生成验证码、限流、写验证码表、调用邮件 Provider | 涉及业务规则和数据库 |
| `verifyEmailCode` | 校验验证码、标记消费、创建用户、签发 token | 是完整登录业务 |
| `createOAuthAuthorizeUrl` | 生成 QQ/微信扫码地址，并保存 state | 需要防 CSRF 和记录回跳地址 |
| `handleOAuthCallback` | 校验 state、换取第三方用户信息、生成 ticket | OAuth 核心安全链路 |
| `exchangeLoginTicket` | 用一次性 ticket 换系统 token | 避免 token 暴露在 URL |
| `getMe` | 根据 token 中 userId 查询当前用户 | 统一登录态查询 |

为什么不把这些写在 Controller？

- Controller 写太多逻辑会变成“胖控制器”，以后很难测试。
- Service 可以被 Controller、定时任务、其他模块复用。
- 业务规则集中在一个地方，修改验证码策略或 OAuth 策略更安全。

## 5. DTO 是什么？为什么要写 DTO？

DTO 是 Data Transfer Object，表示“接口请求体或查询参数长什么样”。

例如：

```ts
export class VerifyEmailCodeDto {
  @IsEmail()
  email!: string

  @IsString()
  @Length(6, 6)
  code!: string
}
```

它的作用：

- 请求到 Controller 前先做参数校验。
- 防止空邮箱、非法邮箱、验证码长度错误进入业务层。
- 让接口契约清晰，前后端都知道该传什么。

## 6. Provider 是什么？为什么 QQ、微信、邮箱要拆 Provider？

Provider 在这里表示“外部能力适配器”。邮箱、QQ、微信都不是我们自己的系统，所以把外部对接逻辑单独拆开：

| Provider | 外部系统 | 负责内容 |
|---|---|---|
| `EmailOtpProvider` | SMTP / 邮件 API | 发送验证码 |
| `QqOAuthProvider` | 腾讯 QQ 互联 | 生成授权 URL、用 code 换 token、获取 openid 和用户资料 |
| `WechatOAuthProvider` | 微信开放平台 | 生成扫码 URL、用 code 换 token、获取 openid/unionid 和用户资料 |

这样实现的好处：

- 外部 API 变化时，只改 Provider。
- `AuthService` 不需要关心 QQ/微信 API 细节。
- 后续可以把 SMTP 换成云邮件服务，不影响 Controller 和前端。

## 7. Guard 是什么？为什么需要 JwtAuthGuard？

`Guard` 是 NestJS 的接口访问控制层。

`JwtAuthGuard` 做的事：

1. 从请求头读取 `Authorization: Bearer xxx`。
2. 调用 `AuthService.verifyAccessToken()` 校验 token。
3. 校验通过后把用户信息放到 `request.user`。
4. 校验失败直接返回 401。

后续任何需要登录的接口，都可以这样使用：

```ts
@UseGuards(JwtAuthGuard)
@Get('me')
me(@Req() req: AuthenticatedRequest) {
  return this.authService.getMe(req.user!.id)
}
```

## 8. 为什么 OAuth 回调不直接把 token 放 URL？

OAuth 登录会经历浏览器跳转。如果直接跳转：

```text
/auth/callback?token=真实登录token
```

会有几个问题：

- token 可能留在浏览器历史记录。
- token 可能被日志、监控、Referer 泄露。
- 链接被复制后可能还能用。

所以本项目使用一次性 `login_ticket`：

```text
OAuth 回调
  ↓
后端生成 2 分钟有效的一次性 ticket
  ↓
前端 /auth/callback?ticket=xxx
  ↓
前端 POST /api/auth/oauth/exchange-ticket
  ↓
后端消费 ticket 并返回 token
```

ticket 被消费后立即失效，安全性更好。

## 9. 数据表设计说明

| 表 | 作用 | 为什么需要 |
|---|---|---|
| `users` | 系统内部用户主表 | 所有登录方式最终都映射到一个内部用户 |
| `auth_identities` | 第三方身份绑定表 | 一个用户可以绑定邮箱、QQ、微信等多个身份 |
| `auth_sessions` | 登录会话表 | 保存 refresh token 哈希、设备信息、过期时间 |
| `email_login_codes` | 邮箱验证码表 | 做验证码过期、重试次数、消费记录 |
| `oauth_states` | OAuth state 表 | 防 CSRF，保证扫码回调是由我们发起的 |
| `login_tickets` | 一次性登录 ticket 表 | OAuth 回调后安全地换取 token |

## 10. 邮箱验证码登录流程

```text
用户输入邮箱
  ↓
POST /api/auth/email/send-code
  ↓
后端检查邮箱域名和发送频率
  ↓
生成 6 位验证码，只保存哈希
  ↓
EmailOtpProvider 发送验证码
  ↓
用户输入验证码
  ↓
POST /api/auth/email/verify-code
  ↓
校验验证码、标记已消费
  ↓
查找或创建 users / auth_identities
  ↓
签发 token，前端保存登录态
```

## 11. QQ / 微信扫码流程

```text
用户点击 QQ / 微信扫码
  ↓
前端 GET /api/auth/oauth/url?provider=qq
  ↓
后端生成 state 并返回授权 URL
  ↓
浏览器跳到 QQ / 微信扫码页
  ↓
用户扫码授权
  ↓
QQ / 微信回调后端 /api/auth/oauth/:provider/callback
  ↓
后端校验 state，用 code 换第三方用户资料
  ↓
查找或创建内部用户
  ↓
生成一次性 login_ticket
  ↓
重定向前端 /auth/callback?ticket=xxx
  ↓
前端用 ticket 换 token
```

## 12. 前端如何接手

前端同事重点看这 4 个点：

1. `src/components/LoginDialog/LoginDialog.tsx`：登录 UI 和交互状态。
2. `src/stores/loginStore/index.ts`：登录动作和登录状态。
3. `src/api/auth.ts`：认证 API。
4. `src/pages/auth-callback/index.tsx`：扫码登录回调。

需要注意：

- 业务页面不要直接操作 token，继续调用 `requireLogin()`。
- 登录弹窗只负责用户交互，真正登录动作交给 `loginStore`。
- OAuth 登录会离开当前页面，所以前端需要把当前路径传给后端作为 `redirectTo`。

## 13. 后端如何接手

后端同事重点看这 5 个点：

1. `AuthController`：接口入口。
2. `AuthService`：核心业务。
3. `TokenService`：token 与 ticket。
4. `providers`：外部平台对接。
5. `db/schema`：认证数据结构。

上线前建议补强：

- P2 低优先级：接入真正 SMTP/邮件 API 发送实现。开发阶段先使用后端日志打印验证码，待 QQ 邮箱/Gmail SMTP 授权码或云邮件服务确定后再接入。
- refresh token 续期接口。
- 更细的 IP / 邮箱 / 设备限流。
- 登录审计日志。
- QQ / 微信平台错误码映射。

## 14. 当前验证状态

| 检查项 | 结果 |
|---|---|
| 后端构建 | 通过 |
| 后端 token 单测 | 通过 |
| IDE lint | 无新增错误 |
| 前端整体构建 | 仍被既有 `@tiptap/core` 缺失依赖阻塞 |

