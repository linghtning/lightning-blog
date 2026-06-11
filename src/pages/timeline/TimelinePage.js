import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { Card } from '../../components/ui/card';
export function TimelinePage() {
    const [articles, setArticles] = useState([]);
    useEffect(() => {
        fetch('/api/timeline')
            .then((res) => res.json())
            .then((data) => setArticles(data.articles));
    }, []);
    const groupedArticles = articles.reduce((acc, article) => {
        const date = new Date(article.publishedAt ?? article.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!acc[key])
            acc[key] = [];
        acc[key].push(article);
        return acc;
    }, {});
    return (_jsxs("div", { className: "flex flex-col gap-8", children: [_jsx("h1", { className: "text-3xl font-bold", children: "\u65F6\u95F4\u7EBF" }), Object.entries(groupedArticles).map(([month, articles]) => (_jsxs("div", { children: [_jsxs("h2", { className: "text-xl font-semibold mb-4 flex items-center gap-2", children: [_jsx(Calendar, { className: "w-5 h-5" }), month] }), _jsx("div", { className: "flex flex-col gap-3", children: articles.map((article) => (_jsxs(Card, { className: "p-4", children: [_jsx("a", { href: `/articles/${article.slug}`, className: "hover:text-primary transition-colors", children: article.title }), _jsx("span", { className: "text-xs text-muted mt-1 block", children: new Date(article.publishedAt ?? article.createdAt).toLocaleDateString('zh-CN') })] }, article.id))) })] }, month)))] }));
}
