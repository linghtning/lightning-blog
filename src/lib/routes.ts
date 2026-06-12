export type AppRoute =
  | { name: "home" }
  | { name: "article"; slug: string }
  | { name: "category"; slug: string }
  | { name: "tag"; slug: string }
  | { name: "timeline" }
  | { name: "search"; query: string }
  | { name: "admin" }
  | { name: "admin-articles" }
  | { name: "admin-article-new" }
  | { name: "admin-article-edit"; id: string }
  | { name: "admin-categories" }
  | { name: "admin-tags" }
  | { name: "callback" }
  | { name: "access-denied" }
  | { name: "not-found" };

export function matchRoute(pathname: string): AppRoute {
  if (pathname === "/") return { name: "home" };
  if (pathname === "/timeline") return { name: "timeline" };
  if (pathname === "/callback") return { name: "callback" };
  if (pathname === "/access-denied") return { name: "access-denied" };

  if (pathname.startsWith("/articles/")) {
    const slug = pathname.slice("/articles/".length);
    return { name: "article", slug };
  }

  if (pathname.startsWith("/categories/")) {
    const slug = pathname.slice("/categories/".length);
    return { name: "category", slug };
  }

  if (pathname.startsWith("/tags/")) {
    const slug = pathname.slice("/tags/".length);
    return { name: "tag", slug };
  }

  if (pathname.startsWith("/search")) {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q") ?? "";
    return { name: "search", query };
  }

  if (pathname === "/admin") return { name: "admin" };
  if (pathname === "/admin/articles") return { name: "admin-articles" };
  if (pathname === "/admin/articles/new") return { name: "admin-article-new" };
  if (pathname.startsWith("/admin/articles/") && pathname.endsWith("/edit")) {
    const id = pathname.slice("/admin/articles/".length, -"/edit".length);
    return { name: "admin-article-edit", id };
  }
  if (pathname === "/admin/categories") return { name: "admin-categories" };
  if (pathname === "/admin/tags") return { name: "admin-tags" };

  return { name: "not-found" };
}

export function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
