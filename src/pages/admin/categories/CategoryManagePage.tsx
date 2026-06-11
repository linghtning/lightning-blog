import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card } from '../../../components/ui/card'
import { AdminLayout } from '../../../layouts/AdminLayout'
import type { Category } from '../../../shared/types'

export function CategoryManagePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !slug) return
    const res = await fetch('/api/categories', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug, description }),
    })
    if (res.ok) {
      const data = await res.json()
      setCategories([...categories, data.category])
      setName('')
      setSlug('')
      setDescription('')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此分类？')) return
    await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    setCategories(categories.filter((c) => c.id !== id))
  }

  return (
    <AdminLayout currentPath="/admin/categories">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">分类管理</h1>
      </div>

      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">新建分类</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Input placeholder="分类名称" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="URL slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <Input placeholder="描述（可选）" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="flex justify-end">
            <Button type="submit" disabled={!name || !slug}>
              <Plus className="w-4 h-4 mr-2" />
              创建
            </Button>
          </div>
        </form>
      </Card>

      <div className="flex flex-col gap-3">
        {categories.map((cat) => (
          <Card key={cat.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{cat.name}</span>
                <span className="text-muted text-sm ml-2">/{cat.slug}</span>
                {cat.description && (
                  <span className="text-muted text-sm ml-2">- {cat.description}</span>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
        {categories.length === 0 && (
          <div className="text-center py-8 text-muted">暂无分类</div>
        )}
      </div>
    </AdminLayout>
  )
}
