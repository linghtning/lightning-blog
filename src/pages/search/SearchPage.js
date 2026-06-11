import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { ArticleList } from '../../features/articles/ArticleList';
export function SearchPage() {
    const [query, setQuery] = useState(new URLSearchParams(window.location.search).get('q') ?? '');
    const [articles, setArticles] = useState([]);
    useEffect(() => {
        if (query) {
            fetch(`/api/search?q=${encodeURIComponent(query)}`)
                .then((res) => res.json())
                .then((data) => setArticles(data.articles));
        }
    }, [query]);
    const handleSearch = (e) => {
        e.preventDefault();
        window.history.pushState({}, '', `/search?q=${encodeURIComponent(query)}`);
    };
    return (_jsxs("div", { className: "flex flex-col gap-8", children: [_jsx("h1", { className: "text-3xl font-bold", children: "\u641C\u7D22" }), _jsx("form", { onSubmit: handleSearch, children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" }), _jsx(Input, { placeholder: "\u641C\u7D22\u6587\u7AE0...", value: query, onChange: (e) => setQuery(e.target.value), className: "pl-10" })] }) }), query && (_jsx("p", { className: "text-muted", children: articles.length > 0
                    ? `找到 ${articles.length} 篇相关文章`
                    : '未找到相关文章' })), _jsx(ArticleList, { articles: articles })] }));
}
