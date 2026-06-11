import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { ArticleList } from '../../features/articles/ArticleList';
export function HomePage() {
    const [articles, setArticles] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    useEffect(() => {
        fetch('/api/articles?status=published&limit=20')
            .then((res) => res.json())
            .then((data) => setArticles(data.articles));
    }, []);
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
        }
    };
    return (_jsxs("div", { className: "flex flex-col gap-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-4xl font-bold mb-4", children: "Lightning Blog" }), _jsx("p", { className: "text-muted", children: "\u6280\u672F\u5206\u4EAB\u4E0E\u4E2A\u4EBA\u968F\u7B14" })] }), _jsx("form", { onSubmit: handleSearch, className: "max-w-md mx-auto w-full", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" }), _jsx(Input, { placeholder: "\u641C\u7D22\u6587\u7AE0...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-10" })] }) }), _jsx(ArticleList, { articles: articles })] }));
}
