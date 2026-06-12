import { Pin, Clock } from "lucide-react";
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
