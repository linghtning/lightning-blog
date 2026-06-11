import { ArticleEditor } from '../../../../features/articles/ArticleEditor'
import { AdminLayout } from '../../../../layouts/AdminLayout'

export function NewArticlePage() {
  const handleSave = async (data: {
    title: string
    slug: string
    content: string
    excerpt: string
    status: 'draft' | 'published'
  }) => {
    const res = await fetch('/api/articles', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (res.ok) {
      window.location.href = `/admin/articles/${result.article.id}/edit`
    }
  }

  return (
    <AdminLayout currentPath="/admin/articles/new">
      <h1 className="text-3xl font-bold mb-6">新建文章</h1>
      <ArticleEditor onSave={handleSave} />
    </AdminLayout>
  )
}
