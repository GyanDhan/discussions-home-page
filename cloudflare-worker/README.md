# Cloudflare Worker for Gyandhan Events

This Cloudflare Worker fetches upcoming events from https://www.gyandhan.com/events and returns them as JSON for the Discourse theme.

## Quick Setup (5 minutes)

### Step 1: Deploy the Worker

#### Option A: Using Cloudflare Dashboard (Easiest)

1. **Go to Cloudflare Dashboard**
   - Visit https://dash.cloudflare.com
   - Navigate to **Workers & Pages** in the left sidebar

2. **Create a New Worker**
   - Click **Create Application**
   - Click **Create Worker**
   - Give it a name: `gyandhan-events`

3. **Paste the Code**
   - Click **Edit Code** button
   - Delete all the default code
   - Copy the entire content from `gyandhan-events.js`
   - Paste it into the editor

4. **Save and Deploy**
   - Click **Save and Deploy**
   - Your worker is now live!

5. **Get the Worker URL**
   - Copy the worker URL (looks like: `https://gyandhan-events.YOUR-SUBDOMAIN.workers.dev`)
   - You'll use this in the theme settings

#### Option B: Using Wrangler CLI

If you prefer command line:

```bash
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create new worker
wrangler init gyandhan-events

# Copy gyandhan-events.js to the worker directory
cp gyandhan-events.js gyandhan-events/src/index.js

# Deploy
cd gyandhan-events
wrangler deploy
```

### Step 2: Test the Worker

Visit the worker URL in your browser:
```
https://gyandhan-events.YOUR-SUBDOMAIN.workers.dev
```

You should see JSON output like:
```json
{
  "events": [
    {
      "title": "Complete Guide to Studying Abroad After 12th",
      "date": "Nov 29, 2025",
      "location": "Online Event",
      "url": "https://www.gyandhan.com/events/...",
      "cta_label": "Register"
    },
    {
      "title": "Ireland's Study Abroad Revolution",
      "date": "Nov 30, 2025",
      "location": "Online Event",
      "url": "https://www.gyandhan.com/events/...",
      "cta_label": "Register"
    }
  ]
}
```

### Step 3: Configure Discourse Theme

1. Go to your Discourse admin panel
2. Navigate to **Customize → Themes → Air → Components → Air Home Landing**
3. Find the `events_endpoint` setting
4. Enter your worker URL: `https://gyandhan-events.YOUR-SUBDOMAIN.workers.dev`
5. Save changes

### Step 4: Verify on Homepage

1. Visit your Discourse homepage
2. Scroll to the "Upcoming Events" section
3. You should see 2 events loaded from Gyandhan

## How It Works

1. **Fetching**: Worker fetches HTML from https://www.gyandhan.com/events
2. **Parsing**: Extracts event data using regex patterns
3. **Formatting**: Returns up to 2 events as JSON
4. **Caching**: Results cached for 1 hour to reduce load
5. **CORS**: Automatically handles CORS headers for Discourse
6. **Fallback**: Returns placeholder events if scraping fails

## Customization

### Adjusting the Parser

The HTML structure of Gyandhan's events page may change. To update the parser:

1. Visit https://www.gyandhan.com/events in your browser
2. Right-click → Inspect Element
3. Find the HTML structure of event cards
4. Update the regex patterns in `parseEventsFromHTML()` function

Example patterns to look for:
- `<article class="event-card">` or `<div class="event">`
- Event title: `<h2>`, `<h3>`, or element with class "title"
- Date: `<time>` tag or element with class "date"
- Location: Element with class "location" or "mode"

### Changing Cache Duration

In the worker code, find:
```javascript
"Cache-Control": "public, max-age=3600", // Cache for 1 hour
```

Change `3600` to:
- `1800` for 30 minutes
- `7200` for 2 hours
- `86400` for 24 hours

### Adding More Events

Change this line:
```javascript
return eventList.slice(0, 2);
```

To:
```javascript
return eventList.slice(0, 3); // For 3 events
```

Also update the theme's `renderEvents()` function to display more.

## Troubleshooting

### No Events Showing

1. **Check Worker Logs**
   - Go to Cloudflare Dashboard → Workers
   - Click on your worker
   - Check the **Logs** tab

2. **Test Worker Directly**
   - Visit the worker URL in browser
   - Should return JSON with events

3. **Check CORS**
   - Open browser DevTools → Network tab
   - Look for the worker request
   - Check response headers include `Access-Control-Allow-Origin: *`

### Events Are Outdated

- Worker caches for 1 hour
- Either wait for cache to expire
- Or clear cache by making changes to the worker and redeploying

### Worker Returns Empty Array

- Gyandhan's HTML structure may have changed
- Update the parsing regex patterns
- Check fallback events are defined

## Monitoring

Free tier includes:
- 100,000 requests per day
- Real-time logs
- Analytics dashboard

## Cost

Cloudflare Workers Free Tier:
- ✅ 100,000 requests/day (more than enough)
- ✅ No credit card required
- ✅ Unlimited workers

## Next Steps

After the worker is running:
1. Monitor the logs for any errors
2. Adjust parsing if events aren't showing correctly
3. Consider adding more sophisticated HTML parsing if needed
4. Set up alerts in Cloudflare for any failures

## Advanced: HTMLRewriter

For more robust parsing, consider using Cloudflare's HTMLRewriter API:

```javascript
class EventExtractor {
  constructor() {
    this.events = [];
  }

  element(element) {
    // Extract event data using CSS selectors
  }
}

const rewriter = new HTMLRewriter()
  .on('.event-card', new EventExtractor());
```

This is more reliable than regex but requires understanding the exact HTML structure.
