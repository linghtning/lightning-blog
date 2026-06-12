import { describe, expect, it, vi } from "vitest";

import { AccessService } from "./access.service";
import { MemoryBlogStore } from "../../shared/memory-blog-store";

function createNoopFetchUserInfo() {
  return vi.fn(async () => ({
    id: "portal-user-1",
    username: "alice",
    displayName: "Alice",
    avatarUrl: null,
    role: "user" as const,
  }));
}

function createBlogAccessService(store = new MemoryBlogStore()) {
  const oidcClient = {
    createAuthorizationUrl: vi.fn(async () => ({
      redirectUrl: new URL(
        "http://orgcatfun.site/oidc/auth?client_id=blog&response_type=code&scope=openid+profile+email&redirect_uri=http%3A%2F%2Fblog.orgcatfun.site%2Fauth%2Fcallback&state=state-1&nonce=nonce-1&code_challenge=challenge-1&code_challenge_method=S256",
      ),
      state: "state-1",
      nonce: "nonce-1",
      codeVerifier: "code-verifier-1",
    })),
    exchangeCallback: vi.fn(async () => ({
      accessToken: "portal-access-token",
      user: {
        id: "portal-user-1",
        username: "alice",
        displayName: "Alice",
        avatarUrl: null,
        role: "user" as const,
      },
    })),
    fetchUserInfo: createNoopFetchUserInfo(),
  };
  const service = new AccessService({
    store,
    config: {
      portalBaseUrl: "http://orgcatfun.site",
      publicBaseUrl: "http://blog.orgcatfun.site",
      ssoCallbackUrl: "http://blog.orgcatfun.site/auth/callback",
      oidcClientId: "blog",
    },
    oidcClient,
  });
  return { service, store, oidcClient };
}

describe("AccessService", () => {
  it("builds an OIDC authorization redirect for the blog client", async () => {
    const { service, oidcClient } = createBlogAccessService();

    const redirect = await service.createPortalLoginRedirect();

    expect(redirect.toString()).toContain("http://orgcatfun.site/oidc/auth?");
    expect(redirect.searchParams.get("client_id")).toBe("blog");
    expect(redirect.searchParams.get("response_type")).toBe("code");
    expect(redirect.searchParams.get("scope")).toBe("openid profile email");
    expect(redirect.searchParams.get("redirect_uri")).toBe(
      "http://blog.orgcatfun.site/auth/callback",
    );
    expect(redirect.searchParams.get("state")).toBe("state-1");
    expect(redirect.searchParams.get("nonce")).toBe("nonce-1");
    expect(redirect.searchParams.get("code_challenge")).toBe("challenge-1");
    expect(redirect.searchParams.get("code_challenge_method")).toBe("S256");
    expect(oidcClient.createAuthorizationUrl).toHaveBeenCalledTimes(1);
    expect(service.hasPendingAuthorization("state-1")).toBe(true);
  });

  it("creates a 30 day local app session after OIDC callback exchange succeeds", async () => {
    const { service, store, oidcClient } = createBlogAccessService();
    await service.createPortalLoginRedirect();
    const beforeCallback = Date.now();

    const result = await service.completeCallback({
      code: "code-1",
      state: "state-1",
    });

    const session = await store.findSessionByToken(result.sessionToken);
    expect(oidcClient.exchangeCallback).toHaveBeenCalledWith({
      callbackUrl:
        "http://blog.orgcatfun.site/auth/callback?code=code-1&state=state-1",
      codeVerifier: "code-verifier-1",
      expectedNonce: "nonce-1",
      expectedState: "state-1",
    });
    expect(result.sessionToken).toHaveLength(64);
    expect(session?.portalUserId).toBe("portal-user-1");
    expect(session?.portalAccessToken).toBe("portal-access-token");
    expect(
      (session!.expiresAt.getTime() - beforeCallback) / (1000 * 60 * 60 * 24),
    ).toBeGreaterThanOrEqual(29.99);
    expect((await store.getProfile("portal-user-1"))?.displayName).toBe(
      "Alice",
    );
    expect(service.hasPendingAuthorization("state-1")).toBe(false);
  });

  it("does not expose the raw local session token from memory storage", async () => {
    const { service, store } = createBlogAccessService();
    await service.createPortalLoginRedirect();

    const result = await service.completeCallback({
      code: "code-1",
      state: "state-1",
    });

    const session = await store.findSessionByToken(result.sessionToken);
    expect(session).not.toBeNull();
    expect(session).not.toHaveProperty("token");
    expect(session?.sessionTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(session?.sessionTokenHash).not.toBe(result.sessionToken);
  });

  it("revalidates local sessions against portal userinfo before returning a profile", async () => {
    const store = new MemoryBlogStore();
    const { service, oidcClient } = createBlogAccessService(store);
    oidcClient.fetchUserInfo.mockResolvedValueOnce({
      id: "portal-user-1",
      username: "alice",
      displayName: "Alice Updated",
      avatarUrl: null,
      role: "user" as const,
    });
    await service.createPortalLoginRedirect();
    const result = await service.completeCallback({
      code: "code-1",
      state: "state-1",
    });

    const profile = await service.getProfileBySessionToken(result.sessionToken);

    expect(oidcClient.fetchUserInfo).toHaveBeenCalledWith(
      "portal-access-token",
      "portal-user-1",
    );
    expect(profile?.displayName).toBe("Alice Updated");
  });

  it("revokes the local session when portal userinfo rejects the access token", async () => {
    const store = new MemoryBlogStore();
    const { service, oidcClient } = createBlogAccessService(store);
    oidcClient.fetchUserInfo.mockRejectedValueOnce(new Error("invalid_token"));
    await service.createPortalLoginRedirect();
    const result = await service.completeCallback({
      code: "code-1",
      state: "state-1",
    });

    const profile = await service.getProfileBySessionToken(result.sessionToken);

    expect(profile).toBeNull();
    expect(
      (await store.findSessionByToken(result.sessionToken))?.revokedAt,
    ).toBeInstanceOf(Date);
  });
});
