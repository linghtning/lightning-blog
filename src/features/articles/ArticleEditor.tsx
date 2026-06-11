import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'

type ArticleEditorProps = {
  initialData?: {
    title?: string
    content?: string
    excerpt?: string
  }
  onSave: (data: {
    title: string
    slug: string
    content: string
    excerpt: string
    status: 'draft' | 'published'
  }) => Promise<void>
}

export function ArticleEditor({ initialData, onSave }: ArticleEditorProps) {
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [content, setContent] = useState(initialData?.content ?? '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? '')
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async (status: 'draft' | 'published') => {
    setSaving(true)
    try {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      await onSave({ title, slug, content, excerpt, status })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="文章标题"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      
      <Textarea
        placeholder="文章摘要（可选，留空将自动截取）"
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        rows={2}
      />

      <div className="flex items-center gap-2">
        <Button
          variant={preview ? 'outline' : 'default'}
          onClick={() => setPreview(false)}
        >
          编辑
        </Button>
        <Button
          variant={preview ? 'default' : 'outline'}
          onClick={() => setPreview(true)}
        >
          预览
        </Button>
      </div>

      {preview ? (
        <div className="prose prose-invert max-w-none min-h-[400px] p-4 border border-border rounded-lg bg-card">
          <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
            {content || '*暂无内容*'}
          </ReactMarkdown>
        </div>
      ) : (
        <Textarea
          placeholder="使用 Markdown 编写文章内容..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[400px] font-mono"
        />
      )}

      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          onClick={() => handleSave('draft')}
          disabled={saving || !title}
        >
          保存草稿
        </Button>
        <Button
          onClick={() => handleSave('published')}
          disabled={saving || !title}
        >
          发布
        </Button>
      </div>
    </div>
  )
}
