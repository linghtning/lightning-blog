import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { ArticleDetail } from '../../features/articles/ArticleDetail';
import { CommentList } from '../../features/comments/CommentList';
import { CommentForm } from '../../features/comments/CommentForm';
export function ArticlePage({ slug, user }) {
    const [article, setArticle] = useState(null);
    const [comments, setComments] = useState([]);
    useEffect(() => {
        fetch(`/api/articles/${slug}`)
            .then((res) => res.json())
            .then((data) => {
            setArticle(data.article);
            if (data.article) {
                fetch(`/api/articles/${data.article.id}/comments`)
                    .then((res) => res.json())
                    .then((data) => setComments(data.comments));
            }
        });
    }, [slug]);
    if (!article) {
        return _jsx("div", { className: "text-center py-12 text-muted", children: "\u52A0\u8F7D\u4E2D..." });
    }
    const handleCommentSubmit = async (content) => {
        const res = await fetch(`/api/articles/${article.id}/comments`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
        });
        const data = await res.json();
        setComments([...comments, data.comment]);
    };
    const handleCommentDelete = async (id) => {
        await fetch(`/api/comments/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        setComments(comments.filter((c) => c.id !== id));
    };
    return (_jsxs("div", { className: "flex flex-col gap-12", children: [_jsx(ArticleDetail, { article: article }), _jsxs("section", { children: [_jsx("h2", { className: "text-2xl font-bold mb-6", children: "\u8BC4\u8BBA" }), user ? (_jsx(CommentForm, { onSubmit: handleCommentSubmit })) : (_jsxs("p", { className: "text-muted text-center py-4", children: [_jsx("a", { href: "/auth/login", className: "text-primary hover:underline", children: "\u767B\u5F55" }), "\u540E\u53D1\u8868\u8BC4\u8BBA"] })), _jsx(CommentList, { comments: comments, onDelete: user ? handleCommentDelete : undefined })] })] }));
}
