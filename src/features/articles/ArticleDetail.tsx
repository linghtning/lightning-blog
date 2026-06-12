import { Calendar, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import type { Article } from "../../shared/types";

type ArticleDetailProps = {
  article: Article;
};

export function ArticleDetail({ article }: ArticleDetailProps) {
  return (
    <article>
      <h1 className="text-4xl font-bold mb-4">{article.title}</h1>

      <div className="flex items-center gap-4 text-sm text-muted mb-8">
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {new Date(
            article.publishedAt ?? article.createdAt,
          ).toLocaleDateString("zh-CN")}
        </span>
        <span className="flex items-center gap-1">
          <User className="w-4 h-4" />
          {article.authorId}
        </span>
      </div>

      <div className="markdown-body">
        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
          {article.content}
        </ReactMarkdown>
      </div>
    </article>
  );
}
