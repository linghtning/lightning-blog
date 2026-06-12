import { useEffect, useState } from "react";
import { FileText, FolderOpen, Tag } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { AdminLayout } from "../../layouts/AdminLayout";

export function AdminPage() {
  const [stats, setStats] = useState({
    articles: 0,
    categories: 0,
    tags: 0,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/articles?limit=1000").then((res) => res.json()),
      fetch("/api/categories").then((res) => res.json()),
      fetch("/api/tags").then((res) => res.json()),
    ]).then(([articles, categories, tags]) => {
      setStats({
        articles: articles.articles?.length ?? 0,
        categories: categories.categories?.length ?? 0,
        tags: tags.tags?.length ?? 0,
      });
    });
  }, []);

  return (
    <AdminLayout currentPath="/admin">
      <h1 className="text-3xl font-bold mb-8">仪表盘</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">文章</CardTitle>
            <FileText className="w-4 h-4 text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.articles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">分类</CardTitle>
            <FolderOpen className="w-4 h-4 text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">标签</CardTitle>
            <Tag className="w-4 h-4 text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tags}</div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
