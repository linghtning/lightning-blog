# Lightning Blog Design Spec

## Overview

A personal blog system that follows the same architectural patterns as the existing Lightning platform projects (portal, manga-reader, reading-h5). Deploys at `blog.orgcatfun.site:10004` and integrates with Portal OIDC for unified authentication.

## Goals

- Public blog where anyone can read articles
- Only authenticated users (via Portal SSO) can create/edit articles
- Online Markdown editor with live preview
- Categories, tags, comments, search, timeline
- Unified dark theme matching other Lightning projects

## Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 + TypeScript 6 |
| Styling | Tailwind CSS v4 + shadcn/ui components |
| Backend | Hono 4 + @hono/node-server |
| Database | PostgreSQL 17 + Drizzle ORM |
| Auth | OpenID Connect (openid-client v6) |
| Validation | Zod v4 |
| Package Manager | pnpm 10.33 |
| Testing | Vitest 4 |
| Linting | oxlint |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |

### Project Structure

```
lightning-blog/
├── src/
│   ├── app/
│   │   └── App.tsx                  # Root component with route switch
│   ├── components/ui/               # shadcn/ui primitives (button, badge, input, card, textarea)
│   ├── features/
│   │   ├── articles/
│   │   │   ├── ArticleCard.tsx      # Article list item
│   │   │   ├── ArticleList.tsx      # Article grid/list
│   │   │   ├── ArticleDetail.tsx    # Full article view
│   │   │   ├── ArticleEditor.tsx    # Markdown editor with preview
│   │   │   └── PinnedBadge.tsx      # Pinned indicator
│   │   ├── comments/
│   │   │   ├── CommentList.tsx      # Comment thread
│   │   │   ├── CommentForm.tsx      # New comment form
│   │   │   └── CommentItem.tsx      # Single comment
│   │   └── search/
│   │       └── SearchResults.tsx    # Search results display
│   ├── layouts/
│   │   ├── AppLayout.tsx            # Main shell (header, nav, footer)
│   │   └── AdminLayout.tsx          # Admin panel shell
│   ├── lib/
│   │   ├── api.ts                   # Client-side fetch wrapper
│   │   ├── routes.ts                # Client-side pathname router
│   │   └── utils.ts                 # cn() utility
│   ├── modules/
│   │   ├── access/
│   │   │   ├── access.service.ts    # Auth orchestration (reuse pattern)
│   │   │   └── oidc-client.ts       # OpenID Connect adapter (reuse pattern)
│   │   └── blog/
│   │       ├── article.service.ts   # Article CRUD logic
│   │       ├── category.service.ts  # Category management
│   │       ├── tag.service.ts       # Tag management
│   │       └── comment.service.ts   # Comment management
│   ├── pages/
│   │   ├── home/                    # Homepage (latest + pinned articles)
│   │   ├── article/                 # Article detail page
│   │   ├── category/                # Articles by category
│   │   ├── tag/                     # Articles by tag
│   │   ├── timeline/                # Timeline view
│   │   ├── search/                  # Search results page
│   │   ├── admin/                   # Admin dashboard
│   │   ├── admin/articles/          # Article management
│   │   ├── admin/articles/new/      # New article editor
│   │   ├── admin/articles/edit/     # Edit article editor
│   │   ├── callback/                # OIDC callback handler
│   │   └── access-denied/           # Unauthorized page
│   ├── server/
│   │   ├── index.ts                 # Server entry
│   │   ├── app.ts                   # Hono route definitions
│   │   ├── cookies.ts               # Session cookie helpers
│   │   └── runtime.ts               # Runtime composition root
│   ├── shared/
│   │   ├── env.ts                   # Zod-validated environment config
│   │   ├── types.ts                 # Shared TypeScript types
│   │   ├── blog-store.ts            # BlogStore interface
│   │   ├── db-blog-store.ts         # PostgreSQL implementation
│   │   ├── memory-blog-store.ts     # In-memory implementation
│   │   ├── secrets.ts               # Token generation
│   │   └── time.ts                  # Date helpers
│   ├── db/
│   │   ├── schema.ts                # Drizzle ORM schema
│   │   ├── client.ts                # DB client factory
│   │   └── migrations/              # SQL migrations
│   ├── index.css                    # Tailwind + dark theme CSS vars
│   └── main.tsx                     # React entry point
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── .github/workflows/deploy.yml     # CI/CD pipeline
├── Dockerfile                       # Multi-stage build
├── docker-compose.yml               # App + PostgreSQL
├── drizzle.config.ts
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

## Data Models

### articles
| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| title | text | Article title |
| slug | text | URL-friendly identifier (unique) |
| content | text | Markdown content |
| excerpt | text | Short summary (auto-generated or manual) |
| status | enum | draft, published |
| pinned | boolean | Whether article is pinned to top |
| author_id | text | Portal user ID |
| category_id | uuid | FK to categories |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |
| published_at | timestamp | Publication time |

### categories
| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| name | text | Display name |
| slug | text | URL-friendly identifier (unique) |
| description | text | Optional description |
| parent_id | uuid | Self-referential FK for hierarchy |

### tags
| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| name | text | Display name |
| slug | text | URL-friendly identifier (unique) |

### article_tags
| Column | Type | Description |
|---|---|---|
| article_id | uuid | FK to articles |
| tag_id | uuid | FK to tags |

### comments
| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| content | text | Comment text |
| article_id | uuid | FK to articles |
| author_id | text | Portal user ID |
| parent_id | uuid | Self-referential FK for replies |
| created_at | timestamp | Creation time |

### portal_user_profiles (reuse pattern)
| Column | Type | Description |
|---|---|---|
| portal_user_id | text | Portal user ID (PK) |
| username | text | Username |
| display_name | text | Display name |
| avatar_url | text | Avatar URL |
| role | enum | user, super_admin |

### app_sessions (reuse pattern)
| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| portal_user_id | text | FK to portal_user_profiles |
| token | text | Session token (SHA-256 hashed) |
| portal_access_token | text | OIDC access token |
| expires_at | timestamp | Session expiry |
| revoked_at | timestamp | Revocation time |

## API Routes

### Public Routes
```
GET    /api/articles              # List articles (paginated, filterable)
GET    /api/articles/:slug        # Get article by slug
GET    /api/categories            # List categories
GET    /api/categories/:slug      # Get category with articles
GET    /api/tags                  # List tags
GET    /api/tags/:slug            # Get tag with articles
GET    /api/articles/:id/comments # List comments for article
GET    /api/search?q=             # Search articles
GET    /api/timeline              # Timeline data
```

### Authenticated Routes
```
POST   /api/articles              # Create article
PUT    /api/articles/:id          # Update article
DELETE /api/articles/:id          # Delete article
POST   /api/categories            # Create category
PUT    /api/categories/:id        # Update category
DELETE /api/categories/:id        # Delete category
POST   /api/tags                  # Create tag
DELETE /api/tags/:id              # Delete tag
POST   /api/articles/:id/comments # Create comment
DELETE /api/comments/:id          # Delete comment
```

### Auth Routes
```
GET    /auth/login                # Initiate Portal SSO login
GET    /auth/callback             # OIDC callback handler
POST   /auth/logout               # Logout
GET    /api/auth/me               # Current user profile
```

## Authentication Flow

Reuse the OIDC pattern from `lightning-reading-h5`:

1. User clicks login → `/auth/login`
2. Server creates OIDC authorization URL with PKCE
3. User authenticates at Portal (`orgcatfun.site`)
4. Portal redirects back to `/auth/callback` with code + state
5. Server exchanges code, creates session, sets 30-day cookie
6. Subsequent requests validated via session cookie

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | HomePage | Latest articles, pinned articles, categories sidebar |
| `/articles/:slug` | ArticlePage | Full article with comments |
| `/categories/:slug` | CategoryPage | Articles in category |
| `/tags/:slug` | TagPage | Articles with tag |
| `/timeline` | TimelinePage | Chronological article list |
| `/search?q=` | SearchPage | Search results |
| `/admin` | AdminPage | Dashboard (article count, recent activity) |
| `/admin/articles` | ArticleManagePage | Article list with status filters |
| `/admin/articles/new` | ArticleEditorPage | New article editor |
| `/admin/articles/:id/edit` | ArticleEditorPage | Edit article editor |
| `/admin/categories` | CategoryManagePage | Category management |
| `/admin/tags` | TagManagePage | Tag management |
| `/callback` | CallbackPage | OIDC callback handler |
| `/access-denied` | AccessDeniedPage | Unauthorized page |

## Key Patterns

### Dual Store Architecture
- `BlogStore` interface defines data access contract
- `DbBlogStore`: PostgreSQL via Drizzle ORM (production)
- `MemoryBlogStore`: In-memory Maps (development)
- Runtime selects implementation based on `DATABASE_URL`

### Runtime Composition Root
`createRuntime()` wires all dependencies: env config, store, access service, blog services. No global singletons.

### Middleware-Based Auth
Protected routes use Hono middleware to check session cookie. Returns 401 if unauthorized.

### Markdown Rendering
- Editor: Textarea with live preview using `react-markdown` or similar
- Content stored as raw Markdown in database
- Rendered on frontend with syntax highlighting (e.g., `rehype-highlight`)

### Image Handling
- Article images uploaded to server or external URLs
- Server proxies images with proper referer headers if needed
- Optional: integrate with external image storage

## Environment Variables

```
NODE_ENV=development
PORT=10004
DATABASE_URL=postgresql://user:pass@localhost:15404/blog
PUBLIC_BASE_URL=http://blog.orgcatfun.site
PORTAL_BASE_URL=http://orgcatfun.site
SSO_CALLBACK_URL=http://blog.orgcatfun.site/auth/callback
OIDC_CLIENT_ID=blog
```

## Deployment

- Docker Compose: app + PostgreSQL (port 15404)
- GitHub Actions: lint → format → type-check → test → build → deploy
- Deploy target: `/opt/lightning/lightning-blog`
- Health check: `GET /api/health`

## Testing Strategy

- Co-located tests with source files
- Service tests: article, category, tag, comment services
- Store tests: memory store implementation
- Component tests: article card, comment form, editor
- API tests: server route integration tests
