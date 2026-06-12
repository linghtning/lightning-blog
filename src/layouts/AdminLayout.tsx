import { BookOpen, FileText, Tag, FolderOpen, ArrowLeft } from "lucide-react";
import { cn } from "../lib/utils";

type AdminLayoutProps = {
  children: React.ReactNode;
  currentPath: string;
};

export function AdminLayout({ children, currentPath }: AdminLayoutProps) {
  const navItems = [
    { href: "/admin", label: "仪表盘", icon: BookOpen },
    { href: "/admin/articles", label: "文章管理", icon: FileText },
    { href: "/admin/categories", label: "分类管理", icon: FolderOpen },
    { href: "/admin/tags", label: "标签管理", icon: Tag },
  ];

  return (
    <div className="flex gap-8">
      <aside className="w-48 flex-shrink-0">
        <a
          href="/"
          className="flex items-center gap-2 text-muted hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回博客</span>
        </a>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                currentPath === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:text-foreground hover:bg-card",
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
