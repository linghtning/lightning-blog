import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import { z } from 'zod';
import { clearSessionToken, getSessionToken, setSessionToken } from './cookies';
const callbackSchema = z.object({
    code: z.string().min(1),
    state: z.string().min(1),
});
const articleSchema = z.object({
    title: z.string().min(1),
    slug: z.string().min(1),
    content: z.string().min(1),
    excerpt: z.string().optional(),
    status: z.enum(['draft', 'published']),
    pinned: z.boolean().optional(),
    categoryId: z.string().uuid().optional(),
    tagIds: z.array(z.string().uuid()).optional(),
});
const commentSchema = z.object({
    content: z.string().min(1),
    parentId: z.string().uuid().optional(),
});
export function createServerApp(runtime) {
    const app = new Hono();
    app.use('*', cors({
        origin: [runtime.env.PUBLIC_BASE_URL, runtime.env.PORTAL_BASE_URL],
        credentials: true,
    }));
    app.get('/api/health', (context) => context.json({
        ok: true,
        service: 'lightning-blog',
        port: runtime.env.PORT,
    }));
    // Auth routes
    app.get('/auth/login', async (context) => {
        const redirectUrl = await runtime.access.createPortalLoginRedirect();
        return context.redirect(redirectUrl.toString());
    });
    app.get('/auth/callback', async (context) => {
        try {
            const query = callbackSchema.parse({
                code: context.req.query('code'),
                state: context.req.query('state'),
            });
            const result = await runtime.access.completeCallback(query);
            setSessionToken(context, result.sessionToken);
            return context.redirect('/');
        }
        catch {
            return context.redirect('/access-denied');
        }
    });
    app.post('/auth/logout', async (context) => {
        const token = getSessionToken(context);
        if (token) {
            await runtime.access.logout(token);
        }
        clearSessionToken(context);
        return context.json({ ok: true });
    });
    app.get('/api/auth/me', async (context) => context.json({
        user: await getCurrentProfile(runtime, getSessionToken(context)),
    }));
    // Public article routes
    app.get('/api/articles', async (context) => {
        const status = context.req.query('status');
        const categoryId = context.req.query('categoryId');
        const tagId = context.req.query('tagId');
        const limit = Number(context.req.query('limit')) || 10;
        const offset = Number(context.req.query('offset')) || 0;
        return context.json({
            articles: await runtime.store.listArticles({
                status: status ?? 'published',
                categoryId,
                tagId,
                limit,
                offset,
            }),
        });
    });
    app.get('/api/articles/:slug', async (context) => {
        const article = await runtime.store.getArticleBySlug(context.req.param('slug'));
        if (!article) {
            return context.json({ error: 'not_found' }, 404);
        }
        return context.json({ article });
    });
    app.get('/api/articles/:id/comments', async (context) => {
        const comments = await runtime.store.listCommentsByArticle(context.req.param('id'));
        return context.json({ comments });
    });
    // Protected article routes
    app.post('/api/articles', async (context) => {
        const user = await requireProfile(context, runtime);
        if (!user) {
            return context.json({ error: 'app_session_required' }, 401);
        }
        const input = articleSchema.parse(await context.req.json());
        const article = await runtime.store.createArticle({
            ...input,
            authorId: user.portalUserId,
        });
        return context.json({ article });
    });
    app.put('/api/articles/:id', async (context) => {
        const user = await requireProfile(context, runtime);
        if (!user) {
            return context.json({ error: 'app_session_required' }, 401);
        }
        const input = articleSchema.partial().parse(await context.req.json());
        const article = await runtime.store.updateArticle(context.req.param('id'), input);
        return context.json({ article });
    });
    app.delete('/api/articles/:id', async (context) => {
        const user = await requireProfile(context, runtime);
        if (!user) {
            return context.json({ error: 'app_session_required' }, 401);
        }
        await runtime.store.deleteArticle(context.req.param('id'));
        return context.json({ ok: true });
    });
    // Protected comment routes
    app.post('/api/articles/:id/comments', async (context) => {
        const user = await requireProfile(context, runtime);
        if (!user) {
            return context.json({ error: 'app_session_required' }, 401);
        }
        const input = commentSchema.parse(await context.req.json());
        const comment = await runtime.store.createComment({
            ...input,
            articleId: context.req.param('id'),
            authorId: user.portalUserId,
        });
        return context.json({ comment });
    });
    app.delete('/api/comments/:id', async (context) => {
        const user = await requireProfile(context, runtime);
        if (!user) {
            return context.json({ error: 'app_session_required' }, 401);
        }
        await runtime.store.deleteComment(context.req.param('id'));
        return context.json({ ok: true });
    });
    // Category routes
    app.get('/api/categories', async (context) => {
        const categories = await runtime.store.listCategories();
        return context.json({ categories });
    });
    app.get('/api/categories/:slug', async (context) => {
        const category = await runtime.store.getCategoryBySlug(context.req.param('slug'));
        if (!category) {
            return context.json({ error: 'not_found' }, 404);
        }
        return context.json({ category });
    });
    app.post('/api/categories', async (context) => {
        const user = await requireProfile(context, runtime);
        if (!user) {
            return context.json({ error: 'app_session_required' }, 401);
        }
        const input = z
            .object({
            name: z.string().min(1),
            slug: z.string().min(1),
            description: z.string().optional(),
            parentId: z.string().uuid().optional(),
        })
            .parse(await context.req.json());
        const category = await runtime.store.createCategory(input);
        return context.json({ category });
    });
    // Tag routes
    app.get('/api/tags', async (context) => {
        const tags = await runtime.store.listTags();
        return context.json({ tags });
    });
    app.get('/api/tags/:slug', async (context) => {
        const tag = await runtime.store.getTagBySlug(context.req.param('slug'));
        if (!tag) {
            return context.json({ error: 'not_found' }, 404);
        }
        return context.json({ tag });
    });
    app.post('/api/tags', async (context) => {
        const user = await requireProfile(context, runtime);
        if (!user) {
            return context.json({ error: 'app_session_required' }, 401);
        }
        const input = z
            .object({
            name: z.string().min(1),
            slug: z.string().min(1),
        })
            .parse(await context.req.json());
        const tag = await runtime.store.createTag(input);
        return context.json({ tag });
    });
    // Search route
    app.get('/api/search', async (context) => {
        const query = context.req.query('q') ?? '';
        const articles = await runtime.store.searchArticles(query);
        return context.json({ articles });
    });
    // Timeline route
    app.get('/api/timeline', async (context) => {
        const articles = await runtime.store.listArticles({
            status: 'published',
            limit: 100,
        });
        return context.json({ articles });
    });
    // Static files
    app.use('/assets/*', serveStatic({ root: './dist' }));
    app.use('/favicon.svg', serveStatic({ path: './dist/favicon.svg' }));
    app.get('*', serveStatic({ path: './dist/index.html' }));
    return app;
}
async function getCurrentProfile(runtime, token) {
    if (!token) {
        return null;
    }
    return runtime.access.getProfileBySessionToken(token);
}
async function requireProfile(context, runtime) {
    return getCurrentProfile(runtime, getSessionToken(context));
}
