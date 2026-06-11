import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Pin, Clock } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { formatRelativeTime } from '../../shared/time';
export function ArticleCard({ article }) {
    return (_jsx(Card, { className: "p-6 hover:border-primary/50 transition-colors", children: _jsxs("a", { href: `/articles/${article.slug}`, className: "block", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [article.pinned && (_jsxs(Badge, { variant: "secondary", className: "gap-1", children: [_jsx(Pin, { className: "w-3 h-3" }), "\u7F6E\u9876"] })), _jsxs("span", { className: "text-xs text-muted flex items-center gap-1", children: [_jsx(Clock, { className: "w-3 h-3" }), formatRelativeTime(article.createdAt)] })] }), _jsx("h3", { className: "text-xl font-semibold mb-2 hover:text-primary transition-colors", children: article.title }), article.excerpt && (_jsx("p", { className: "text-muted text-sm line-clamp-2", children: article.excerpt }))] }) }));
}
