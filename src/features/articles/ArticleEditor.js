import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
export function ArticleEditor({ initialData, onSave }) {
    const [title, setTitle] = useState(initialData?.title ?? '');
    const [content, setContent] = useState(initialData?.content ?? '');
    const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? '');
    const [preview, setPreview] = useState(false);
    const [saving, setSaving] = useState(false);
    const handleSave = async (status) => {
        setSaving(true);
        try {
            const slug = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
            await onSave({ title, slug, content, excerpt, status });
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs("div", { className: "flex flex-col gap-4", children: [_jsx(Input, { placeholder: "\u6587\u7AE0\u6807\u9898", value: title, onChange: (e) => setTitle(e.target.value) }), _jsx(Textarea, { placeholder: "\u6587\u7AE0\u6458\u8981\uFF08\u53EF\u9009\uFF0C\u7559\u7A7A\u5C06\u81EA\u52A8\u622A\u53D6\uFF09", value: excerpt, onChange: (e) => setExcerpt(e.target.value), rows: 2 }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: preview ? 'outline' : 'default', onClick: () => setPreview(false), children: "\u7F16\u8F91" }), _jsx(Button, { variant: preview ? 'default' : 'outline', onClick: () => setPreview(true), children: "\u9884\u89C8" })] }), preview ? (_jsx("div", { className: "prose prose-invert max-w-none min-h-[400px] p-4 border border-border rounded-lg bg-card", children: _jsx(ReactMarkdown, { rehypePlugins: [rehypeHighlight], children: content || '*暂无内容*' }) })) : (_jsx(Textarea, { placeholder: "\u4F7F\u7528 Markdown \u7F16\u5199\u6587\u7AE0\u5185\u5BB9...", value: content, onChange: (e) => setContent(e.target.value), className: "min-h-[400px] font-mono" })), _jsxs("div", { className: "flex gap-2 justify-end", children: [_jsx(Button, { variant: "outline", onClick: () => handleSave('draft'), disabled: saving || !title, children: "\u4FDD\u5B58\u8349\u7A3F" }), _jsx(Button, { onClick: () => handleSave('published'), disabled: saving || !title, children: "\u53D1\u5E03" })] })] }));
}
