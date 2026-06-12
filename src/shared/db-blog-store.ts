import { eq, and, desc, sql, like } from "drizzle-orm";
import { createDbClient } from "../db/client";
import * as schema from "../db/schema";
import type { BlogStore } from "./blog-store";
import { hashToken } from "./secrets";
import type {
  Article,
  Category,
  Tag,
  Comment,
  CreateArticleInput,
  UpdateArticleInput,
  CreateCommentInput,
  PortalUserProfile,
  AppSession,
} from "./types";

const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE article_status AS ENUM ('draft', 'published');
CREATE TYPE user_role AS ENUM ('user', 'super_admin');

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID
);

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  status article_status NOT NULL DEFAULT 'draft',
  pinned BOOLEAN NOT NULL DEFAULT false,
  author_id TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  published_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS article_tags (
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL,
  parent_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portal_user_profiles (
  portal_user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS app_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_user_id TEXT NOT NULL REFERENCES portal_user_profiles(portal_user_id),
  session_token_hash TEXT NOT NULL,
  portal_access_token TEXT NOT NULL DEFAULT '',
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP
);

ALTER TABLE app_sessions
  ADD COLUMN IF NOT EXISTS session_token_hash TEXT;

ALTER TABLE app_sessions
  ADD COLUMN IF NOT EXISTS portal_access_token TEXT NOT NULL DEFAULT '';

UPDATE app_sessions
SET session_token_hash = encode(digest(token, 'sha256'), 'hex')
WHERE session_token_hash IS NULL
  AND token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS blog_app_sessions_session_token_hash_unique
  ON app_sessions (session_token_hash);

ALTER TABLE app_sessions
  ALTER COLUMN session_token_hash SET NOT NULL;
`;

export class DbBlogStore implements BlogStore {
  private db: ReturnType<typeof createDbClient>;

  private constructor(databaseUrl: string) {
    this.db = createDbClient(databaseUrl);
  }

  static async connect(databaseUrl: string): Promise<DbBlogStore> {
    const store = new DbBlogStore(databaseUrl);
    await store.ensureSchema();
    return store;
  }

  static getSchemaSql(): string {
    return SCHEMA_SQL;
  }

  private async ensureSchema(): Promise<void> {
    const statements = SCHEMA_SQL.split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const statement of statements) {
      try {
        await this.db.execute(sql.raw(statement));
      } catch {
        // Ignore duplicate object errors
      }
    }
  }

  async listArticles(filters?: {
    status?: "draft" | "published";
    categoryId?: string;
    tagId?: string;
    authorId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Article[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(schema.articles.status, filters.status));
    }
    if (filters?.categoryId) {
      conditions.push(eq(schema.articles.categoryId, filters.categoryId));
    }
    if (filters?.authorId) {
      conditions.push(eq(schema.articles.authorId, filters.authorId));
    }

    let results;
    if (conditions.length > 0) {
      results = await this.db
        .select()
        .from(schema.articles)
        .where(and(...conditions))
        .orderBy(desc(schema.articles.createdAt))
        .limit(filters?.limit ?? 10)
        .offset(filters?.offset ?? 0);
    } else {
      results = await this.db
        .select()
        .from(schema.articles)
        .orderBy(desc(schema.articles.createdAt))
        .limit(filters?.limit ?? 10)
        .offset(filters?.offset ?? 0);
    }

    return results.map(mapArticle);
  }

  async getArticleBySlug(slug: string): Promise<Article | null> {
    const results = await this.db
      .select()
      .from(schema.articles)
      .where(eq(schema.articles.slug, slug))
      .limit(1);
    return results[0] ? mapArticle(results[0]) : null;
  }

  async getArticleById(id: string): Promise<Article | null> {
    const results = await this.db
      .select()
      .from(schema.articles)
      .where(eq(schema.articles.id, id))
      .limit(1);
    return results[0] ? mapArticle(results[0]) : null;
  }

  async createArticle(input: CreateArticleInput): Promise<Article> {
    const results = await this.db
      .insert(schema.articles)
      .values({
        title: input.title,
        slug: input.slug,
        content: input.content,
        excerpt: input.excerpt,
        status: input.status,
        pinned: input.pinned ?? false,
        authorId: input.authorId,
        categoryId: input.categoryId,
        publishedAt: input.status === "published" ? new Date() : null,
      })
      .returning();

    if (input.tagIds?.length) {
      await this.db.insert(schema.articleTags).values(
        input.tagIds.map((tagId) => ({
          articleId: results[0].id,
          tagId,
        })),
      );
    }

    return mapArticle(results[0]);
  }

  async updateArticle(id: string, input: UpdateArticleInput): Promise<Article> {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (input.title !== undefined) updates.title = input.title;
    if (input.slug !== undefined) updates.slug = input.slug;
    if (input.content !== undefined) updates.content = input.content;
    if (input.excerpt !== undefined) updates.excerpt = input.excerpt;
    if (input.status !== undefined) {
      updates.status = input.status;
      if (input.status === "published") updates.publishedAt = new Date();
    }
    if (input.pinned !== undefined) updates.pinned = input.pinned;
    if (input.categoryId !== undefined) updates.categoryId = input.categoryId;

    const results = await this.db
      .update(schema.articles)
      .set(updates)
      .where(eq(schema.articles.id, id))
      .returning();

    if (input.tagIds) {
      await this.db
        .delete(schema.articleTags)
        .where(eq(schema.articleTags.articleId, id));
      if (input.tagIds.length) {
        await this.db.insert(schema.articleTags).values(
          input.tagIds.map((tagId) => ({
            articleId: id,
            tagId,
          })),
        );
      }
    }

    return mapArticle(results[0]);
  }

  async deleteArticle(id: string): Promise<void> {
    await this.db.delete(schema.articles).where(eq(schema.articles.id, id));
  }

  async searchArticles(query: string): Promise<Article[]> {
    const results = await this.db
      .select()
      .from(schema.articles)
      .where(
        and(
          eq(schema.articles.status, "published"),
          like(schema.articles.title, `%${query}%`),
        ),
      )
      .orderBy(desc(schema.articles.createdAt));
    return results.map(mapArticle);
  }

  async listCategories(): Promise<Category[]> {
    const results = await this.db.select().from(schema.categories);
    return results.map(mapCategory);
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const results = await this.db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.slug, slug))
      .limit(1);
    return results[0] ? mapCategory(results[0]) : null;
  }

  async createCategory(input: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
  }): Promise<Category> {
    const results = await this.db
      .insert(schema.categories)
      .values(input)
      .returning();
    return mapCategory(results[0]);
  }

  async updateCategory(
    id: string,
    input: { name?: string; description?: string },
  ): Promise<Category> {
    const results = await this.db
      .update(schema.categories)
      .set(input)
      .where(eq(schema.categories.id, id))
      .returning();
    return mapCategory(results[0]);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.db.delete(schema.categories).where(eq(schema.categories.id, id));
  }

  async listTags(): Promise<Tag[]> {
    const results = await this.db.select().from(schema.tags);
    return results.map(mapTag);
  }

  async getTagBySlug(slug: string): Promise<Tag | null> {
    const results = await this.db
      .select()
      .from(schema.tags)
      .where(eq(schema.tags.slug, slug))
      .limit(1);
    return results[0] ? mapTag(results[0]) : null;
  }

  async createTag(input: { name: string; slug: string }): Promise<Tag> {
    const results = await this.db.insert(schema.tags).values(input).returning();
    return mapTag(results[0]);
  }

  async deleteTag(id: string): Promise<void> {
    await this.db.delete(schema.tags).where(eq(schema.tags.id, id));
  }

  async listCommentsByArticle(articleId: string): Promise<Comment[]> {
    const results = await this.db
      .select()
      .from(schema.comments)
      .where(eq(schema.comments.articleId, articleId))
      .orderBy(schema.comments.createdAt);
    return results.map(mapComment);
  }

  async createComment(input: CreateCommentInput): Promise<Comment> {
    const results = await this.db
      .insert(schema.comments)
      .values(input)
      .returning();
    return mapComment(results[0]);
  }

  async deleteComment(id: string): Promise<void> {
    await this.db.delete(schema.comments).where(eq(schema.comments.id, id));
  }

  async upsertProfile(profile: PortalUserProfile): Promise<void> {
    await this.db
      .insert(schema.portalUserProfiles)
      .values(profile)
      .onConflictDoUpdate({
        target: schema.portalUserProfiles.portalUserId,
        set: profile,
      });
  }

  async getProfile(portalUserId: string): Promise<PortalUserProfile | null> {
    const results = await this.db
      .select()
      .from(schema.portalUserProfiles)
      .where(eq(schema.portalUserProfiles.portalUserId, portalUserId))
      .limit(1);
    return results[0] ? mapProfile(results[0]) : null;
  }

  async createSession(input: {
    portalUserId: string;
    token: string;
    portalAccessToken: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.db.insert(schema.appSessions).values({
      portalUserId: input.portalUserId,
      sessionTokenHash: hashToken(input.token),
      portalAccessToken: input.portalAccessToken,
      expiresAt: input.expiresAt,
    });
  }

  async findSessionByToken(token: string): Promise<AppSession | null> {
    const results = await this.db
      .select()
      .from(schema.appSessions)
      .where(eq(schema.appSessions.sessionTokenHash, hashToken(token)))
      .limit(1);
    return results[0] ? mapSession(results[0]) : null;
  }

  async revokeSessionByToken(token: string): Promise<void> {
    await this.db
      .update(schema.appSessions)
      .set({ revokedAt: new Date() })
      .where(eq(schema.appSessions.sessionTokenHash, hashToken(token)));
  }
}

function mapArticle(row: typeof schema.articles.$inferSelect): Article {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    excerpt: row.excerpt,
    status: row.status,
    pinned: row.pinned,
    authorId: row.authorId,
    categoryId: row.categoryId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
  };
}

function mapCategory(row: typeof schema.categories.$inferSelect): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    parentId: row.parentId,
  };
}

function mapTag(row: typeof schema.tags.$inferSelect): Tag {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
  };
}

function mapComment(row: typeof schema.comments.$inferSelect): Comment {
  return {
    id: row.id,
    content: row.content,
    articleId: row.articleId,
    authorId: row.authorId,
    parentId: row.parentId,
    createdAt: row.createdAt,
  };
}

function mapProfile(
  row: typeof schema.portalUserProfiles.$inferSelect,
): PortalUserProfile {
  return {
    portalUserId: row.portalUserId,
    username: row.username,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    role: row.role,
  };
}

function mapSession(row: typeof schema.appSessions.$inferSelect): AppSession {
  return {
    id: row.id,
    portalUserId: row.portalUserId,
    sessionTokenHash: row.sessionTokenHash,
    portalAccessToken: row.portalAccessToken,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,
  };
}
