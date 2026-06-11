import { useEffect, useState } from 'react'
import { ArticleEditor } from '../../../../features/articles/ArticleEditor'
import { AdminLayout } from '../../../../layouts/AdminLayout'
import type { Article } from '../../../../shared/types'

type EditArticlePageProps = {
  id: string
}

export function EditArticlePage({ id }: EditArticlePageProps) {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/articles/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setArticle(data.article)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <AdminLayout currentPath="/admin/articles">
        <div className="text-center py-12 text-muted">加载中...</div>
      </AdminLayout>
    )
  }

  if (!article) {
    return (
      <AdminLayout currentPath="/admin/articles">
        <div className="text-center py-12 text-muted">文章不存在</div>
      </AdminLayout>
    )
  }

  const handleSave = async (data: {
    title: string
    slug: string
    content: string
    excerpt: string
    status: 'draft' | 'published'
  }) => {
    const res = await fetch(`/api/articles/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      window.location.href = '/admin/articles'
    }
  }

  return (
    <AdminLayout currentPath="/admin/articles">
      <h1 className="text-3xl font-bold mb-6">编辑文章</h1>
      <ArticleEditor
        initialData={{
          title: article.title,
          content: article.content,
          excerpt: article.excerpt ?? undefined,
        }}
        onSave={handleSave}
      />
    </AdminLayout>
  )
}
