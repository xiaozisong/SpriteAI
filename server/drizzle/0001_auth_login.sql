-- 登录功能迁移：
-- 1. 扩展 users，支持头像
-- 2. 新增第三方身份、会话、验证码、OAuth state、一次性 ticket 表
-- 3. 所有登录方式最终都会映射到 users.id

CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" varchar(255),
  "nickname" varchar(100),
  "avatar_url" varchar(1024),
  "password_hash" varchar(255),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "users_email_unique" UNIQUE("email")
);

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" varchar(1024);

-- 登录身份绑定表：email / qq / wechat 都记录在这里。
CREATE TABLE IF NOT EXISTS "auth_identities" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "provider" varchar(32) NOT NULL,
  "provider_user_id" varchar(255) NOT NULL,
  "email" varchar(255),
  "union_id" varchar(255),
  "nickname" varchar(100),
  "avatar_url" varchar(1024),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 同一个 provider 下的同一个外部用户只能绑定一次。
CREATE UNIQUE INDEX IF NOT EXISTS "auth_identities_provider_user_unique"
ON "auth_identities" ("provider", "provider_user_id");

-- refresh token 会话表：只保存哈希，不保存明文 token。
CREATE TABLE IF NOT EXISTS "auth_sessions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "refresh_token_hash" varchar(255) NOT NULL,
  "user_agent" varchar(512),
  "ip_address" varchar(64),
  "expires_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 邮箱验证码表：验证码只保存 hash，consumed_at 非空代表已使用。
CREATE TABLE IF NOT EXISTS "email_login_codes" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" varchar(255) NOT NULL,
  "code_hash" varchar(255) NOT NULL,
  "ip_address" varchar(64),
  "attempts" integer DEFAULT 0 NOT NULL,
  "consumed_at" timestamp with time zone,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- OAuth state 表：防 CSRF，并保证 state 只能消费一次。
CREATE TABLE IF NOT EXISTS "oauth_states" (
  "id" serial PRIMARY KEY NOT NULL,
  "provider" varchar(32) NOT NULL,
  "state" varchar(255) NOT NULL UNIQUE,
  "redirect_to" varchar(1024),
  "consumed_at" timestamp with time zone,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- OAuth 回调后的短期一次性 ticket，前端用它换系统 token。
CREATE TABLE IF NOT EXISTS "login_tickets" (
  "id" serial PRIMARY KEY NOT NULL,
  "ticket_hash" varchar(255) NOT NULL UNIQUE,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "consumed_at" timestamp with time zone,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
