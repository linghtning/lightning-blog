import { useEffect, useState } from 'react'
import { matchRoute } from '../lib/routes'
import { getPortalSnapshot } from '../lib/api'
import { AppLayout } from '../layouts/AppLayout'
import { HomePage } from '../pages/home/HomePage'
import { ArticlePage } from '../pages/article/ArticlePage'
import { TimelinePage } from '../pages/timeline/TimelinePage'
import { SearchPage } from '../pages/search/SearchPage'
import { AdminPage } from '../pages/admin/AdminPage'
import { ArticleManagePage } from '../pages/admin/articles/ArticleManagePage'
import { NewArticlePage } from '../pages/admin/articles/new/NewArticlePage'

export function App() {
  const [route, setRoute] = useState(matchRoute(window.location.pathname))
  const [user, setUser] = useState<{ displayName: string; avatarUrl: string | null } | null>(null)

  useEffect(() => {
    const handlePopState = () => {
      setRoute(matchRoute(window.location.pathname))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    getPortalSnapshot()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
  }, [])

  useEffect(() => {
    setRoute(matchRoute(window.location.pathname))
  }, [window.location.pathname])

  const renderPage = () => {
    switch (route.name) {
      case 'home':
        return <HomePage />
      case 'article':
        return <ArticlePage slug={route.slug} user={user as { portalUserId: string } | null} />
      case 'timeline':
        return <TimelinePage />
      case 'search':
        return <SearchPage />
      case 'admin':
        return <AdminPage />
      case 'admin-articles':
        return <ArticleManagePage />
      case 'admin-article-new':
        return <NewArticlePage />
      case 'callback':
        return <div>处理登录中...</div>
      case 'access-denied':
        return <div className="text-center py-12">访问被拒绝</div>
      default:
        return <div className="text-center py-12">页面不存在</div>
    }
  }

  return (
    <AppLayout user={user}>
      {renderPage()}
    </AppLayout>
  )
}
