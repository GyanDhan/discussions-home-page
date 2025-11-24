# GyanDhan Discussions Home (Discourse Theme Component)

A lightweight theme component that replaces the Discourse homepage (`/`) with a custom landing layout inspired by the provided mock. It only touches the home view; all other pages stay native.

## What’s included
- Hero with CTA + stats (configurable via theme settings)
- Alumni spotlight cards
- Most talked topics
- Latest topics (defaults to `/latest.json`)
- Popular courses (external/custom API)
- Upcoming events (external/custom API)
- Explore categories grid (defaults to `/categories.json`)

## Setup
1. In Discourse admin, set `top menu` to include `home` first so `/` renders the custom page.
2. Install this theme component from GitHub (`git@github.com:GyanDhan/discussions-home-page.git`).
3. Open the component’s settings and fill CTA labels/links, hero stats, and the endpoints for each data block.

## Data endpoints
Each block can fetch JSON from a public or proxied endpoint you control. The component does **not** store secrets; do not put API keys in settings.

- `latest_endpoint` defaults to `/latest.json` (works for public forums).
- `categories_endpoint` defaults to `/categories.json`.
- Other blocks (`alumni_endpoint`, `most_talked_endpoint`, `popular_courses_endpoint`, `events_endpoint`) should point to your own API or a proxy.

### Using Data Explorer
If you want Data Explorer results (e.g., “most talked topics”), expose the query via a small proxy or make it public to anon:
- Create a query that returns the columns you need.
- Add a proxy endpoint that injects `Api-Key`/`Api-Username` server-side (recommended) or enable anon access for that query if acceptable.
- Point the block’s `*_endpoint` setting to that proxy URL.

Expected shapes (can be extended as needed):
- Topics: `topic_list.topics` or `{ topics: [...] }` with `title`, `slug`, `id`, `posts_count`, `views`, `tags`.
- Alumni: `{ alumni: [{ name, title, university, avatar, cta_url, cta_label }] }`.
- Courses: `{ courses: [{ title, description, price, cta_url, cta_label }] }`.
- Events: `{ events: [{ title, date, location, cta_url, cta_label }] }`.

## File layout
- `about.json` – marks this as a component and registers `home` in the top menu.
- `settings.yml` – hero copy, toggles, and endpoints.
- `desktop/home.html` + `mobile/home.html` – homepage markup.
- `desktop/categories.html` + `mobile/categories.html` – fallback: render the same layout on the categories route when enabled.
- `common/common.scss` – layout and styling.
- `javascripts/discourse/initializers/home-landing.js` – fetches endpoints and hydrates sections; handles errors gracefully.

## Notes and next steps
- Add your branding assets (e.g., hero art, icons) via CSS background or an image setting.
- Tune the theme settings for copy/URLs and hide sections you don’t need.
- For protected data, always proxy rather than embedding keys in theme settings.
- Test on staging for anon vs. logged-in, mobile/desktop, and slow networks.
- If the `home` tab cannot be selected in `top menu`, set `use_categories_fallback` (enabled by default) to render this layout on the categories route. Disable it if you want the native categories page instead.
