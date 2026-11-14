# lauer.cz

Static personal website (HTML, CSS and vanilla JavaScript). There is no build step:
edit the files and commit.

- `index.html` - the English page (about, research, resources, gallery)
- `sluzby/index.html` - Czech services page (tutoring, consulting, collaboration)
- `css/styles.css` - all styles
- `js/script.js` - navigation, testimonials carousel, lightbox, contact
- `assets/` - images, CV and favicon
- `robots.txt` - crawling rules (search allowed, AI training blocked)
- `sitemap.xml` - the two indexable URLs, with `hreflang` alternates
- `_redirects` - `index.html` clean-up and `/cv` redirect; `www` canonicalization is configured in Cloudflare
- `404.html` - the 404 page served by the host for unknown URLs
- `c3e4d7a61f8b42e9a05d7b3c2416fe8a.txt` - IndexNow key for Bing, Seznam and others

Both pages share the same sidebar. It contains a page switcher
(About me / Services) that marks the current page with `aria-current="page"`;
additional pages should copy that markup.

## URLs

No URL shows `.html`:

- a folder is served at `https://lauer.cz/sluzby/` with the trailing slash
- `/sluzby/index.html` and `/index.html` are redirected to those URLs by `_redirects`
- `/sluzby` is redirected to `/sluzby/` with a 301, so internal links,
  canonical, `hreflang`, Open Graph and sitemap URLs use the trailing slash
- unknown URLs get `404.html` with an actual 404 response from Cloudflare Pages; no
  catch-all redirect is used or needed
- Cloudflare Pages `_redirects` rules only match paths, so the `www.lauer.cz` to
  `https://lauer.cz` redirect must be an account-level 301 Bulk Redirect with
  subpath matching, preserved path suffix and preserved query string

If the host starts redirecting `/sluzby/` to `/sluzby`, drop the trailing slash from
the canonical, `hreflang`, sitemap and internal links in one go, never in one place.

## Indexing

- `hreflang` must stay identical on both pages: `en` -> `/`, `cs` -> `/sluzby/`,
  `x-default` -> `/`.
- Titles and descriptions are unique per page; the `<title>` uses a plain hyphen.
- Structured data (JSON-LD) has to match what is visible on the page. The `@id`
  values (`https://lauer.cz/#michal-lauer`, `https://lauer.cz/#website`) are shared
  by both pages, so keep them unchanged.
- `robots.txt`: search indexing, AI grounding and user-initiated agents are allowed
  by default. The AIPREF `__usage_ai-training` group and provider-specific groups
  disallow model training. `Content-Signal` explicitly sets `search=yes`,
  `ai-input=yes` and `ai-train=no`. Consumers that do not support these emerging
  signals ignore them and still follow the standard crawler groups.
- In Cloudflare, `AI Crawler and Agent access policies` (Security > Settings >
  Bot traffic) must keep `Search` and `Agents` allowed so AI answers can cite the
  site, and `Training` disallowed. Enable Bot Preference Sync for edge enforcement
  of training-crawler blocks. The explicit rules in this repository keep the same
  policy understandable even without dashboard-only managed `robots.txt` directives.

## After deploying

- Google Search Console: resubmit `sitemap.xml`, run URL Inspection on `/` and
  `/sluzby/`, and check `Settings > Search generative AI` is set to include the site.
- Bing Webmaster Tools (feeds DuckDuckGo): submit the sitemap and submit both
  canonical URLs through IndexNow using the key file above.
- Seznam Webmaster: submit the sitemap.

Deployment is handled by `.github/workflows/deploy-production.yml`.
