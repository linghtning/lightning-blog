import { useEffect, useState } from "react";
import { ArticleDetail } from "../../features/articles/ArticleDetail";
import { CommentList } from "../../features/comments/CommentList";
import { CommentForm } from "../../features/comments/CommentForm";
import type { Article, Comment } from "../../shared/types";

type ArticlePageProps = {
  slug: string;
  user: { portalUserId: string } | null;
};

export function ArticlePage({ slug, user }: ArticlePageProps) {
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    fetch(`/api/articles/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setArticle(data.article);
        if (data.article) {
          fetch(`/api/articles/${data.article.id}/comments`)
            .then((res) => res.json())
            .then((data) => setComments(data.comments));
        }
      });
  }, [slug]);

  if (!article) {
    return <div className="text-center py-12 text-muted">加载中...</div>;
  }

  const handleCommentSubmit = async (content: string) => {
    const res = await fetch(`/api/articles/${article.id}/comments`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    setComments([...comments, data.comment]);
  };

  const handleCommentDelete = async (id: string) => {
    await fetch(`/api/comments/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setComments(comments.filter((c) => c.id !== id));
  };

  return (
    <div className="flex flex-col gap-12">
      <ArticleDetail article={article} />

      <section>
        <h2 className="text-2xl font-bold mb-6">评论</h2>
        {user ? (
          <CommentForm onSubmit={handleCommentSubmit} />
        ) : (
          <p className="text-muted text-center py-4">
            <a href="/auth/login" className="text-primary hover:underline">
              登录
            </a>
            后发表评论
          </p>
        )}
        <CommentList
          comments={comments}
          onDelete={user ? handleCommentDelete : undefined}
        />
      </section>
    </div>
  );
}
