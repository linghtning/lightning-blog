export type PortalUserProfile = {
  portalUserId: string
  username: string
  displayName: string
  avatarUrl: string | null
  role: 'user' | 'super_admin'
}

export type Article = {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  status: 'draft' | 'published'
  pinned: boolean
  authorId: string
  categoryId: string | null
  createdAt: Date
  updatedAt: Date
  publishedAt: Date | null
}

export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
}

export type Tag = {
  id: string
  name: string
  slug: string
}

export type Comment = {
  id: string
  content: string
  articleId: string
  authorId: string
  parentId: string | null
  createdAt: Date
}

export type CreateArticleInput = {
  title: string
  slug: string
  content: string
  excerpt?: string
  status: 'draft' | 'published'
  pinned?: boolean
  authorId: string
  categoryId?: string
  tagIds?: string[]
}

export type UpdateArticleInput = Partial<Omit<CreateArticleInput, 'authorId'>>

export type CreateCommentInput = {
  content: string
  articleId: string
  authorId: string
  parentId?: string
}

export type OidcPortalUser = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  role: 'user' | 'super_admin'
}

export type OidcCallbackResult = {
  accessToken: string
  user: OidcPortalUser
}

export type AppSession = {
  id: string
  portalUserId: string
  token: string
  portalAccessToken: string | null
  expiresAt: Date
  revokedAt: Date | null
}
