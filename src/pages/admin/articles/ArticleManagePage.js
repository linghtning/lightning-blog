import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { AdminLayout } from '../../../layouts/AdminLayout';
export function ArticleManagePage() {
    const [articles, setArticles] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all');
    useEffect(() => {
        const url = statusFilter === 'all'
            ? '/api/articles?limit=100'
            : `/api/articles?status=${statusFilter}&limit=100`;
        fetch(url)
            .then((res) => res.json())
            .then((data) => setArticles(data.articles));
    }, [statusFilter]);
    const handleDelete = async (id) => {
        if (!confirm('确定要删除这篇文章吗？'))
            return;
        await fetch(`/api/articles/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        setArticles(articles.filter((a) => a.id !== id));
    };
    return (_jsxs(AdminLayout, { currentPath: "/admin/articles", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h1", { className: "text-3xl font-bold", children: "\u6587\u7AE0\u7BA1\u7406" }), _jsx("a", { href: "/admin/articles/new", children: _jsxs(Button, { children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "\u65B0\u5EFA\u6587\u7AE0"] }) })] }), _jsx("div", { className: "flex gap-2 mb-6", children: ['all', 'draft', 'published'].map((status) => (_jsx(Button, { variant: statusFilter === status ? 'default' : 'outline', onClick: () => setStatusFilter(status), children: status === 'all' ? '全部' : status === 'draft' ? '草稿' : '已发布' }, status))) }), _jsx("div", { className: "flex flex-col gap-3", children: articles.map((article) => (_jsx(Card, { className: "p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("a", { href: `/admin/articles/${article.id}/edit`, className: "font-medium hover:text-primary transition-colors", children: article.title }), _jsx(Badge, { variant: article.status === 'published' ? 'default' : 'secondary', children: article.status === 'published' ? '已发布' : '草稿' }), article.pinned && _jsx(Badge, { children: "\u7F6E\u9876" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("a", { href: `/admin/articles/${article.id}/edit`, children: _jsx(Button, { variant: "ghost", size: "icon", children: _jsx(Edit, { className: "w-4 h-4" }) }) }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleDelete(article.id), children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }) }, article.id))) })] }));
}
