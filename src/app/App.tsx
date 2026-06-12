import { useEffect, useState } from "react";
import { matchRoute } from "../lib/routes";
import { getPortalSnapshot, type PortalSnapshotUser } from "../lib/api";
import { AppLayout } from "../layouts/AppLayout";
import { HomePage } from "../pages/home/HomePage";
import { ArticlePage } from "../pages/article/ArticlePage";
import { TimelinePage } from "../pages/timeline/TimelinePage";
import { SearchPage } from "../pages/search/SearchPage";
import { AdminPage } from "../pages/admin/AdminPage";
import { ArticleManagePage } from "../pages/admin/articles/ArticleManagePage";
import { NewArticlePage } from "../pages/admin/articles/new/NewArticlePage";
import { EditArticlePage } from "../pages/admin/articles/edit/EditArticlePage";
import { CategoryManagePage } from "../pages/admin/categories/CategoryManagePage";
import { TagManagePage } from "../pages/admin/tags/TagManagePage";

export function App() {
  const [route, setRoute] = useState(matchRoute(window.location.pathname));
  const [user, setUser] = useState<PortalSnapshotUser | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(matchRoute(window.location.pathname));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    getPortalSnapshot()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  const renderPage = () => {
    switch (route.name) {
      case "home":
        return <HomePage />;
      case "article":
        return <ArticlePage slug={route.slug} user={user} />;
      case "timeline":
        return <TimelinePage />;
      case "search":
        return <SearchPage />;
      case "admin":
        return <AdminPage />;
      case "admin-articles":
        return <ArticleManagePage />;
      case "admin-article-new":
        return <NewArticlePage />;
      case "admin-article-edit":
        return <EditArticlePage id={route.id} />;
      case "admin-categories":
        return <CategoryManagePage />;
      case "admin-tags":
        return <TagManagePage />;
      case "callback":
        return <div>处理登录中...</div>;
      case "access-denied":
        return <div className="text-center py-12">访问被拒绝</div>;
      default:
        return <div className="text-center py-12">页面不存在</div>;
    }
  };

  return <AppLayout user={user}>{renderPage()}</AppLayout>;
}
