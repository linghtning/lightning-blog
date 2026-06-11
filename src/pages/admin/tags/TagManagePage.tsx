import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { AdminLayout } from '../../../layouts/AdminLayout'
import type { Tag } from '../../../shared/types'

export function TagManagePage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  useEffect(() => {
    fetch('/api/tags')
      .then((res) => res.json())
      .then((data) => setTags(data.tags))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !slug) return
    const res = await fetch('/api/tags', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug }),
    })
    if (res.ok) {
      const data = await res.json()
      setTags([...tags, data.tag])
      setName('')
      setSlug('')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此标签？')) return
    await fetch(`/api/tags/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    setTags(tags.filter((t) => t.id !== id))
  }

  return (
    <AdminLayout currentPath="/admin/tags">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">标签管理</h1>
      </div>

      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">新建标签</h2>
        <form onSubmit={handleCreate} className="flex gap-3">
          <Input placeholder="标签名称" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="URL slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Button type="submit" disabled={!name || !slug}>
            <Plus className="w-4 h-4 mr-2" />
            创建
          </Button>
        </form>
      </Card>

      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => (
          <Card key={tag.id} className="p-3 flex items-center gap-2">
            <Badge variant="secondary">{tag.name}</Badge>
            <span className="text-muted text-sm">/{tag.slug}</span>
            <button
              onClick={() => handleDelete(tag.id)}
              className="text-muted hover:text-red-500 transition-colors ml-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Card>
        ))}
        {tags.length === 0 && (
          <div className="text-center py-8 text-muted w-full">暂无标签</div>
        )}
      </div>
    </AdminLayout>
  )
}
