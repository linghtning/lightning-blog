import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Trash2 } from 'lucide-react';
import { formatRelativeTime } from '../../shared/time';
export function CommentItem({ comment, onDelete }) {
    return (_jsxs("div", { className: "py-4 border-b border-border last:border-0", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-muted", children: comment.authorId }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs text-muted", children: formatRelativeTime(comment.createdAt) }), onDelete && (_jsx("button", { onClick: () => onDelete(comment.id), className: "text-muted hover:text-red-500 transition-colors", children: _jsx(Trash2, { className: "w-4 h-4" }) }))] })] }), _jsx("p", { className: "text-foreground whitespace-pre-wrap", children: comment.content })] }));
}
