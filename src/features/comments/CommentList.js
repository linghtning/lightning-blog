import { jsx as _jsx } from "react/jsx-runtime";
import { CommentItem } from './CommentItem';
export function CommentList({ comments, onDelete }) {
    if (comments.length === 0) {
        return (_jsx("div", { className: "text-center py-8 text-muted", children: "\u6682\u65E0\u8BC4\u8BBA\uFF0C\u5FEB\u6765\u53D1\u8868\u7B2C\u4E00\u6761\u8BC4\u8BBA\u5427" }));
    }
    return (_jsx("div", { children: comments.map((comment) => (_jsx(CommentItem, { comment: comment, onDelete: onDelete }, comment.id))) }));
}
