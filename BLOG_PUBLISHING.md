# Publishing a Blog Post on ePlate.my

This is the production runbook for adding and publishing a blog post on `https://eplate.my/blog/`.

## Production architecture

- Repository: `https://github.com/kanggroupmy/eplate-my`
- Production branch: `main`
- Public website source: static HTML at the repository root
- Public website Worker: `eplate-my`
- Cloudflare account: `jkang.loh@gmail.com`
- Cloudflare account ID: `314aedf9a8f9679573b9c244bb896bf4`
- Cloudflare zone ID for `eplate.my`: `60dc72cfd6e6f86e78417efb788ef1e9`
- Production domain: `https://eplate.my`

Important: the root domain is a Cloudflare Worker custom domain. GitHub Pages may build successfully, but that alone does not update the public website. The `eplate-my` Worker must also receive the updated static assets.

Do not deploy public-site files to `eplate-order`. That is the separate Worker for the order/admin application.

## Files that must change

For a post with the slug `example-post`:

1. Create `blog/example-post/index.html`.
2. Add its card near the top of `blog/index.html`.
3. Add its canonical URL to `sitemap.xml` and update the blog index `lastmod` date.
4. Put locally hosted images under `images/blog/`.

Do not edit an experimental Next.js data file and assume it is production. The production blog is the static `blog/` directory at the repository root.

## Article requirements

Use a recent post such as `blog/jpjeplate-ice-hybrid-malaysia-rollout/index.html` as the structural and visual reference.

Every article must include:

- A unique, search-focused `<title>`.
- A natural meta description of roughly 140–160 characters.
- `index, follow` robots metadata.
- A self-referencing canonical URL with a trailing slash.
- Open Graph title, description, URL and image.
- Twitter large-image metadata when a featured image exists.
- `Article` JSON-LD with headline, description, author, publisher, dates, image and canonical page URL.
- `FAQPage` JSON-LD only when the same questions and answers are visibly present on the page.
- A visible publication date.
- Descriptive image `alt` text, explicit width/height and a source caption.
- Links to primary sources and clearly labelled secondary reporting.
- A statement that ePlate.my is an independent third-party marketplace when official JPJ information is discussed.
- A relevant order/contact call to action.

Write an original summary and analysis. Do not closely reproduce the wording or structure of another publisher. Separate confirmed facts from rumours, estimates or speculation.

## Image handling

- Prefer an original official source image supplied by the user or released by JPJ.
- Preserve attribution in the visible caption.
- Use a descriptive filename, for example `images/blog/jpj-rfp-special-plates-2026.png`.
- Keep the file mode readable (`0644`).
- Reference the production path, such as `/images/blog/example.png`.
- Use the absolute production URL in Open Graph and JSON-LD metadata.

## Validate before committing

From the repository root:

```sh
git diff --check -- blog/ images/blog/ sitemap.xml
xmllint --noout sitemap.xml
```

Validate every JSON-LD block by parsing it as JSON. Confirm that:

- The canonical URL matches the intended slug.
- The article appears in `blog/index.html`.
- The URL appears in `sitemap.xml`.
- Every local image path exists.
- Confirmed facts, dates and quotations match the primary source.

## Commit and push safely

Check the repository before changing Git state:

```sh
git status --short
git branch --show-current
git fetch origin main
```

Preserve unrelated local changes. Stage only the new article, its images, `blog/index.html` and `sitemap.xml`.

```sh
git add -- blog/example-post/index.html images/blog/example-image.png blog/index.html sitemap.xml
git diff --cached --check
git diff --cached --stat
git commit -m "Publish example blog post"
git push origin main
```

Never force-push. If the checkout is dirty or behind `origin/main`, use a temporary worktree based on the latest remote branch, apply only the focused blog commit there, and push from that clean worktree. Do not stash or overwrite unrelated user work merely to deploy a blog post.

## Deploy the public Worker

Use Wrangler 4 or newer. Confirm authentication before deploying:

```sh
wrangler --version
wrangler whoami
```

`whoami` must show `jkang.loh@gmail.com` and account ID `314aedf9a8f9679573b9c244bb896bf4`.

Create a temporary deployment directory and copy only the public website assets into it. Include:

- `index.html`
- `og-image.svg`
- `robots.txt`
- `sitemap.xml`
- `blog/`
- `images/`
- `eplate-installer-johor-bahru/`
- `iskandar-puteri/`
- `johor-bahru/`
- `jpjeplate-installation-johor-bahru/`
- `jpjeplate-near-me/`
- `jpjeplate-permas-jaya/`
- `jpjeplate-price-malaysia/`
- `pasir-gudang/`
- `skudai/`
- `tebrau/`

Do not upload `.git`, application source, credentials, `node_modules`, `apps/order`, local environment files or DNS export files as public assets.

Create a temporary Wrangler configuration beside the asset directory:

```json
{
  "name": "eplate-my",
  "compatibility_date": "YYYY-MM-DD",
  "assets": {
    "directory": "./site-assets"
  }
}
```

Use the current date for `compatibility_date`. This is an asset-only Worker: do not add a `main` script or bindings.

Always run a dry deployment first:

```sh
wrangler deploy --dry-run --config /absolute/path/to/wrangler.jsonc
```

The dry run must identify the Worker as `eplate-my`, read only the intended site assets and report no bindings. Then deploy:

```sh
wrangler deploy --config /absolute/path/to/wrangler.jsonc
```

Confirm the output says `Uploaded eplate-my`, `Deployed eplate-my triggers`, and returns a new version ID. Existing custom domains remain attached to the Worker.

## Verify production

Check all affected public URLs, not only the Worker preview URL:

```sh
curl -sS -L --max-time 15 -o /tmp/eplate-blog-index.html -w '%{http_code}\n' 'https://eplate.my/blog/'
curl -sS -L --max-time 15 -o /tmp/eplate-article.html -w '%{http_code}\n' 'https://eplate.my/blog/example-post/'
curl -sS -L --max-time 15 -o /tmp/eplate-image -w '%{http_code}\n' 'https://eplate.my/images/blog/example-image.png'
```

All should return `200`. Also confirm the blog index contains the new slug and the article contains a distinctive heading or sentence.

Open the live page and visually check desktop and mobile layout, featured-image rendering, source links and the call to action.

## Cache troubleshooting

Deploying the Worker normally replaces its asset manifest immediately. If the origin has the new files but `eplate.my` serves an old copy, use Cloudflare's **Caching → Configuration → Custom Purge** and purge only:

- `https://eplate.my/blog/`
- The new article URL
- The new image URL
- `https://eplate.my/sitemap.xml` when necessary

Avoid **Purge Everything** for a single blog release. A purge cannot fix an old Worker asset bundle; if the purged URLs immediately return old content, deploy the updated assets to `eplate-my` again.

## Definition of done

A blog is published only when all of the following are true:

- The focused commit is present on GitHub `main`.
- The `eplate-my` Worker has a new successful version.
- The blog index displays the new card.
- The article, featured image and sitemap return `200` on `eplate.my`.
- Article and FAQ structured data are valid.
- No unrelated application, database, binding or DNS configuration was changed.
