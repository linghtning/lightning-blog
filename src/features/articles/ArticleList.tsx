import { ArticleCard } from './ArticleCard'
import type { Article } from '../../shared/types'

type ArticleListProps = {
  articles: Article[]
}

export function ArticleList({ articles }: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        暂无文章
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  )
}
