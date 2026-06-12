import { describe, expect, it } from "vitest";

import { DbBlogStore } from "./db-blog-store";

describe("DbBlogStore schema initialization", () => {
  it("stores local app sessions by hash and keeps portal access tokens for OIDC revalidation", () => {
    const schemaSql = DbBlogStore.getSchemaSql();

    expect(schemaSql).toContain("CREATE EXTENSION IF NOT EXISTS pgcrypto");
    expect(schemaSql).toContain("session_token_hash TEXT NOT NULL");
    expect(schemaSql).toContain("portal_access_token TEXT NOT NULL DEFAULT");
    expect(schemaSql).toContain("blog_app_sessions_session_token_hash_unique");
    expect(schemaSql).not.toContain("token TEXT NOT NULL UNIQUE");
  });

  it("migrates legacy plaintext session tokens into session token hashes", () => {
    const schemaSql = DbBlogStore.getSchemaSql();

    expect(schemaSql).toContain("ADD COLUMN IF NOT EXISTS session_token_hash");
    expect(schemaSql).toContain("digest(token, 'sha256')");
    expect(schemaSql).toContain("WHERE session_token_hash IS NULL");
  });
});
