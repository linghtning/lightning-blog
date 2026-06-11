import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArticleEditor } from '../../../../features/articles/ArticleEditor';
import { AdminLayout } from '../../../../layouts/AdminLayout';
export function NewArticlePage() {
    const handleSave = async (data) => {
        const res = await fetch('/api/articles', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await res.json();
        if (res.ok) {
            window.location.href = `/admin/articles/${result.article.id}/edit`;
        }
    };
    return (_jsxs(AdminLayout, { currentPath: "/admin/articles/new", children: [_jsx("h1", { className: "text-3xl font-bold mb-6", children: "\u65B0\u5EFA\u6587\u7AE0" }), _jsx(ArticleEditor, { onSave: handleSave })] }));
}
