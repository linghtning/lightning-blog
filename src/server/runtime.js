import { AccessService } from '../modules/access/access.service';
import { OpenidClientAdapter } from '../modules/access/oidc-client';
import { readEnv } from '../shared/env';
import { DbBlogStore } from '../shared/db-blog-store';
import { MemoryBlogStore } from '../shared/memory-blog-store';
export async function createRuntime() {
    const env = readEnv();
    const store = env.DATABASE_URL
        ? await DbBlogStore.connect(env.DATABASE_URL)
        : new MemoryBlogStore();
    const access = new AccessService({
        store,
        config: {
            portalBaseUrl: env.PORTAL_BASE_URL,
            publicBaseUrl: env.PUBLIC_BASE_URL,
            ssoCallbackUrl: env.SSO_CALLBACK_URL,
            oidcClientId: env.OIDC_CLIENT_ID,
        },
        oidcClient: new OpenidClientAdapter({
            issuer: env.PORTAL_BASE_URL,
            clientId: env.OIDC_CLIENT_ID,
            redirectUri: env.SSO_CALLBACK_URL,
        }),
    });
    return { env, store, access };
}
