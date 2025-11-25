# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Discourse theme component** called "Air Home Landing" that adds a custom landing page to the Discourse Air theme. It's not a standalone application—it's a plugin component that extends Discourse's theming system.

### Key Characteristics
- **Component dependency**: Requires `discourse-air` theme (specified in `about.json`)
- **Client-side only**: No server-side code; uses Discourse API initializers
- **Scoped injection**: Only appears on home/categories routes (`/` or `/categories`)
- **Data-driven**: Fetches from configurable endpoints and hydrates UI client-side

## Architecture

### File Structure & Responsibilities

**Configuration Layer:**
- `settings.yml` - Theme settings exposed in Discourse admin (text, endpoints, toggles)
- `about.json` - Component metadata and theme dependencies

**Presentation Layer:**
- `common/common.scss` - All styles scoped under `.gh-home` to avoid conflicts with Air theme
- `javascripts/discourse/templates/connectors/` - Handlebars templates that mount into Discourse plugin outlets

**Logic Layer:**
- `javascripts/discourse/initializers/home-landing.js` - Core application logic:
  - Builds HTML from settings using template literals
  - Fetches data from endpoints (Discourse JSON APIs or external)
  - Hydrates sections with fetched data
  - Handles dynamic filtering (trending topics time periods)
  - Validates route context to only show on appropriate pages

### Data Flow

1. **Initialization**: `apiInitializer` runs on page load via Discourse plugin API
2. **Route check**: `isLandingRoute()` validates current path is `/` or `/categories`
3. **HTML generation**: `buildHomeHtml(settings)` constructs markup from theme settings
4. **Injection**: Markup inserted into connector outlet via `.gh-home` container
5. **Hydration**: `hydrate()` finds all `[data-block]` elements and:
   - Extracts `data-endpoint` URL
   - Fetches JSON data
   - Normalizes response via `normalizers[blockName]`
   - Renders cards via `renderers[blockName]`
   - Removes skeleton loading state

### Section Types & Rendering

Each section follows the pattern: `normalizer → fetch → renderer`

**Sections:**
- `alumni` - 3-column grid of alumni profiles with avatars
- `most-talked` - 3-column grid of trending topics (filterable by time period)
- `latest` - Vertical list of recent topics
- `popular-courses` - List of course cards with pricing
- `events` - 2-column grid of upcoming events with images
- `categories` - Chip grid of category links (filterable via `categories_slugs` setting)

**Placeholders**: Each section has fallback data in `placeholders` object for when endpoints are empty

## Key Technical Patterns

### Settings Access
Settings are globally available via `settings` object (provided by Discourse):
```javascript
const title = settings.hero_title || "default";
```

### Endpoint Configuration
- Default Discourse endpoints: `/latest.json`, `/top.json`, `/categories.json`
- Custom endpoints: Set in theme settings (e.g., Data Explorer queries, external APIs)
- Empty endpoint = render placeholder data

### Dynamic Filtering
The trending topics filter uses a refactored `loadBlock()` function that:
- Re-fetches data with updated endpoint URL
- Shows skeleton state during fetch
- Swaps content without page reload

### Route Scoping
Landing only appears when:
```javascript
path === "" || path === "/" || path === "/categories"
```
This prevents it from appearing on `/latest`, `/top`, individual topics, etc.

### Responsive Design
- Desktop: Multi-column grids (2-col, 3-col)
- Tablet (< 960px): Collapse to single column or 2-col
- Mobile (< 560px): Horizontal carousels with scroll-snap

## Working with This Codebase

### Testing Changes Locally

Since this is a Discourse theme component, you need a running Discourse instance:

1. **Install in Discourse:**
   - Admin → Customize → Themes → Air → Components → Install from Git
   - Or manually upload files via theme editor

2. **Preview:**
   - Visit `/?preview_theme_id=<air_theme_id>` to test without applying globally
   - Check browser console for `[GD Connect Theme]` logs showing available category slugs

3. **Hot reload:**
   - Discourse themes reload on file save in development mode
   - Force refresh: Clear cache + hard reload (Ctrl+Shift+R)

### Common Modifications

**Adding a new section:**
1. Add toggle and endpoint settings to `settings.yml`
2. Create normalizer in `normalizers` object
3. Create render function (follow existing patterns)
4. Add section HTML to `buildHomeHtml()`
5. Add CSS under `.gh-home` namespace

**Styling changes:**
- All styles in `common/common.scss`
- Use CSS custom properties defined in `:root` (e.g., `var(--gh-primary)`)
- Maintain `.gh-` prefix on all classes to avoid Air theme conflicts

**Endpoint changes:**
- Update default values in `settings.yml`
- Ensure normalizers handle the expected JSON structure
- Test with empty/error responses (should gracefully show placeholder or error state)

### Important Constraints

**No server-side code:** Everything runs client-side via Discourse's API initializer pattern. You cannot add Rails controllers, models, or background jobs.

**Theme setting limitations:**
- `categories_slugs` setting cannot have true autocomplete in admin UI
- Workaround: Helper logs available slugs to console on page load
- Settings are read-only at runtime (require admin change + page reload)

**Discourse API version:**
- Uses API initializer version `0.11.3`
- Changes to Discourse plugin API may require version bump and code updates

**Scoped to Air theme:**
- Component only works when Air theme is active
- Styles assume Air's base styles are present
- Outlet connectors are specific to Air's template structure

## Alumni Spotlight Configuration

The alumni spotlight can be configured in two ways:

### Option 1: Username-Based (Recommended)

Set `alumni_usernames` to a comma-separated list of Discourse usernames. The theme will automatically fetch user data from Discourse's user API.

**Data Mapping:**
- `user.name` or `user.username` → Alumni name
- `user.avatar_template` → Profile picture
- `user_fields[19]` → Degree (displayed as title/subtitle)
- `user_fields[18]` → College/University
- `user_fields[17]` → Location
- Message CTA: Opens Discourse composer modal for private message

**Custom Field IDs:**
These are hardcoded in `CUSTOM_FIELD_IDS` (home-landing.js:16-20):
- Location: 17
- College: 18
- Degree: 19

**Empty Field Handling:**
If any custom field is empty, that field is completely hidden from the card (no blank space).

**Message Button Behavior:**
The "Message" button on alumni cards opens Discourse's native message composer modal (via `api.container.lookup("controller:composer").open()`), allowing users to send private messages without leaving the page. This provides the same UX as clicking "Message" on a user's profile.

**Console Helper:**
On homepage load, an "Alumni Spotlight Configuration Helper" appears in console with:
- Step-by-step configuration instructions
- Current username configuration
- Field mapping reference

### Option 2: External Endpoint

Set `alumni_endpoint` to an external API URL. Data is fetched and normalized via `normalizers.alumni`.

**Note:** If `alumni_usernames` is set, it takes precedence over `alumni_endpoint`.

## Events Configuration

### Overview
The "Upcoming Events" section displays 2 upcoming events from https://www.gyandhan.com/events.

### Data Source Setup

Since this is a client-side theme component, you need a backend endpoint to fetch events data.

### Simple Options (No Backend Required)

**Option 1: Manual Updates (Quickest)**
Leave `events_endpoint` empty and the theme will show placeholder events. Update placeholder events in `home-landing.js:338-343` when needed.

**Option 2: Use Discourse Topics as Events**
- Create topics in a specific category for events
- Tag them with `#event`
- Point `events_endpoint` to `/tag/event.json`
- The normalizer will treat topics as events

### Backend Options (More Dynamic)

**Option 3: Cloudflare Worker (Recommended - 5 Minutes Setup)**

Cloudflare Workers is the easiest serverless option with generous free tier.

**Quick Setup:**
1. Go to https://dash.cloudflare.com → Workers & Pages
2. Create New Worker named `gyandhan-events`
3. Copy code from `cloudflare-worker/gyandhan-events.js` in this repo
4. Save and Deploy
5. Copy the worker URL: `https://gyandhan-events.YOUR-SUBDOMAIN.workers.dev`
6. Set `events_endpoint` to this URL in theme settings

**Complete instructions:** See `cloudflare-worker/README.md`

**Features:**
- ✅ Free tier: 100,000 requests/day
- ✅ Auto CORS handling
- ✅ 1-hour caching
- ✅ Fallback events if scraping fails
- ✅ No credit card required

**Option 4: Google Apps Script (No Server)**
Create a Google Apps Script that scrapes and caches events:

```javascript
function doGet() {
  const events = fetchGyandhanEvents();
  return ContentService.createTextOutput(JSON.stringify({ events }))
    .setMimeType(ContentService.MimeType.JSON);
}

function fetchGyandhanEvents() {
  const response = UrlFetchApp.fetch('https://www.gyandhan.com/events');
  // Parse HTML and extract events
  // Return array of 2 events
}
```

Deploy as web app, set `events_endpoint` to the apps script URL.

**Option 5: Custom Discourse Plugin (For Later)**
When ready for a permanent solution, create a Discourse plugin:
```ruby
# plugins/gyandhan-events/plugin.rb
Discourse::Application.routes.append do
  get '/gyandhan-events' => 'gyandhan_events#index'
end
```

This requires Rails/Ruby knowledge and Discourse restart.

### Expected JSON Structure

The `events_endpoint` should return JSON in one of these formats:

```json
{
  "events": [
    {
      "title": "Complete Guide to Studying Abroad After 12th",
      "date": "Saturday, November 29, 2025" or "Nov 29",
      "location": "Online Event" or "Hybrid",
      "mode": "Online",
      "url": "https://www.gyandhan.com/events/...",
      "image": "https://www.gyandhan.com/.../event-image.jpg" (optional)
    }
  ]
}
```

Or directly as an array:
```json
[
  {
    "title": "...",
    "date": "...",
    "location": "...",
    "url": "..."
  }
]
```

### Field Mapping
- `title` → Event name (required)
- `date` or `starts_at` → Display date (flexible format)
- `location` or `mode` → "Online Event", "Hybrid", "City Name"
- `url` or `cta_url` → Registration/details link
- `image` or `thumbnail` → Event image (optional, shows placeholder if empty)
- `cta_label` → Button text (defaults to "Register")

### Normalizer Behavior
The events normalizer (`home-landing.js:252-257`):
- Handles `data.events`, `data.data.events`, or root array
- Automatically limits to 2 events (even if endpoint returns more)
- Gracefully handles missing fields

### Implementation Steps

1. **Create Backend Endpoint**
   - Set up scraper for https://www.gyandhan.com/events
   - Extract: title, date, location, URL for upcoming events
   - Return as JSON endpoint

2. **Configure Theme Setting**
   - Admin → Customize → Themes → Air Home Landing
   - Set `events_endpoint` to your API URL
   - Example: `/events.json` or `https://api.example.com/gyandhan/events`

3. **Verify Data**
   - Check browser console for fetch logs
   - Verify 2 events appear in UI
   - Test with empty response (should show placeholder)

### CORS Considerations
Direct client-side fetching from https://www.gyandhan.com/events will fail due to CORS policy. You **must** use a backend endpoint.

## Category Slug Configuration

The theme includes an enhanced configuration helper for the `categories_slugs` setting:

**Console Helper:**
- On homepage load, a collapsible console group appears: "[GD Connect Theme] Category Configuration Helper"
- Shows a table of all available categories with their slugs and names
- Displays current configuration and example values
- Provides step-by-step instructions for updating the setting

**Validation:**
- Invalid slugs trigger console warnings with list of valid options
- Warns if more than 6 categories are selected (shows only first 6)
- Continues to work even with invalid slugs (filters them out gracefully)

**Admin Workflow:**
1. Visit homepage and open browser console
2. Expand the "[GD Connect Theme] Category Configuration Helper" group
3. Review available category slugs in the table
4. Copy desired slugs (up to 6)
5. Go to Admin → Customize → Themes → Air → Components → Air Home Landing
6. Paste comma-separated slugs into `categories_slugs` setting
7. Save and refresh to see changes

**Note:** Due to Discourse theme API limitations, this cannot be a true multi-select dropdown like site settings. The console helper provides the best UX possible within these constraints.
