import { jsx as _jsx } from "react/jsx-runtime";
import { ArticleCard } from './ArticleCard';
export function ArticleList({ articles }) {
    if (articles.length === 0) {
        return (_jsx("div", { className: "text-center py-12 text-muted", children: "\u6682\u65E0\u6587\u7AE0" }));
    }
    return (_jsx("div", { className: "flex flex-col gap-4", children: articles.map((article) => (_jsx(ArticleCard, { article: article }, article.id))) }));
}
