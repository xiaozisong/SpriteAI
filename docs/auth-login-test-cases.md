# 登录功能测试用例

> 范围：QQ 邮箱、Gmail、QQ 扫码、微信扫码、登录态。

## 1. 邮箱验证码

| 编号 | 用例 | 预期 |
|---|---|---|
| AUTH-E-001 | 输入 `test@qq.com` 获取验证码 | 返回验证码已发送 |
| AUTH-E-002 | 输入 `test@gmail.com` 获取验证码 | 返回验证码已发送 |
| AUTH-E-003 | 输入 `test@163.com` 获取验证码 | 拒绝并提示仅支持 QQ 邮箱和 Gmail |
| AUTH-E-004 | 60 秒内重复获取验证码 | 返回请求过于频繁 |
| AUTH-E-005 | 输入正确验证码登录 | 返回 token、refreshToken 和 user |
| AUTH-E-006 | 输入错误验证码 5 次 | 后续校验失败并提示过期或错误 |
| AUTH-E-007 | 验证码超过 10 分钟 | 校验失败 |

## 2. QQ 扫码

| 编号 | 用例 | 预期 |
|---|---|---|
| AUTH-Q-001 | 获取 QQ 授权 URL | 返回 QQ 互联授权地址 |
| AUTH-Q-002 | QQ 回调 code + state 正确 | 跳转 `/auth/callback?ticket=...` |
| AUTH-Q-003 | state 错误或重复使用 | 跳转错误信息 |
| AUTH-Q-004 | 二次使用同一 QQ 登录 | 命中同一用户 |

## 3. 微信扫码

| 编号 | 用例 | 预期 |
|---|---|---|
| AUTH-W-001 | 获取微信授权 URL | 返回微信开放平台扫码地址 |
| AUTH-W-002 | 微信回调 code + state 正确 | 跳转 `/auth/callback?ticket=...` |
| AUTH-W-003 | unionid 存在 | 使用 unionid 作为稳定身份 |
| AUTH-W-004 | unionid 不存在 | 使用 openid 兜底 |

## 4. 登录态

| 编号 | 用例 | 预期 |
|---|---|---|
| AUTH-S-001 | 使用 ticket 换登录态 | ticket 一次性消费，返回 token |
| AUTH-S-002 | 重复使用 ticket | 返回登录凭证失效 |
| AUTH-S-003 | 使用 token 请求 `/api/auth/me` | 返回当前用户 |
| AUTH-S-004 | token 过期或伪造 | 返回 401 |
| AUTH-S-005 | 退出登录 | 前端清理 token、refreshToken 和 userInfo |

## 5. 前端回归

| 编号 | 用例 | 预期 |
|---|---|---|
| AUTH-F-001 | 未勾选协议点击登录 | 提示先同意协议 |
| AUTH-F-002 | `requireLogin` 被触发 | 打开登录弹窗 |
| AUTH-F-003 | 邮箱登录成功 | 弹窗关闭并执行被拦截操作 |
| AUTH-F-004 | QQ/微信回调成功 | 跳回原页面 |
| AUTH-F-005 | 登录过期 | 自动清理登录态并重新登录 |
