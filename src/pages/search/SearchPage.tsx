import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "../../components/ui/input";
import { ArticleList } from "../../features/articles/ArticleList";
import type { Article } from "../../shared/types";

export function SearchPage() {
  const [query, setQuery] = useState(
    new URLSearchParams(window.location.search).get("q") ?? "",
  );
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    if (query) {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => setArticles(data.articles));
    }
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.history.pushState({}, "", `/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">搜索</h1>

      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input
            placeholder="搜索文章..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </form>

      {query && (
        <p className="text-muted">
          {articles.length > 0
            ? `找到 ${articles.length} 篇相关文章`
            : "未找到相关文章"}
        </p>
      )}

      <ArticleList articles={articles} />
    </div>
  );
}
