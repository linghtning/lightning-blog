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
} from './types'

export interface BlogStore {
  // Articles
  listArticles(filters?: {
    status?: 'draft' | 'published'
    categoryId?: string
    tagId?: string
    authorId?: string
    limit?: number
    offset?: number
  }): Promise<Article[]>
  getArticleBySlug(slug: string): Promise<Article | null>
  getArticleById(id: string): Promise<Article | null>
  createArticle(input: CreateArticleInput): Promise<Article>
  updateArticle(id: string, input: UpdateArticleInput): Promise<Article>
  deleteArticle(id: string): Promise<void>
  searchArticles(query: string): Promise<Article[]>

  // Categories
  listCategories(): Promise<Category[]>
  getCategoryBySlug(slug: string): Promise<Category | null>
  createCategory(input: {
    name: string
    slug: string
    description?: string
    parentId?: string
  }): Promise<Category>
  updateCategory(
    id: string,
    input: { name?: string; description?: string },
  ): Promise<Category>
  deleteCategory(id: string): Promise<void>

  // Tags
  listTags(): Promise<Tag[]>
  getTagBySlug(slug: string): Promise<Tag | null>
  createTag(input: { name: string; slug: string }): Promise<Tag>
  deleteTag(id: string): Promise<void>

  // Comments
  listCommentsByArticle(articleId: string): Promise<Comment[]>
  createComment(input: CreateCommentInput): Promise<Comment>
  deleteComment(id: string): Promise<void>

  // User Profiles
  upsertProfile(profile: PortalUserProfile): Promise<void>
  getProfile(portalUserId: string): Promise<PortalUserProfile | null>

  // Sessions
  createSession(input: {
    portalUserId: string
    token: string
    portalAccessToken?: string
    expiresAt: Date
  }): Promise<void>
  findSessionByToken(token: string): Promise<AppSession | null>
  revokeSessionByToken(token: string): Promise<void>
}
