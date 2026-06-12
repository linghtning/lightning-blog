import { createToken } from "../../shared/secrets";
import { addDays } from "../../shared/time";
import type { BlogStore } from "../../shared/blog-store";
import type { OidcClientPort } from "./oidc-client";

type AccessConfig = {
  portalBaseUrl: string;
  publicBaseUrl: string;
  ssoCallbackUrl: string;
  oidcClientId: string;
};

type AccessServiceOptions = {
  store: BlogStore;
  config: AccessConfig;
  oidcClient: OidcClientPort;
};

type PendingAuthorization = {
  state: string;
  nonce: string;
  codeVerifier: string;
  expiresAt: Date;
};

export class AccessService {
  private readonly store: BlogStore;
  private readonly config: AccessConfig;
  private readonly oidcClient: OidcClientPort;
  private readonly pendingAuthorizations = new Map<
    string,
    PendingAuthorization
  >();

  constructor(options: AccessServiceOptions) {
    this.store = options.store;
    this.config = options.config;
    this.oidcClient = options.oidcClient;
  }

  async createPortalLoginRedirect(): Promise<URL> {
    const authorization = await this.oidcClient.createAuthorizationUrl();
    this.pendingAuthorizations.set(authorization.state, {
      state: authorization.state,
      nonce: authorization.nonce,
      codeVerifier: authorization.codeVerifier,
      expiresAt: addDays(new Date(), 1),
    });
    return authorization.redirectUrl;
  }

  hasPendingAuthorization(state: string): boolean {
    const pending = this.pendingAuthorizations.get(state);
    return Boolean(pending && pending.expiresAt > new Date());
  }

  async completeCallback(input: {
    code: string;
    state: string;
  }): Promise<{ sessionToken: string }> {
    const pending = this.pendingAuthorizations.get(input.state);
    if (!pending || pending.expiresAt < new Date()) {
      throw new Error("invalid_state");
    }

    const callbackUrl = new URL(this.config.ssoCallbackUrl);
    callbackUrl.searchParams.set("code", input.code);
    callbackUrl.searchParams.set("state", input.state);
    const oidcResult = await this.oidcClient.exchangeCallback({
      callbackUrl: callbackUrl.toString(),
      codeVerifier: pending.codeVerifier,
      expectedNonce: pending.nonce,
      expectedState: pending.state,
    });

    const sessionToken = createToken();
    await this.store.upsertProfile({
      portalUserId: oidcResult.user.id,
      username: oidcResult.user.username,
      displayName: oidcResult.user.displayName,
      avatarUrl: oidcResult.user.avatarUrl,
      role: oidcResult.user.role,
    });
    await this.store.createSession({
      portalUserId: oidcResult.user.id,
      token: sessionToken,
      portalAccessToken: oidcResult.accessToken,
      expiresAt: addDays(new Date(), 30),
    });
    this.pendingAuthorizations.delete(input.state);
    return { sessionToken };
  }

  async getProfileBySessionToken(sessionToken: string) {
    const session = await this.store.findSessionByToken(sessionToken);
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return null;
    }
    if (!session.portalAccessToken) {
      await this.store.revokeSessionByToken(sessionToken);
      return null;
    }
    try {
      const user = await this.oidcClient.fetchUserInfo(
        session.portalAccessToken,
        session.portalUserId,
      );
      if (user.id !== session.portalUserId) {
        await this.store.revokeSessionByToken(sessionToken);
        return null;
      }
      await this.store.upsertProfile({
        portalUserId: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      });
      return this.store.getProfile(session.portalUserId);
    } catch {
      await this.store.revokeSessionByToken(sessionToken);
      return null;
    }
  }

  async logout(sessionToken: string): Promise<void> {
    await this.store.revokeSessionByToken(sessionToken);
  }
}
