import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "../../components/ui/input";
import { ArticleList } from "../../features/articles/ArticleList";
import type { Article } from "../../shared/types";

export function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/articles?status=published&limit=20")
      .then((res) => res.json())
      .then((data) => setArticles(data.articles));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Lightning Blog</h1>
        <p className="text-muted">技术分享与个人随笔</p>
      </div>

      <form onSubmit={handleSearch} className="max-w-md mx-auto w-full">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input
            placeholder="搜索文章..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </form>

      <ArticleList articles={articles} />
    </div>
  );
}
