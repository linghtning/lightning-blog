# Lightning Blog Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal blog system with Portal OIDC integration, Markdown editor, categories, tags, comments, and search.

**Architecture:** Full-stack monolith using React 19 + Hono 4 + PostgreSQL 17. Reuse OIDC patterns from lightning-reading-h5. Dual store architecture (memory + PostgreSQL) for development flexibility.

**Tech Stack:** React 19, Vite 8, Hono 4, PostgreSQL 17, Drizzle ORM, Tailwind CSS v4, shadcn/ui, openid-client v6, Zod v4, pnpm 10.33, Vitest 4

---

## Chunk 1: Project Scaffold and Core Infrastructure

### Task 1: Initialize Project

**Files:**

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/index.css`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "lightning-blog",
  "private": true,
  "version": "0.0.0",
  "packageManager": "pnpm@10.33.2",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "server": "tsx src/server/index.ts",
    "start": "NODE_ENV=production tsx src/server/index.ts",
    "build": "tsc -b && vite build",
    "lint": "oxlint .",
    "lint:fix": "oxlint --fix .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "tsc -b",
    "test": "vitest run",
    "preview": "vite preview --host 0.0.0.0",
    "verify": "pnpm run format:check && pnpm run lint && pnpm run type-check && pnpm run test && pnpm run build",
    "prepare": "simple-git-hooks"
  },
  "simple-git-hooks": {
    "pre-commit": "pnpm run verify"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
pnpm add react react-dom @hono/node-server hono @tailwindcss/vite tailwindcss @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react openid-client drizzle-orm postgres zod @tanstack/react-query react-markdown rehype-highlight
pnpm add -D @types/node @types/react @types/react-dom @vitejs/plugin-react typescript vite vitest oxlint prettier simple-git-hooks tsx drizzle-kit
```

- [ ] **Step 3: Create TypeScript configs**

Create `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

Create `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create Vite config**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:10004",
      "/auth": "http://localhost:10004",
    },
  },
});
```

- [ ] **Step 5: Create index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lightning Blog</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create main.tsx**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./app/App";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
```

- [ ] **Step 7: Create index.css**

```css
@import "tailwindcss";

@theme inline {
  --color-background: #0f1115;
  --color-foreground: #edf0f4;
  --color-muted: #6b7280;
  --color-border: #1f2937;
  --color-card: #1a1d23;
  --color-primary: #3b82f6;
  --color-primary-foreground: #ffffff;
  --color-secondary: #6366f1;
  --color-accent: #8b5cf6;
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}
```

- [ ] **Step 8: Run type check**

```bash
pnpm run type-check
```

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "feat: initialize project scaffold"
```

---

### Task 2: Environment Configuration

**Files:**

- Create: `src/shared/env.ts`
- Create: `.env.example`

- [ ] **Step 1: Create env.ts**

```typescript
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(10004),
  DATABASE_URL: z.string().optional(),
  PUBLIC_BASE_URL: z.string().default("http://blog.orgcatfun.site"),
  PORTAL_BASE_URL: z.string().default("http://orgcatfun.site"),
  SSO_CALLBACK_URL: z
    .string()
    .default("http://blog.orgcatfun.site/auth/callback"),
  OIDC_CLIENT_ID: z.string().default("blog"),
});

export type BlogEnv = z.infer<typeof envSchema>;

export function readEnv(source = process.env): BlogEnv {
  return envSchema.parse(source);
}
```

- [ ] **Step 2: Create .env.example**

```
NODE_ENV=development
PORT=10004
DATABASE_URL=postgresql://user:password@localhost:15404/blog
PUBLIC_BASE_URL=http://blog.orgcatfun.site
PORTAL_BASE_URL=http://orgcatfun.site
SSO_CALLBACK_URL=http://blog.orgcatfun.site/auth/callback
OIDC_CLIENT_ID=blog
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/env.ts .env.example
git commit -m "feat: add environment configuration"
```

---

### Task 3: Utility Functions

**Files:**

- Create: `src/lib/utils.ts`
- Create: `src/shared/secrets.ts`
- Create: `src/shared/time.ts`

- [ ] **Step 1: Create utils.ts**

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Create secrets.ts**

```typescript
import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";

export function createToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

- [ ] **Step 3: Create time.ts**

```typescript
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return "刚刚";
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/utils.ts src/shared/secrets.ts src/shared/time.ts
git commit -m "feat: add utility functions"
```

---

## Chunk 2: Database and Store Layer

### Task 4: Database Schema

**Files:**

- Create: `src/db/schema.ts`
- Create: `src/db/client.ts`
- Create: `drizzle.config.ts`

- [ ] **Step 1: Create schema.ts**

```typescript
import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const articleStatusEnum = pgEnum("article_status", [
  "draft",
  "published",
]);

export const userRoleEnum = pgEnum("user_role", ["user", "super_admin"]);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  parentId: uuid("parent_id"),
});

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const articles = pgTable("articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  status: articleStatusEnum("status").notNull().default("draft"),
  pinned: boolean("pinned").notNull().default(false),
  authorId: text("author_id").notNull(),
  categoryId: uuid("category_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  publishedAt: timestamp("published_at"),
});

export const articleTags = pgTable("article_tags", {
  articleId: uuid("article_id")
    .notNull()
    .references(() => articles.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
});

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  articleId: uuid("article_id")
    .notNull()
    .references(() => articles.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull(),
  parentId: uuid("parent_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const portalUserProfiles = pgTable("portal_user_profiles", {
  portalUserId: text("portal_user_id").primaryKey(),
  username: text("username").notNull(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").notNull().default("user"),
});

export const appSessions = pgTable("app_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  portalUserId: text("portal_user_id")
    .notNull()
    .references(() => portalUserProfiles.portalUserId),
  token: text("token").notNull().unique(),
  portalAccessToken: text("portal_access_token"),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
});
```

- [ ] **Step 2: Create client.ts**

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createDbClient(databaseUrl: string) {
  const client = postgres(databaseUrl);
  return drizzle(client, { schema });
}
```

- [ ] **Step 3: Create drizzle.config.ts**

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 4: Run migrations**

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/db/client.ts drizzle.config.ts
git commit -m "feat: add database schema and client"
```

---

### Task 5: Store Interface and Implementations

**Files:**

- Create: `src/shared/types.ts`
- Create: `src/shared/blog-store.ts`
- Create: `src/shared/memory-blog-store.ts`
- Create: `src/shared/db-blog-store.ts`

- [ ] **Step 1: Create types.ts**

```typescript
export type PortalUserProfile = {
  portalUserId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: "user" | "super_admin";
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  status: "draft" | "published";
  pinned: boolean;
  authorId: string;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
};

export type Comment = {
  id: string;
  content: string;
  articleId: string;
  authorId: string;
  parentId: string | null;
  createdAt: Date;
};

export type CreateArticleInput = {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: "draft" | "published";
  pinned?: boolean;
  authorId: string;
  categoryId?: string;
  tagIds?: string[];
};

export type UpdateArticleInput = Partial<Omit<CreateArticleInput, "authorId">>;

export type CreateCommentInput = {
  content: string;
  articleId: string;
  authorId: string;
  parentId?: string;
};

export type OidcPortalUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: "user" | "super_admin";
};

export type OidcCallbackResult = {
  accessToken: string;
  user: OidcPortalUser;
};

export type AppSession = {
  id: string;
  portalUserId: string;
  token: string;
  portalAccessToken: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
};
```

- [ ] **Step 2: Create blog-store.ts**

```typescript
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

export interface BlogStore {
  // Articles
  listArticles(filters?: {
    status?: "draft" | "published";
    categoryId?: string;
    tagId?: string;
    authorId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Article[]>;
  getArticleBySlug(slug: string): Promise<Article | null>;
  getArticleById(id: string): Promise<Article | null>;
  createArticle(input: CreateArticleInput): Promise<Article>;
  updateArticle(id: string, input: UpdateArticleInput): Promise<Article>;
  deleteArticle(id: string): Promise<void>;
  searchArticles(query: string): Promise<Article[]>;

  // Categories
  listCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
  createCategory(input: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
  }): Promise<Category>;
  updateCategory(
    id: string,
    input: { name?: string; description?: string },
  ): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Tags
  listTags(): Promise<Tag[]>;
  getTagBySlug(slug: string): Promise<Tag | null>;
  createTag(input: { name: string; slug: string }): Promise<Tag>;
  deleteTag(id: string): Promise<void>;

  // Comments
  listCommentsByArticle(articleId: string): Promise<Comment[]>;
  createComment(input: CreateCommentInput): Promise<Comment>;
  deleteComment(id: string): Promise<void>;

  // User Profiles
  upsertProfile(profile: PortalUserProfile): Promise<void>;
  getProfile(portalUserId: string): Promise<PortalUserProfile | null>;

  // Sessions
  createSession(input: {
    portalUserId: string;
    token: string;
    portalAccessToken?: string;
    expiresAt: Date;
  }): Promise<void>;
  findSessionByToken(token: string): Promise<AppSession | null>;
  revokeSessionByToken(token: string): Promise<void>;
}
```

- [ ] **Step 3: Create memory-blog-store.ts**

```typescript
import type { BlogStore } from "./blog-store";
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

export class MemoryBlogStore implements BlogStore {
  private articles = new Map<string, Article>();
  private categories = new Map<string, Category>();
  private tags = new Map<string, Tag>();
  private articleTags = new Map<string, Set<string>>();
  private comments = new Map<string, Comment>();
  private profiles = new Map<string, PortalUserProfile>();
  private sessions = new Map<string, AppSession>();

  async listArticles(filters?: {
    status?: "draft" | "published";
    categoryId?: string;
    tagId?: string;
    authorId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Article[]> {
    let articles = Array.from(this.articles.values());

    if (filters?.status) {
      articles = articles.filter((a) => a.status === filters.status);
    }
    if (filters?.categoryId) {
      articles = articles.filter((a) => a.categoryId === filters.categoryId);
    }
    if (filters?.authorId) {
      articles = articles.filter((a) => a.authorId === filters.authorId);
    }
    if (filters?.tagId) {
      const articleIds = this.articleTags.get(filters.tagId) ?? new Set();
      articles = articles.filter((a) => articleIds.has(a.id));
    }

    articles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 10;
    return articles.slice(offset, offset + limit);
  }

  async getArticleBySlug(slug: string): Promise<Article | null> {
    for (const article of this.articles.values()) {
      if (article.slug === slug) return article;
    }
    return null;
  }

  async getArticleById(id: string): Promise<Article | null> {
    return this.articles.get(id) ?? null;
  }

  async createArticle(input: CreateArticleInput): Promise<Article> {
    const article: Article = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: input.status === "published" ? new Date() : null,
    };
    this.articles.set(article.id, article);

    if (input.tagIds) {
      const tagSet = new Set(input.tagIds);
      this.articleTags.set(article.id, tagSet);
    }

    return article;
  }

  async updateArticle(id: string, input: UpdateArticleInput): Promise<Article> {
    const existing = this.articles.get(id);
    if (!existing) throw new Error("Article not found");

    const updated: Article = {
      ...existing,
      ...input,
      updatedAt: new Date(),
      publishedAt:
        input.status === "published" && existing.status !== "published"
          ? new Date()
          : existing.publishedAt,
    };
    this.articles.set(id, updated);

    if (input.tagIds) {
      const tagSet = new Set(input.tagIds);
      this.articleTags.set(id, tagSet);
    }

    return updated;
  }

  async deleteArticle(id: string): Promise<void> {
    this.articles.delete(id);
    this.articleTags.delete(id);
  }

  async searchArticles(query: string): Promise<Article[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.articles.values())
      .filter(
        (a) =>
          a.title.toLowerCase().includes(lowerQuery) ||
          a.content.toLowerCase().includes(lowerQuery),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async listCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    for (const category of this.categories.values()) {
      if (category.slug === slug) return category;
    }
    return null;
  }

  async createCategory(input: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
  }): Promise<Category> {
    const category: Category = {
      id: crypto.randomUUID(),
      ...input,
    };
    this.categories.set(category.id, category);
    return category;
  }

  async updateCategory(
    id: string,
    input: { name?: string; description?: string },
  ): Promise<Category> {
    const existing = this.categories.get(id);
    if (!existing) throw new Error("Category not found");
    const updated = { ...existing, ...input };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    this.categories.delete(id);
  }

  async listTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async getTagBySlug(slug: string): Promise<Tag | null> {
    for (const tag of this.tags.values()) {
      if (tag.slug === slug) return tag;
    }
    return null;
  }

  async createTag(input: { name: string; slug: string }): Promise<Tag> {
    const tag: Tag = {
      id: crypto.randomUUID(),
      ...input,
    };
    this.tags.set(tag.id, tag);
    return tag;
  }

  async deleteTag(id: string): Promise<void> {
    this.tags.delete(id);
  }

  async listCommentsByArticle(articleId: string): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter((c) => c.articleId === articleId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createComment(input: CreateCommentInput): Promise<Comment> {
    const comment: Comment = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: new Date(),
    };
    this.comments.set(comment.id, comment);
    return comment;
  }

  async deleteComment(id: string): Promise<void> {
    this.comments.delete(id);
  }

  async upsertProfile(profile: PortalUserProfile): Promise<void> {
    this.profiles.set(profile.portalUserId, profile);
  }

  async getProfile(portalUserId: string): Promise<PortalUserProfile | null> {
    return this.profiles.get(portalUserId) ?? null;
  }

  async createSession(input: {
    portalUserId: string;
    token: string;
    portalAccessToken?: string;
    expiresAt: Date;
  }): Promise<void> {
    const session: AppSession = {
      id: crypto.randomUUID(),
      portalUserId: input.portalUserId,
      token: input.token,
      portalAccessToken: input.portalAccessToken ?? null,
      expiresAt: input.expiresAt,
      revokedAt: null,
    };
    this.sessions.set(session.id, session);
  }

  async findSessionByToken(token: string): Promise<AppSession | null> {
    for (const session of this.sessions.values()) {
      if (session.token === token) return session;
    }
    return null;
  }

  async revokeSessionByToken(token: string): Promise<void> {
    for (const session of this.sessions.values()) {
      if (session.token === token) {
        session.revokedAt = new Date();
      }
    }
  }
}
```

- [ ] **Step 4: Create db-blog-store.ts**

```typescript
import { eq, and, desc, sql, like } from "drizzle-orm";
import { createDbClient } from "../db/client";
import * as schema from "../db/schema";
import type { BlogStore } from "./blog-store";
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
  token TEXT NOT NULL UNIQUE,
  portal_access_token TEXT,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP
);
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

    let query = this.db.select().from(schema.articles);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(schema.articles.createdAt))
      .limit(filters?.limit ?? 10)
      .offset(filters?.offset ?? 0);

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
    portalAccessToken?: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.db.insert(schema.appSessions).values({
      portalUserId: input.portalUserId,
      token: input.token,
      portalAccessToken: input.portalAccessToken,
      expiresAt: input.expiresAt,
    });
  }

  async findSessionByToken(token: string): Promise<AppSession | null> {
    const results = await this.db
      .select()
      .from(schema.appSessions)
      .where(eq(schema.appSessions.token, token))
      .limit(1);
    return results[0] ? mapSession(results[0]) : null;
  }

  async revokeSessionByToken(token: string): Promise<void> {
    await this.db
      .update(schema.appSessions)
      .set({ revokedAt: new Date() })
      .where(eq(schema.appSessions.token, token));
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
    token: row.token,
    portalAccessToken: row.portalAccessToken,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,
  };
}
```

- [ ] **Step 5: Commit**

```bash
git add src/shared/types.ts src/shared/blog-store.ts src/shared/memory-blog-store.ts src/shared/db-blog-store.ts
git commit -m "feat: add store interface and implementations"
```

---

## Chunk 3: Authentication and Server

### Task 6: OIDC Authentication

**Files:**

- Create: `src/modules/access/oidc-client.ts`
- Create: `src/modules/access/access.service.ts`

- [ ] **Step 1: Create oidc-client.ts**

```typescript
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
} from "openid-client";

import type { OidcCallbackResult, OidcPortalUser } from "../../shared/types";

const OIDC_SCOPE = "openid profile email";

export type OidcAuthorizationRequest = {
  redirectUrl: URL;
  state: string;
  nonce: string;
  codeVerifier: string;
};

export type OidcClientPort = {
  createAuthorizationUrl(): Promise<OidcAuthorizationRequest>;
  exchangeCallback(input: {
    callbackUrl: string;
    codeVerifier: string;
    expectedNonce: string;
    expectedState: string;
  }): Promise<OidcCallbackResult>;
  fetchUserInfo(
    accessToken: string,
    expectedSubject: string,
  ): Promise<OidcPortalUser>;
};

type OpenidClientOptions = {
  issuer: string;
  clientId: string;
  redirectUri: string;
};

export class OpenidClientAdapter implements OidcClientPort {
  private readonly issuer: string;
  private readonly clientId: string;
  private readonly redirectUri: string;
  private configurationPromise: Promise<Configuration> | null = null;

  constructor(options: OpenidClientOptions) {
    this.issuer = options.issuer;
    this.clientId = options.clientId;
    this.redirectUri = options.redirectUri;
  }

  async createAuthorizationUrl(): Promise<OidcAuthorizationRequest> {
    const configuration = await this.getConfiguration();
    const codeVerifier = randomPKCECodeVerifier();
    const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
    const state = randomState();
    const nonce = randomNonce();
    const redirectUrl = buildAuthorizationUrl(configuration, {
      redirect_uri: this.redirectUri,
      scope: OIDC_SCOPE,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
      nonce,
    });
    return { redirectUrl, state, nonce, codeVerifier };
  }

  async exchangeCallback(input: {
    callbackUrl: string;
    codeVerifier: string;
    expectedNonce: string;
    expectedState: string;
  }): Promise<OidcCallbackResult> {
    const configuration = await this.getConfiguration();
    const tokens = await authorizationCodeGrant(
      configuration,
      new URL(input.callbackUrl),
      {
        pkceCodeVerifier: input.codeVerifier,
        expectedNonce: input.expectedNonce,
        expectedState: input.expectedState,
        idTokenExpected: true,
      },
    );
    const claims = tokens.claims();
    const accessToken = tokens.access_token;
    if (!claims?.sub || !accessToken) {
      throw new Error("invalid_oidc_response");
    }
    const userinfo = await fetchUserInfo(
      configuration,
      accessToken,
      claims.sub,
    );
    return {
      accessToken,
      user: mapUserInfo(userinfo),
    };
  }

  async fetchUserInfo(
    accessToken: string,
    expectedSubject: string,
  ): Promise<OidcPortalUser> {
    const configuration = await this.getConfiguration();
    const userinfo = await fetchUserInfo(
      configuration,
      accessToken,
      expectedSubject,
    );
    return mapUserInfo(userinfo);
  }

  private getConfiguration(): Promise<Configuration> {
    if (!this.configurationPromise) {
      this.configurationPromise = discovery(
        new URL(this.issuer),
        this.clientId,
        {
          redirect_uris: [this.redirectUri],
          response_types: ["code"],
          token_endpoint_auth_method: "none",
        },
        None(),
        {
          execute: [allowInsecureRequests],
        },
      );
    }
    return this.configurationPromise;
  }
}

function mapUserInfo(userinfo: {
  sub?: unknown;
  preferred_username?: unknown;
  email?: unknown;
  name?: unknown;
  picture?: unknown;
  role?: unknown;
}): OidcPortalUser {
  return {
    id: String(userinfo.sub),
    username: String(
      userinfo.preferred_username ?? userinfo.email ?? userinfo.sub,
    ),
    displayName: String(
      userinfo.name ?? userinfo.preferred_username ?? userinfo.sub,
    ),
    avatarUrl: typeof userinfo.picture === "string" ? userinfo.picture : null,
    role: userinfo.role === "super_admin" ? "super_admin" : "user",
  };
}
```

- [ ] **Step 2: Create access.service.ts**

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/access/oidc-client.ts src/modules/access/access.service.ts
git commit -m "feat: add OIDC authentication"
```

---

### Task 7: Server Setup

**Files:**

- Create: `src/server/cookies.ts`
- Create: `src/server/runtime.ts`
- Create: `src/server/app.ts`
- Create: `src/server/index.ts`

- [ ] **Step 1: Create cookies.ts**

```typescript
import type { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";

const SESSION_TOKEN_KEY = "lightning_blog_session";

export function getSessionToken(context: Context): string | null {
  return getCookie(context, SESSION_TOKEN_KEY) ?? null;
}

export function setSessionToken(context: Context, token: string): void {
  setCookie(context, SESSION_TOKEN_KEY, token, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export function clearSessionToken(context: Context): void {
  deleteCookie(context, SESSION_TOKEN_KEY, { path: "/" });
}
```

- [ ] **Step 2: Create runtime.ts**

```typescript
import { AccessService } from "../modules/access/access.service";
import { OpenidClientAdapter } from "../modules/access/oidc-client";
import { readEnv, type BlogEnv } from "../shared/env";
import { DbBlogStore } from "../shared/db-blog-store";
import { MemoryBlogStore } from "../shared/memory-blog-store";
import type { BlogStore } from "../shared/blog-store";

export type BlogRuntime = {
  env: BlogEnv;
  store: BlogStore;
  access: AccessService;
};

export async function createRuntime(): Promise<BlogRuntime> {
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
```

- [ ] **Step 3: Create app.ts**

```typescript
import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { z } from "zod";

import type { PortalUserProfile } from "../shared/types";
import type { BlogRuntime } from "./runtime";
import { clearSessionToken, getSessionToken, setSessionToken } from "./cookies";

const callbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

const articleSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  status: z.enum(["draft", "published"]),
  pinned: z.boolean().optional(),
  categoryId: z.string().uuid().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

const commentSchema = z.object({
  content: z.string().min(1),
  parentId: z.string().uuid().optional(),
});

export function createServerApp(runtime: BlogRuntime) {
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: [runtime.env.PUBLIC_BASE_URL, runtime.env.PORTAL_BASE_URL],
      credentials: true,
    }),
  );

  app.get("/api/health", (context) =>
    context.json({
      ok: true,
      service: "lightning-blog",
      port: runtime.env.PORT,
    }),
  );

  // Auth routes
  app.get("/auth/login", async (context) => {
    const redirectUrl = await runtime.access.createPortalLoginRedirect();
    return context.redirect(redirectUrl.toString());
  });

  app.get("/auth/callback", async (context) => {
    try {
      const query = callbackSchema.parse({
        code: context.req.query("code"),
        state: context.req.query("state"),
      });
      const result = await runtime.access.completeCallback(query);
      setSessionToken(context, result.sessionToken);
      return context.redirect("/");
    } catch {
      return context.redirect("/access-denied");
    }
  });

  app.post("/auth/logout", async (context) => {
    const token = getSessionToken(context);
    if (token) {
      await runtime.access.logout(token);
    }
    clearSessionToken(context);
    return context.json({ ok: true });
  });

  app.get("/api/auth/me", async (context) =>
    context.json({
      user: await getCurrentProfile(runtime, getSessionToken(context)),
    }),
  );

  // Public article routes
  app.get("/api/articles", async (context) => {
    const status = context.req.query("status") as
      | "draft"
      | "published"
      | undefined;
    const categoryId = context.req.query("categoryId");
    const tagId = context.req.query("tagId");
    const limit = Number(context.req.query("limit")) || 10;
    const offset = Number(context.req.query("offset")) || 0;

    return context.json({
      articles: await runtime.store.listArticles({
        status: status ?? "published",
        categoryId,
        tagId,
        limit,
        offset,
      }),
    });
  });

  app.get("/api/articles/:slug", async (context) => {
    const article = await runtime.store.getArticleBySlug(
      context.req.param("slug"),
    );
    if (!article) {
      return context.json({ error: "not_found" }, 404);
    }
    return context.json({ article });
  });

  app.get("/api/articles/:id/comments", async (context) => {
    const comments = await runtime.store.listCommentsByArticle(
      context.req.param("id"),
    );
    return context.json({ comments });
  });

  // Protected article routes
  app.post("/api/articles", async (context) => {
    const user = await requireProfile(context, runtime);
    if (!user) {
      return context.json({ error: "app_session_required" }, 401);
    }
    const input = articleSchema.parse(await context.req.json());
    const article = await runtime.store.createArticle({
      ...input,
      authorId: user.portalUserId,
    });
    return context.json({ article });
  });

  app.put("/api/articles/:id", async (context) => {
    const user = await requireProfile(context, runtime);
    if (!user) {
      return context.json({ error: "app_session_required" }, 401);
    }
    const input = articleSchema.partial().parse(await context.req.json());
    const article = await runtime.store.updateArticle(
      context.req.param("id"),
      input,
    );
    return context.json({ article });
  });

  app.delete("/api/articles/:id", async (context) => {
    const user = await requireProfile(context, runtime);
    if (!user) {
      return context.json({ error: "app_session_required" }, 401);
    }
    await runtime.store.deleteArticle(context.req.param("id"));
    return context.json({ ok: true });
  });

  // Protected comment routes
  app.post("/api/articles/:id/comments", async (context) => {
    const user = await requireProfile(context, runtime);
    if (!user) {
      return context.json({ error: "app_session_required" }, 401);
    }
    const input = commentSchema.parse(await context.req.json());
    const comment = await runtime.store.createComment({
      ...input,
      articleId: context.req.param("id"),
      authorId: user.portalUserId,
    });
    return context.json({ comment });
  });

  app.delete("/api/comments/:id", async (context) => {
    const user = await requireProfile(context, runtime);
    if (!user) {
      return context.json({ error: "app_session_required" }, 401);
    }
    await runtime.store.deleteComment(context.req.param("id"));
    return context.json({ ok: true });
  });

  // Category routes
  app.get("/api/categories", async (context) => {
    const categories = await runtime.store.listCategories();
    return context.json({ categories });
  });

  app.get("/api/categories/:slug", async (context) => {
    const category = await runtime.store.getCategoryBySlug(
      context.req.param("slug"),
    );
    if (!category) {
      return context.json({ error: "not_found" }, 404);
    }
    return context.json({ category });
  });

  app.post("/api/categories", async (context) => {
    const user = await requireProfile(context, runtime);
    if (!user) {
      return context.json({ error: "app_session_required" }, 401);
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
  app.get("/api/tags", async (context) => {
    const tags = await runtime.store.listTags();
    return context.json({ tags });
  });

  app.get("/api/tags/:slug", async (context) => {
    const tag = await runtime.store.getTagBySlug(context.req.param("slug"));
    if (!tag) {
      return context.json({ error: "not_found" }, 404);
    }
    return context.json({ tag });
  });

  app.post("/api/tags", async (context) => {
    const user = await requireProfile(context, runtime);
    if (!user) {
      return context.json({ error: "app_session_required" }, 401);
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
  app.get("/api/search", async (context) => {
    const query = context.req.query("q") ?? "";
    const articles = await runtime.store.searchArticles(query);
    return context.json({ articles });
  });

  // Timeline route
  app.get("/api/timeline", async (context) => {
    const articles = await runtime.store.listArticles({
      status: "published",
      limit: 100,
    });
    return context.json({ articles });
  });

  // Static files
  app.use("/assets/*", serveStatic({ root: "./dist" }));
  app.use("/favicon.svg", serveStatic({ path: "./dist/favicon.svg" }));
  app.get("*", serveStatic({ path: "./dist/index.html" }));

  return app;
}

async function getCurrentProfile(
  runtime: BlogRuntime,
  token: string | null,
): Promise<PortalUserProfile | null> {
  if (!token) {
    return null;
  }
  return runtime.access.getProfileBySessionToken(token);
}

async function requireProfile(
  context: Context,
  runtime: BlogRuntime,
): Promise<PortalUserProfile | null> {
  return getCurrentProfile(runtime, getSessionToken(context));
}
```

- [ ] **Step 4: Create index.ts**

```typescript
import { serve } from "@hono/node-server";
import { createRuntime } from "./runtime";
import { createServerApp } from "./app";

async function main() {
  const runtime = await createRuntime();
  const app = createServerApp(runtime);

  serve(
    {
      fetch: app.fetch,
      port: runtime.env.PORT,
    },
    (info) => {
      console.log(
        `Lightning Blog server running on http://localhost:${info.port}`,
      );
    },
  );
}

main().catch(console.error);
```

- [ ] **Step 5: Commit**

```bash
git add src/server/
git commit -m "feat: add server setup with routes"
```

---

## Chunk 4: Frontend Components

### Task 8: Layout and Navigation

**Files:**

- Create: `src/layouts/AppLayout.tsx`
- Create: `src/layouts/AdminLayout.tsx`
- Create: `src/app/App.tsx`
- Create: `src/lib/routes.ts`
- Create: `src/lib/api.ts`

- [ ] **Step 1: Create routes.ts**

```typescript
export type AppRoute =
  | { name: "home" }
  | { name: "article"; slug: string }
  | { name: "category"; slug: string }
  | { name: "tag"; slug: string }
  | { name: "timeline" }
  | { name: "search"; query: string }
  | { name: "admin" }
  | { name: "admin-articles" }
  | { name: "admin-article-new" }
  | { name: "admin-article-edit"; id: string }
  | { name: "admin-categories" }
  | { name: "admin-tags" }
  | { name: "callback" }
  | { name: "access-denied" }
  | { name: "not-found" };

export function matchRoute(pathname: string): AppRoute {
  if (pathname === "/") return { name: "home" };
  if (pathname === "/timeline") return { name: "timeline" };
  if (pathname === "/callback") return { name: "callback" };
  if (pathname === "/access-denied") return { name: "access-denied" };

  if (pathname.startsWith("/articles/")) {
    const slug = pathname.slice("/articles/".length);
    return { name: "article", slug };
  }

  if (pathname.startsWith("/categories/")) {
    const slug = pathname.slice("/categories/".length);
    return { name: "category", slug };
  }

  if (pathname.startsWith("/tags/")) {
    const slug = pathname.slice("/tags/".length);
    return { name: "tag", slug };
  }

  if (pathname.startsWith("/search")) {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q") ?? "";
    return { name: "search", query };
  }

  if (pathname === "/admin") return { name: "admin" };
  if (pathname === "/admin/articles") return { name: "admin-articles" };
  if (pathname === "/admin/articles/new") return { name: "admin-article-new" };
  if (pathname.startsWith("/admin/articles/") && pathname.endsWith("/edit")) {
    const id = pathname.slice("/admin/articles/".length, -"/edit".length);
    return { name: "admin-article-edit", id };
  }
  if (pathname === "/admin/categories") return { name: "admin-categories" };
  if (pathname === "/admin/tags") return { name: "admin-tags" };

  return { name: "not-found" };
}

export function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
```

- [ ] **Step 2: Create api.ts**

```typescript
const BASE_URL = "";

export async function requestJson<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function getPortalSnapshot() {
  return requestJson<{
    user: { displayName: string; avatarUrl: string | null } | null;
  }>("/api/auth/me");
}
```

- [ ] **Step 3: Create AppLayout.tsx**

```tsx
import { useEffect, useState } from "react";
import { BookOpen, Search, Menu, X, LogOut, PenSquare } from "lucide-react";
import { cn } from "../lib/utils";
import { navigate } from "../lib/api";

type AppLayoutProps = {
  children: React.ReactNode;
  user: { displayName: string; avatarUrl: string | null } | null;
};

export function AppLayout({ children, user }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <BookOpen className="w-6 h-6" />
            <span className="font-bold text-lg">Lightning Blog</span>
          </a>

          <nav className="hidden md:flex items-center gap-6">
            <a
              href="/"
              className="text-muted hover:text-foreground transition-colors"
            >
              首页
            </a>
            <a
              href="/timeline"
              className="text-muted hover:text-foreground transition-colors"
            >
              时间线
            </a>
            {user && (
              <a
                href="/admin"
                className="text-muted hover:text-foreground transition-colors"
              >
                管理
              </a>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted hidden md:inline">
                  {user.displayName}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-muted hover:text-foreground transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <a
                href="/auth/login"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                登录
              </a>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-muted hover:text-foreground"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <nav className="flex flex-col p-4 gap-4">
              <a href="/" className="text-muted hover:text-foreground">
                首页
              </a>
              <a href="/timeline" className="text-muted hover:text-foreground">
                时间线
              </a>
              {user && (
                <a href="/admin" className="text-muted hover:text-foreground">
                  管理
                </a>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-border py-8 text-center text-muted text-sm">
        <p>Powered by Lightning Blog</p>
      </footer>
    </div>
  );
}
```

- [ ] **Step 4: Create AdminLayout.tsx**

```tsx
import { BookOpen, FileText, Tag, FolderOpen, ArrowLeft } from "lucide-react";
import { cn } from "../lib/utils";

type AdminLayoutProps = {
  children: React.ReactNode;
  currentPath: string;
};

export function AdminLayout({ children, currentPath }: AdminLayoutProps) {
  const navItems = [
    { href: "/admin", label: "仪表盘", icon: BookOpen },
    { href: "/admin/articles", label: "文章管理", icon: FileText },
    { href: "/admin/categories", label: "分类管理", icon: FolderOpen },
    { href: "/admin/tags", label: "标签管理", icon: Tag },
  ];

  return (
    <div className="flex gap-8">
      <aside className="w-48 flex-shrink-0">
        <a
          href="/"
          className="flex items-center gap-2 text-muted hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回博客</span>
        </a>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                currentPath === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:text-foreground hover:bg-card",
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
```

- [ ] **Step 5: Create App.tsx**

```tsx
import { useEffect, useState } from "react";
import { matchRoute } from "../lib/routes";
import { getPortalSnapshot } from "../lib/api";
import { AppLayout } from "../layouts/AppLayout";

export function App() {
  const [route, setRoute] = useState(matchRoute(window.location.pathname));
  const [user, setUser] = useState<{
    displayName: string;
    avatarUrl: string | null;
  } | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(matchRoute(window.location.pathname));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    getPortalSnapshot()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    setRoute(matchRoute(window.location.pathname));
  }, [window.location.pathname]);

  return (
    <AppLayout user={user}>
      <div>Route: {route.name}</div>
    </AppLayout>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/layouts/ src/app/ src/lib/routes.ts src/lib/api.ts
git commit -m "feat: add layout and navigation components"
```

---

### Task 9: UI Components

**Files:**

- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/textarea.tsx`

- [ ] **Step 1: Create button.tsx**

```tsx
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline:
          "border border-border bg-transparent hover:bg-card text-foreground",
        secondary: "bg-card text-foreground hover:bg-card/80",
        ghost: "hover:bg-card text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

- [ ] **Step 2: Create badge.tsx**

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-card text-foreground",
        destructive: "border-transparent bg-red-500 text-white",
        outline: "text-foreground border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
```

- [ ] **Step 3: Create card.tsx**

```tsx
import { cn } from "../../lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}
```

- [ ] **Step 4: Create input.tsx**

```tsx
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 5: Create textarea.tsx**

```tsx
import { cn } from "../../lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add UI components"
```

---

### Task 10: Article Components

**Files:**

- Create: `src/features/articles/ArticleCard.tsx`
- Create: `src/features/articles/ArticleList.tsx`
- Create: `src/features/articles/ArticleDetail.tsx`
- Create: `src/features/articles/ArticleEditor.tsx`

- [ ] **Step 1: Create ArticleCard.tsx**

```tsx
import { Pin, Clock, Tag } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { formatRelativeTime } from "../../shared/time";
import type { Article } from "../../shared/types";

type ArticleCardProps = {
  article: Article;
};

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card className="p-6 hover:border-primary/50 transition-colors">
      <a href={`/articles/${article.slug}`} className="block">
        <div className="flex items-center gap-2 mb-2">
          {article.pinned && (
            <Badge variant="secondary" className="gap-1">
              <Pin className="w-3 h-3" />
              置顶
            </Badge>
          )}
          <span className="text-xs text-muted flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(article.createdAt)}
          </span>
        </div>
        <h3 className="text-xl font-semibold mb-2 hover:text-primary transition-colors">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-muted text-sm line-clamp-2">{article.excerpt}</p>
        )}
      </a>
    </Card>
  );
}
```

- [ ] **Step 2: Create ArticleList.tsx**

```tsx
import { ArticleCard } from "./ArticleCard";
import type { Article } from "../../shared/types";

type ArticleListProps = {
  articles: Article[];
};

export function ArticleList({ articles }: ArticleListProps) {
  if (articles.length === 0) {
    return <div className="text-center py-12 text-muted">暂无文章</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create ArticleDetail.tsx**

```tsx
import { Calendar, User, Tag } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { Badge } from "../../components/ui/badge";
import type { Article } from "../../shared/types";

type ArticleDetailProps = {
  article: Article;
};

export function ArticleDetail({ article }: ArticleDetailProps) {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-4xl font-bold mb-4">{article.title}</h1>

      <div className="flex items-center gap-4 text-sm text-muted mb-8">
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {new Date(
            article.publishedAt ?? article.createdAt,
          ).toLocaleDateString("zh-CN")}
        </span>
        <span className="flex items-center gap-1">
          <User className="w-4 h-4" />
          {article.authorId}
        </span>
      </div>

      <div className="prose prose-invert prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-code:text-primary prose-pre:bg-card">
        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
          {article.content}
        </ReactMarkdown>
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Create ArticleEditor.tsx**

```tsx
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

type ArticleEditorProps = {
  initialData?: {
    title?: string;
    content?: string;
    excerpt?: string;
  };
  onSave: (data: {
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    status: "draft" | "published";
  }) => Promise<void>;
};

export function ArticleEditor({ initialData, onSave }: ArticleEditorProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (status: "draft" | "published") => {
    setSaving(true);
    try {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      await onSave({ title, slug, content, excerpt, status });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="文章标题"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Textarea
        placeholder="文章摘要（可选，留空将自动截取）"
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        rows={2}
      />

      <div className="flex items-center gap-2">
        <Button
          variant={preview ? "outline" : "default"}
          onClick={() => setPreview(false)}
        >
          编辑
        </Button>
        <Button
          variant={preview ? "default" : "outline"}
          onClick={() => setPreview(true)}
        >
          预览
        </Button>
      </div>

      {preview ? (
        <div className="prose prose-invert max-w-none min-h-[400px] p-4 border border-border rounded-lg bg-card">
          <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
            {content || "*暂无内容*"}
          </ReactMarkdown>
        </div>
      ) : (
        <Textarea
          placeholder="使用 Markdown 编写文章内容..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[400px] font-mono"
        />
      )}

      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          onClick={() => handleSave("draft")}
          disabled={saving || !title}
        >
          保存草稿
        </Button>
        <Button
          onClick={() => handleSave("published")}
          disabled={saving || !title}
        >
          发布
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/features/articles/
git commit -m "feat: add article components"
```

---

### Task 11: Comment Components

**Files:**

- Create: `src/features/comments/CommentList.tsx`
- Create: `src/features/comments/CommentItem.tsx`
- Create: `src/features/comments/CommentForm.tsx`

- [ ] **Step 1: Create CommentItem.tsx**

```tsx
import { Trash2 } from "lucide-react";
import { formatRelativeTime } from "../../shared/time";
import type { Comment } from "../../shared/types";

type CommentItemProps = {
  comment: Comment;
  onDelete?: (id: string) => void;
};

export function CommentItem({ comment, onDelete }: CommentItemProps) {
  return (
    <div className="py-4 border-b border-border last:border-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted">{comment.authorId}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">
            {formatRelativeTime(comment.createdAt)}
          </span>
          {onDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-muted hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
    </div>
  );
}
```

- [ ] **Step 2: Create CommentForm.tsx**

```tsx
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";

type CommentFormProps = {
  onSubmit: (content: string) => Promise<void>;
};

export function CommentForm({ onSubmit }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit(content);
      setContent("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Textarea
        placeholder="写下你的评论..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={submitting || !content.trim()}>
          发表评论
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Create CommentList.tsx**

```tsx
import { CommentItem } from "./CommentItem";
import type { Comment } from "../../shared/types";

type CommentListProps = {
  comments: Comment[];
  onDelete?: (id: string) => void;
};

export function CommentList({ comments, onDelete }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted">
        暂无评论，快来发表第一条评论吧
      </div>
    );
  }

  return (
    <div>
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} onDelete={onDelete} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/features/comments/
git commit -m "feat: add comment components"
```

---

### Task 12: Page Components

**Files:**

- Create: `src/pages/home/HomePage.tsx`
- Create: `src/pages/article/ArticlePage.tsx`
- Create: `src/pages/timeline/TimelinePage.tsx`
- Create: `src/pages/search/SearchPage.tsx`
- Create: `src/pages/admin/AdminPage.tsx`
- Create: `src/pages/admin/articles/ArticleManagePage.tsx`
- Create: `src/pages/admin/articles/new/NewArticlePage.tsx`

- [ ] **Step 1: Create HomePage.tsx**

```tsx
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "../../components/ui/input";
import { ArticleList } from "../../features/articles/ArticleList";
import type { Article } from "../../shared/types";

export function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/articles?status=published&limit=20")
      .then((res) => res.json())
      .then((data) => setArticles(data.articles));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Lightning Blog</h1>
        <p className="text-muted">技术分享与个人随笔</p>
      </div>

      <form onSubmit={handleSearch} className="max-w-md mx-auto w-full">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input
            placeholder="搜索文章..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </form>

      <ArticleList articles={articles} />
    </div>
  );
}
```

- [ ] **Step 2: Create ArticlePage.tsx**

```tsx
import { useEffect, useState } from "react";
import { ArticleDetail } from "../../features/articles/ArticleDetail";
import { CommentList } from "../../features/comments/CommentList";
import { CommentForm } from "../../features/comments/CommentForm";
import type { Article, Comment } from "../../shared/types";

type ArticlePageProps = {
  slug: string;
  user: { portalUserId: string } | null;
};

export function ArticlePage({ slug, user }: ArticlePageProps) {
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    fetch(`/api/articles/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setArticle(data.article);
        if (data.article) {
          fetch(`/api/articles/${data.article.id}/comments`)
            .then((res) => res.json())
            .then((data) => setComments(data.comments));
        }
      });
  }, [slug]);

  if (!article) {
    return <div className="text-center py-12 text-muted">加载中...</div>;
  }

  const handleCommentSubmit = async (content: string) => {
    const res = await fetch(`/api/articles/${article.id}/comments`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    setComments([...comments, data.comment]);
  };

  const handleCommentDelete = async (id: string) => {
    await fetch(`/api/comments/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setComments(comments.filter((c) => c.id !== id));
  };

  return (
    <div className="flex flex-col gap-12">
      <ArticleDetail article={article} />

      <section>
        <h2 className="text-2xl font-bold mb-6">评论</h2>
        {user ? (
          <CommentForm onSubmit={handleCommentSubmit} />
        ) : (
          <p className="text-muted text-center py-4">
            <a href="/auth/login" className="text-primary hover:underline">
              登录
            </a>
            后发表评论
          </p>
        )}
        <CommentList
          comments={comments}
          onDelete={user ? handleCommentDelete : undefined}
        />
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Create TimelinePage.tsx**

```tsx
import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { Card } from "../../components/ui/card";
import type { Article } from "../../shared/types";

export function TimelinePage() {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    fetch("/api/timeline")
      .then((res) => res.json())
      .then((data) => setArticles(data.articles));
  }, []);

  const groupedArticles = articles.reduce(
    (acc, article) => {
      const date = new Date(article.publishedAt ?? article.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(article);
      return acc;
    },
    {} as Record<string, Article[]>,
  );

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">时间线</h1>

      {Object.entries(groupedArticles).map(([month, articles]) => (
        <div key={month}>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {month}
          </h2>
          <div className="flex flex-col gap-3">
            {articles.map((article) => (
              <Card key={article.id} className="p-4">
                <a
                  href={`/articles/${article.slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {article.title}
                </a>
                <span className="text-xs text-muted mt-1 block">
                  {new Date(
                    article.publishedAt ?? article.createdAt,
                  ).toLocaleDateString("zh-CN")}
                </span>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create SearchPage.tsx**

```tsx
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "../../components/ui/input";
import { ArticleList } from "../../features/articles/ArticleList";
import type { Article } from "../../shared/types";

export function SearchPage() {
  const [query, setQuery] = useState(
    new URLSearchParams(window.location.search).get("q") ?? "",
  );
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    if (query) {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => setArticles(data.articles));
    }
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.history.pushState({}, "", `/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">搜索</h1>

      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input
            placeholder="搜索文章..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </form>

      {query && (
        <p className="text-muted">
          {articles.length > 0
            ? `找到 ${articles.length} 篇相关文章`
            : "未找到相关文章"}
        </p>
      )}

      <ArticleList articles={articles} />
    </div>
  );
}
```

- [ ] **Step 5: Create AdminPage.tsx**

```tsx
import { useEffect, useState } from "react";
import { FileText, FolderOpen, Tag } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { AdminLayout } from "../../layouts/AdminLayout";

export function AdminPage() {
  const [stats, setStats] = useState({
    articles: 0,
    categories: 0,
    tags: 0,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/articles?limit=1000").then((res) => res.json()),
      fetch("/api/categories").then((res) => res.json()),
      fetch("/api/tags").then((res) => res.json()),
    ]).then(([articles, categories, tags]) => {
      setStats({
        articles: articles.articles?.length ?? 0,
        categories: categories.categories?.length ?? 0,
        tags: tags.tags?.length ?? 0,
      });
    });
  }, []);

  return (
    <AdminLayout currentPath="/admin">
      <h1 className="text-3xl font-bold mb-8">仪表盘</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">文章</CardTitle>
            <FileText className="w-4 h-4 text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.articles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">分类</CardTitle>
            <FolderOpen className="w-4 h-4 text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">标签</CardTitle>
            <Tag className="w-4 h-4 text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tags}</div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 6: Create ArticleManagePage.tsx**

```tsx
import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { AdminLayout } from "../../layouts/AdminLayout";
import type { Article } from "../../shared/types";

export function ArticleManagePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "published"
  >("all");

  useEffect(() => {
    const url =
      statusFilter === "all"
        ? "/api/articles?limit=100"
        : `/api/articles?status=${statusFilter}&limit=100`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => setArticles(data.articles));
  }, [statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这篇文章吗？")) return;
    await fetch(`/api/articles/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setArticles(articles.filter((a) => a.id !== id));
  };

  return (
    <AdminLayout currentPath="/admin/articles">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">文章管理</h1>
        <a href="/admin/articles/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新建文章
          </Button>
        </a>
      </div>

      <div className="flex gap-2 mb-6">
        {(["all", "draft", "published"] as const).map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            onClick={() => setStatusFilter(status)}
          >
            {status === "all" ? "全部" : status === "draft" ? "草稿" : "已发布"}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {articles.map((article) => (
          <Card key={article.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <a
                  href={`/admin/articles/${article.id}/edit`}
                  className="font-medium hover:text-primary transition-colors"
                >
                  {article.title}
                </a>
                <Badge
                  variant={
                    article.status === "published" ? "default" : "secondary"
                  }
                >
                  {article.status === "published" ? "已发布" : "草稿"}
                </Badge>
                {article.pinned && <Badge>置顶</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <a href={`/admin/articles/${article.id}/edit`}>
                  <Button variant="ghost" size="icon">
                    <Edit className="w-4 h-4" />
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(article.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 7: Create NewArticlePage.tsx**

```tsx
import { useNavigate } from "react-router-dom";
import { ArticleEditor } from "../../../features/articles/ArticleEditor";
import { AdminLayout } from "../../../layouts/AdminLayout";

export function NewArticlePage() {
  const navigate = useNavigate();

  const handleSave = async (data: {
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    status: "draft" | "published";
  }) => {
    const res = await fetch("/api/articles", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (res.ok) {
      navigate(`/admin/articles/${result.article.id}/edit`);
    }
  };

  return (
    <AdminLayout currentPath="/admin/articles/new">
      <h1 className="text-3xl font-bold mb-6">新建文章</h1>
      <ArticleEditor onSave={handleSave} />
    </AdminLayout>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add src/pages/
git commit -m "feat: add page components"
```

---

## Chunk 5: Docker and CI/CD

### Task 13: Docker Configuration

**Files:**

- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `.dockerignore`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
COPY --from=build /app/package.json /app/pnpm-lock.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
EXPOSE 10004
CMD ["pnpm", "start"]
```

- [ ] **Step 2: Create docker-compose.yml**

```yaml
version: "3.8"

services:
  blog-db:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: blog
      POSTGRES_USER: blog
      POSTGRES_PASSWORD: blog_password
    ports:
      - "15404:5432"
    volumes:
      - blog-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U blog"]
      interval: 10s
      timeout: 5s
      retries: 5

  blog:
    build: .
    ports:
      - "10004:10004"
    environment:
      NODE_ENV: production
      PORT: 10004
      DATABASE_URL: postgresql://blog:blog_password@blog-db:5432/blog
      PUBLIC_BASE_URL: http://blog.orgcatfun.site
      PORTAL_BASE_URL: http://orgcatfun.site
      SSO_CALLBACK_URL: http://blog.orgcatfun.site/auth/callback
      OIDC_CLIENT_ID: blog
    depends_on:
      blog-db:
        condition: service_healthy

volumes:
  blog-db-data:
```

- [ ] **Step 3: Create .dockerignore**

```
node_modules
dist
.git
.github
.env
.env.*
*.md
```

- [ ] **Step 4: Commit**

```bash
git add Dockerfile docker-compose.yml .dockerignore
git commit -m "feat: add Docker configuration"
```

---

### Task 14: CI/CD Pipeline

**Files:**

- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create deploy.yml**

```yaml
name: Deploy

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  verify-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.33.2

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm

      - name: Install
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm run lint

      - name: Format check
        run: pnpm run format:check

      - name: Type check
        run: pnpm run type-check

      - name: Test
        run: pnpm run test

      - name: Build
        run: pnpm run build

      - name: Package source
        run: |
          tar \
            --exclude='.git' \
            --exclude='node_modules' \
            --exclude='dist' \
            --exclude='coverage' \
            -czf "$RUNNER_TEMP/release.tar.gz" .
          cp "$RUNNER_TEMP/release.tar.gz" release.tar.gz

      - name: Upload source
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.SERVER_HOST }}
          port: ${{ secrets.SERVER_PORT }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          source: release.tar.gz
          target: /opt/lightning/lightning-blog
          timeout: 120s
          command_timeout: 10m

      - name: Deploy over SSH
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          port: ${{ secrets.SERVER_PORT }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            set -e
            mkdir -p /opt/lightning/lightning-blog
            cd /opt/lightning/lightning-blog
            rm -rf repo
            mkdir -p repo
            tar -xzf release.tar.gz -C repo
            cd repo
            cp ../.env.production .env.production
            docker compose up -d --build
            for i in $(seq 1 30); do
              if curl --fail --silent --show-error http://127.0.0.1:10004/api/health; then
                exit 0
              fi
              sleep 2
            done
            docker ps -a
            docker logs lightning-blog --tail 120
            exit 1
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: add CI/CD pipeline"
```

---

## Chunk 6: Final Integration

### Task 15: Update App.tsx with Route Handling

**Files:**

- Modify: `src/app/App.tsx`

- [ ] **Step 1: Update App.tsx with proper route handling**

```tsx
import { useEffect, useState } from "react";
import { matchRoute } from "../lib/routes";
import { getPortalSnapshot } from "../lib/api";
import { AppLayout } from "../layouts/AppLayout";
import { HomePage } from "../pages/home/HomePage";
import { ArticlePage } from "../pages/article/ArticlePage";
import { TimelinePage } from "../pages/timeline/TimelinePage";
import { SearchPage } from "../pages/search/SearchPage";
import { AdminPage } from "../pages/admin/AdminPage";
import { ArticleManagePage } from "../pages/admin/articles/ArticleManagePage";
import { NewArticlePage } from "../pages/admin/articles/new/NewArticlePage";

export function App() {
  const [route, setRoute] = useState(matchRoute(window.location.pathname));
  const [user, setUser] = useState<{
    portalUserId: string;
    displayName: string;
    avatarUrl: string | null;
  } | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(matchRoute(window.location.pathname));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    getPortalSnapshot()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    setRoute(matchRoute(window.location.pathname));
  }, [window.location.pathname]);

  const renderPage = () => {
    switch (route.name) {
      case "home":
        return <HomePage />;
      case "article":
        return <ArticlePage slug={route.slug} user={user} />;
      case "timeline":
        return <TimelinePage />;
      case "search":
        return <SearchPage />;
      case "admin":
        return <AdminPage />;
      case "admin-articles":
        return <ArticleManagePage />;
      case "admin-article-new":
        return <NewArticlePage />;
      case "callback":
        return <div>处理登录中...</div>;
      case "access-denied":
        return <div className="text-center py-12">访问被拒绝</div>;
      default:
        return <div className="text-center py-12">页面不存在</div>;
    }
  };

  return <AppLayout user={user}>{renderPage()}</AppLayout>;
}
```

- [ ] **Step 2: Run type check**

```bash
pnpm run type-check
```

Expected: PASS

- [ ] **Step 3: Run tests**

```bash
pnpm run test
```

Expected: PASS

- [ ] **Step 4: Build**

```bash
pnpm run build
```

Expected: PASS

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: complete lightning-blog implementation"
```

---

## Summary

This plan implements a complete blog system with:

- Portal OIDC integration for unified authentication
- Article CRUD with Markdown editor and live preview
- Categories and tags for organization
- Comments system for reader engagement
- Search functionality
- Timeline view
- Admin panel for content management
- Docker deployment
- CI/CD pipeline

The implementation follows the same architectural patterns as the existing Lightning platform projects, ensuring consistency and maintainability.
