import type { BlogStore } from './blog-store'
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

export class MemoryBlogStore implements BlogStore {
  private articles = new Map<string, Article>()
  private categories = new Map<string, Category>()
  private tags = new Map<string, Tag>()
  private articleTags = new Map<string, Set<string>>()
  private comments = new Map<string, Comment>()
  private profiles = new Map<string, PortalUserProfile>()
  private sessions = new Map<string, AppSession>()

  async listArticles(filters?: {
    status?: 'draft' | 'published'
    categoryId?: string
    tagId?: string
    authorId?: string
    limit?: number
    offset?: number
  }): Promise<Article[]> {
    let articles = Array.from(this.articles.values())

    if (filters?.status) {
      articles = articles.filter((a) => a.status === filters.status)
    }
    if (filters?.categoryId) {
      articles = articles.filter((a) => a.categoryId === filters.categoryId)
    }
    if (filters?.authorId) {
      articles = articles.filter((a) => a.authorId === filters.authorId)
    }
    if (filters?.tagId) {
      const articleIds = this.articleTags.get(filters.tagId) ?? new Set()
      articles = articles.filter((a) => articleIds.has(a.id))
    }

    articles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    const offset = filters?.offset ?? 0
    const limit = filters?.limit ?? 10
    return articles.slice(offset, offset + limit)
  }

  async getArticleBySlug(slug: string): Promise<Article | null> {
    for (const article of this.articles.values()) {
      if (article.slug === slug) return article
    }
    return null
  }

  async getArticleById(id: string): Promise<Article | null> {
    return this.articles.get(id) ?? null
  }

  async createArticle(input: CreateArticleInput): Promise<Article> {
    const article: Article = {
      id: crypto.randomUUID(),
      title: input.title,
      slug: input.slug,
      content: input.content,
      excerpt: input.excerpt ?? null,
      status: input.status,
      pinned: input.pinned ?? false,
      authorId: input.authorId,
      categoryId: input.categoryId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: input.status === 'published' ? new Date() : null,
    }
    this.articles.set(article.id, article)

    if (input.tagIds) {
      const tagSet = new Set(input.tagIds)
      this.articleTags.set(article.id, tagSet)
    }

    return article
  }

  async updateArticle(
    id: string,
    input: UpdateArticleInput,
  ): Promise<Article> {
    const existing = this.articles.get(id)
    if (!existing) throw new Error('Article not found')

    const updated: Article = {
      ...existing,
      ...input,
      updatedAt: new Date(),
      publishedAt:
        input.status === 'published' && existing.status !== 'published'
          ? new Date()
          : existing.publishedAt,
    }
    this.articles.set(id, updated)

    if (input.tagIds) {
      const tagSet = new Set(input.tagIds)
      this.articleTags.set(id, tagSet)
    }

    return updated
  }

  async deleteArticle(id: string): Promise<void> {
    this.articles.delete(id)
    this.articleTags.delete(id)
  }

  async searchArticles(query: string): Promise<Article[]> {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.articles.values())
      .filter(
        (a) =>
          a.title.toLowerCase().includes(lowerQuery) ||
          a.content.toLowerCase().includes(lowerQuery),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async listCategories(): Promise<Category[]> {
    return Array.from(this.categories.values())
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    for (const category of this.categories.values()) {
      if (category.slug === slug) return category
    }
    return null
  }

  async createCategory(input: {
    name: string
    slug: string
    description?: string
    parentId?: string
  }): Promise<Category> {
    const category: Category = {
      id: crypto.randomUUID(),
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      parentId: input.parentId ?? null,
    }
    this.categories.set(category.id, category)
    return category
  }

  async updateCategory(
    id: string,
    input: { name?: string; description?: string },
  ): Promise<Category> {
    const existing = this.categories.get(id)
    if (!existing) throw new Error('Category not found')
    const updated = { ...existing, ...input }
    this.categories.set(id, updated)
    return updated
  }

  async deleteCategory(id: string): Promise<void> {
    this.categories.delete(id)
  }

  async listTags(): Promise<Tag[]> {
    return Array.from(this.tags.values())
  }

  async getTagBySlug(slug: string): Promise<Tag | null> {
    for (const tag of this.tags.values()) {
      if (tag.slug === slug) return tag
    }
    return null
  }

  async createTag(input: { name: string; slug: string }): Promise<Tag> {
    const tag: Tag = {
      id: crypto.randomUUID(),
      ...input,
    }
    this.tags.set(tag.id, tag)
    return tag
  }

  async deleteTag(id: string): Promise<void> {
    this.tags.delete(id)
  }

  async listCommentsByArticle(articleId: string): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter((c) => c.articleId === articleId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }

  async createComment(input: CreateCommentInput): Promise<Comment> {
    const comment: Comment = {
      id: crypto.randomUUID(),
      content: input.content,
      articleId: input.articleId,
      authorId: input.authorId,
      parentId: input.parentId ?? null,
      createdAt: new Date(),
    }
    this.comments.set(comment.id, comment)
    return comment
  }

  async deleteComment(id: string): Promise<void> {
    this.comments.delete(id)
  }

  async upsertProfile(profile: PortalUserProfile): Promise<void> {
    this.profiles.set(profile.portalUserId, profile)
  }

  async getProfile(
    portalUserId: string,
  ): Promise<PortalUserProfile | null> {
    return this.profiles.get(portalUserId) ?? null
  }

  async createSession(input: {
    portalUserId: string
    token: string
    portalAccessToken?: string
    expiresAt: Date
  }): Promise<void> {
    const session: AppSession = {
      id: crypto.randomUUID(),
      portalUserId: input.portalUserId,
      token: input.token,
      portalAccessToken: input.portalAccessToken ?? null,
      expiresAt: input.expiresAt,
      revokedAt: null,
    }
    this.sessions.set(session.id, session)
  }

  async findSessionByToken(token: string): Promise<AppSession | null> {
    for (const session of this.sessions.values()) {
      if (session.token === token) return session
    }
    return null
  }

  async revokeSessionByToken(token: string): Promise<void> {
    for (const session of this.sessions.values()) {
      if (session.token === token) {
        session.revokedAt = new Date()
      }
    }
  }
}
