import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { AdminLayout } from '../../../layouts/AdminLayout'
import type { Article } from '../../../shared/types'

export function ArticleManagePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')

  useEffect(() => {
    const url = statusFilter === 'all'
      ? '/api/articles?limit=100'
      : `/api/articles?status=${statusFilter}&limit=100`
    fetch(url)
      .then((res) => res.json())
      .then((data) => setArticles(data.articles))
  }, [statusFilter])

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这篇文章吗？')) return
    await fetch(`/api/articles/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    setArticles(articles.filter((a) => a.id !== id))
  }

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
        {(['all', 'draft', 'published'] as const).map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            onClick={() => setStatusFilter(status)}
          >
            {status === 'all' ? '全部' : status === 'draft' ? '草稿' : '已发布'}
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
                <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                  {article.status === 'published' ? '已发布' : '草稿'}
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
  )
}
