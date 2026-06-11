import { useState } from 'react'
import { BookOpen, Menu, X, LogOut } from 'lucide-react'
import { cn } from '../lib/utils'

type AppLayoutProps = {
  children: React.ReactNode
  user: { displayName: string; avatarUrl: string | null } | null
}

export function AppLayout({ children, user }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' })
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <BookOpen className="w-6 h-6" />
            <span className="font-bold text-lg">Lightning Blog</span>
          </a>

          <nav className="hidden md:flex items-center gap-6">
            <a href="/" className="text-muted hover:text-foreground transition-colors">
              首页
            </a>
            <a href="/timeline" className="text-muted hover:text-foreground transition-colors">
              时间线
            </a>
            {user && (
              <a href="/admin" className="text-muted hover:text-foreground transition-colors">
                管理
              </a>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted hidden md:inline">
                  {user.displayName}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-muted hover:text-foreground transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <a
                href="/auth/login"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                登录
              </a>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-muted hover:text-foreground"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <nav className="flex flex-col p-4 gap-4">
              <a href="/" className="text-muted hover:text-foreground">
                首页
              </a>
              <a href="/timeline" className="text-muted hover:text-foreground">
                时间线
              </a>
              {user && (
                <a href="/admin" className="text-muted hover:text-foreground">
                  管理
                </a>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-border py-8 text-center text-muted text-sm">
        <p>Powered by Lightning Blog</p>
      </footer>
    </div>
  )
}
