import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Calendar, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
export function ArticleDetail({ article }) {
    return (_jsxs("article", { className: "prose prose-invert max-w-none", children: [_jsx("h1", { className: "text-4xl font-bold mb-4", children: article.title }), _jsxs("div", { className: "flex items-center gap-4 text-sm text-muted mb-8", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Calendar, { className: "w-4 h-4" }), new Date(article.publishedAt ?? article.createdAt).toLocaleDateString('zh-CN')] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(User, { className: "w-4 h-4" }), article.authorId] })] }), _jsx("div", { className: "prose prose-invert prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-code:text-primary prose-pre:bg-card", children: _jsx(ReactMarkdown, { rehypePlugins: [rehypeHighlight], children: article.content }) })] }));
}
