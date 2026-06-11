import {
  allowInsecureRequests,
  authorizationCodeGrant,
  buildAuthorizationUrl,
  calculatePKCECodeChallenge,
  discovery,
  fetchUserInfo,
  None,
  randomNonce,
  randomPKCECodeVerifier,
  randomState,
  type Configuration,
} from 'openid-client'

import type { OidcCallbackResult, OidcPortalUser } from '../../shared/types'

const OIDC_SCOPE = 'openid profile email'

export type OidcAuthorizationRequest = {
  redirectUrl: URL
  state: string
  nonce: string
  codeVerifier: string
}

export type OidcClientPort = {
  createAuthorizationUrl(): Promise<OidcAuthorizationRequest>
  exchangeCallback(input: {
    callbackUrl: string
    codeVerifier: string
    expectedNonce: string
    expectedState: string
  }): Promise<OidcCallbackResult>
  fetchUserInfo(
    accessToken: string,
    expectedSubject: string,
  ): Promise<OidcPortalUser>
}

type OpenidClientOptions = {
  issuer: string
  clientId: string
  redirectUri: string
}

export class OpenidClientAdapter implements OidcClientPort {
  private readonly issuer: string
  private readonly clientId: string
  private readonly redirectUri: string
  private configurationPromise: Promise<Configuration> | null = null

  constructor(options: OpenidClientOptions) {
    this.issuer = options.issuer
    this.clientId = options.clientId
    this.redirectUri = options.redirectUri
  }

  async createAuthorizationUrl(): Promise<OidcAuthorizationRequest> {
    const configuration = await this.getConfiguration()
    const codeVerifier = randomPKCECodeVerifier()
    const codeChallenge = await calculatePKCECodeChallenge(codeVerifier)
    const state = randomState()
    const nonce = randomNonce()
    const redirectUrl = buildAuthorizationUrl(configuration, {
      redirect_uri: this.redirectUri,
      scope: OIDC_SCOPE,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      nonce,
    })
    return { redirectUrl, state, nonce, codeVerifier }
  }

  async exchangeCallback(input: {
    callbackUrl: string
    codeVerifier: string
    expectedNonce: string
    expectedState: string
  }): Promise<OidcCallbackResult> {
    const configuration = await this.getConfiguration()
    const tokens = await authorizationCodeGrant(
      configuration,
      new URL(input.callbackUrl),
      {
        pkceCodeVerifier: input.codeVerifier,
        expectedNonce: input.expectedNonce,
        expectedState: input.expectedState,
        idTokenExpected: true,
      },
    )
    const claims = tokens.claims()
    const accessToken = tokens.access_token
    if (!claims?.sub || !accessToken) {
      throw new Error('invalid_oidc_response')
    }
    const userinfo = await fetchUserInfo(configuration, accessToken, claims.sub)
    return {
      accessToken,
      user: mapUserInfo(userinfo),
    }
  }

  async fetchUserInfo(
    accessToken: string,
    expectedSubject: string,
  ): Promise<OidcPortalUser> {
    const configuration = await this.getConfiguration()
    const userinfo = await fetchUserInfo(
      configuration,
      accessToken,
      expectedSubject,
    )
    return mapUserInfo(userinfo)
  }

  private getConfiguration(): Promise<Configuration> {
    if (!this.configurationPromise) {
      this.configurationPromise = discovery(
        new URL(this.issuer),
        this.clientId,
        {
          redirect_uris: [this.redirectUri],
          response_types: ['code'],
          token_endpoint_auth_method: 'none',
        },
        None(),
        {
          execute: [allowInsecureRequests],
        },
      )
    }
    return this.configurationPromise
  }
}

function mapUserInfo(userinfo: {
  sub?: unknown
  preferred_username?: unknown
  email?: unknown
  name?: unknown
  picture?: unknown
  role?: unknown
}): OidcPortalUser {
  return {
    id: String(userinfo.sub),
    username: String(
      userinfo.preferred_username ?? userinfo.email ?? userinfo.sub,
    ),
    displayName: String(
      userinfo.name ?? userinfo.preferred_username ?? userinfo.sub,
    ),
    avatarUrl: typeof userinfo.picture === 'string' ? userinfo.picture : null,
    role: userinfo.role === 'super_admin' ? 'super_admin' : 'user',
  }
}
