import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'

export const articleStatusEnum = pgEnum('article_status', [
  'draft',
  'published',
])

export const userRoleEnum = pgEnum('user_role', ['user', 'super_admin'])

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  parentId: uuid('parent_id'),
})

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
})

export const articles = pgTable('articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  status: articleStatusEnum('status').notNull().default('draft'),
  pinned: boolean('pinned').notNull().default(false),
  authorId: text('author_id').notNull(),
  categoryId: uuid('category_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  publishedAt: timestamp('published_at'),
})

export const articleTags = pgTable('article_tags', {
  articleId: uuid('article_id')
    .notNull()
    .references(() => articles.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
})

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  articleId: uuid('article_id')
    .notNull()
    .references(() => articles.id, { onDelete: 'cascade' }),
  authorId: text('author_id').notNull(),
  parentId: uuid('parent_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const portalUserProfiles = pgTable('portal_user_profiles', {
  portalUserId: text('portal_user_id').primaryKey(),
  username: text('username').notNull(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').notNull().default('user'),
})

export const appSessions = pgTable('app_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  portalUserId: text('portal_user_id')
    .notNull()
    .references(() => portalUserProfiles.portalUserId),
  token: text('token').notNull().unique(),
  portalAccessToken: text('portal_access_token'),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
})
