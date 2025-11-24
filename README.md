# Air Home Landing (Discourse theme component)

This component targets the Discourse Air theme and adds a custom landing block to the top of the categories page (desktop and mobile). It leaves the rest of Air untouched.

## What it does
- Injects a hero + sections (alumni spotlight, most talked topics, latest, popular courses, events, categories grid) above the categories list.
- Fetches data for each section from configurable endpoints (Data Explorer or external APIs) and hydrates cards client-side.
- Scoped styles under `.gh-home` to avoid clashing with Air.

## Files
- `about.json` – marks this as a component and depends on `discourse-air`.
- `settings.yml` – copy/CTA/stat text and endpoints/toggles.
- `common/common.scss` – styles for the landing block.
- `javascripts/discourse/templates/connectors/discovery-categories-top/gh-landing*.hbs` – mounts the landing block at the top of the categories page.
- `javascripts/discourse/initializers/home-landing.js` – builds markup from settings, fetches endpoints, and hydrates sections.

## Settings / data
- Default endpoints: `latest_endpoint = /latest.json`, `categories_endpoint = /categories.json`; others are blank so you can point them to Data Explorer or external APIs.
- Do not store API keys in settings; use a proxy if needed.

## Usage
1. Install the component and attach it to the Air theme (Admin > Customize > Themes > Air > Components > Add).
2. Configure settings (hero copy, CTA links, stats, endpoints). Leave an endpoint blank to render skeleton then empty state.
3. Visit `/` (categories homepage) with `?preview_theme_id=<air_theme_id>&no_subscriptions=1` to verify.

## Notes
- The component only touches the categories landing; other pages remain Air defaults.
- If you switch homepage away from categories, ensure `/` still routes to categories or add the component to the relevant discovery pages.*** End Patch
