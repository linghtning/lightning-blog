import { useEffect, useState } from 'react'
import { Calendar } from 'lucide-react'
import { Card } from '../../components/ui/card'
import type { Article } from '../../shared/types'

export function TimelinePage() {
  const [articles, setArticles] = useState<Article[]>([])

  useEffect(() => {
    fetch('/api/timeline')
      .then((res) => res.json())
      .then((data) => setArticles(data.articles))
  }, [])

  const groupedArticles = articles.reduce(
    (acc, article) => {
      const date = new Date(article.publishedAt ?? article.createdAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!acc[key]) acc[key] = []
      acc[key].push(article)
      return acc
    },
    {} as Record<string, Article[]>,
  )

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
                  {new Date(article.publishedAt ?? article.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
