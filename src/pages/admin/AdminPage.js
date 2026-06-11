import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { FileText, FolderOpen, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { AdminLayout } from '../../layouts/AdminLayout';
export function AdminPage() {
    const [stats, setStats] = useState({
        articles: 0,
        categories: 0,
        tags: 0,
    });
    useEffect(() => {
        Promise.all([
            fetch('/api/articles?limit=1000').then((res) => res.json()),
            fetch('/api/categories').then((res) => res.json()),
            fetch('/api/tags').then((res) => res.json()),
        ]).then(([articles, categories, tags]) => {
            setStats({
                articles: articles.articles?.length ?? 0,
                categories: categories.categories?.length ?? 0,
                tags: tags.tags?.length ?? 0,
            });
        });
    }, []);
    return (_jsxs(AdminLayout, { currentPath: "/admin", children: [_jsx("h1", { className: "text-3xl font-bold mb-8", children: "\u4EEA\u8868\u76D8" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "\u6587\u7AE0" }), _jsx(FileText, { className: "w-4 h-4 text-muted" })] }), _jsx(CardContent, { children: _jsx("div", { className: "text-2xl font-bold", children: stats.articles }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "\u5206\u7C7B" }), _jsx(FolderOpen, { className: "w-4 h-4 text-muted" })] }), _jsx(CardContent, { children: _jsx("div", { className: "text-2xl font-bold", children: stats.categories }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "\u6807\u7B7E" }), _jsx(Tag, { className: "w-4 h-4 text-muted" })] }), _jsx(CardContent, { children: _jsx("div", { className: "text-2xl font-bold", children: stats.tags }) })] })] })] }));
}
