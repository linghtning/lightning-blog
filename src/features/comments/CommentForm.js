import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
export function CommentForm({ onSubmit }) {
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim())
            return;
        setSubmitting(true);
        try {
            await onSubmit(content);
            setContent('');
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsxs("form", { onSubmit: handleSubmit, className: "flex flex-col gap-3", children: [_jsx(Textarea, { placeholder: "\u5199\u4E0B\u4F60\u7684\u8BC4\u8BBA...", value: content, onChange: (e) => setContent(e.target.value), rows: 3 }), _jsx("div", { className: "flex justify-end", children: _jsx(Button, { type: "submit", disabled: submitting || !content.trim(), children: "\u53D1\u8868\u8BC4\u8BBA" }) })] }));
}
