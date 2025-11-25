/**
 * Cloudflare Worker to fetch events from Gyandhan
 * Deploy this at: https://dash.cloudflare.com/workers
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    try {
      // Fetch the Gyandhan events page
      const eventsPageResponse = await fetch("https://www.gyandhan.com/events", {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; GyandhanBot/1.0)",
        },
      });

      if (!eventsPageResponse.ok) {
        throw new Error("Failed to fetch events page");
      }

      const html = await eventsPageResponse.text();

      // Parse the HTML to extract events
      const events = parseEventsFromHTML(html);

      // Return JSON response with CORS headers
      return new Response(JSON.stringify({ events }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600", // Cache for 1 hour
        },
      });
    } catch (error) {
      console.error("Error fetching events:", error);

      // Return empty events array on error
      return new Response(
        JSON.stringify({
          events: [],
          error: error.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  },
};

/**
 * Parse events from HTML
 * This is a simple regex-based parser. Adjust based on actual HTML structure.
 */
function parseEventsFromHTML(html) {
  const events = [];

  try {
    // Look for event data - adjust these patterns based on actual HTML structure
    // This is a simplified example - you'll need to inspect the actual page

    // Pattern 1: Try to find JSON data embedded in the page
    const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/s);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[1]);
      if (data.events && Array.isArray(data.events)) {
        return data.events.slice(0, 2).map(formatEvent);
      }
    }

    // Pattern 2: Extract from HTML structure
    // Looking for common event patterns
    const eventRegex = /<article[^>]*class="[^"]*event[^"]*"[^>]*>(.*?)<\/article>/gs;
    const matches = [...html.matchAll(eventRegex)];

    for (let i = 0; i < Math.min(matches.length, 2); i++) {
      const eventHtml = matches[i][1];

      // Extract title
      const titleMatch = eventHtml.match(
        /<h[1-6][^>]*>([^<]+)<\/h[1-6]>|<[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)</i
      );
      const title = titleMatch ? (titleMatch[1] || titleMatch[2]).trim() : "";

      // Extract date
      const dateMatch = eventHtml.match(
        /<time[^>]*>([^<]+)<\/time>|<[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)</i
      );
      const date = dateMatch ? (dateMatch[1] || dateMatch[2]).trim() : "";

      // Extract location
      const locationMatch = eventHtml.match(
        /<[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)|Online|Hybrid/i
      );
      const location = locationMatch ? locationMatch[1] || locationMatch[0] : "Online Event";

      // Extract URL
      const urlMatch = eventHtml.match(/<a[^>]*href="([^"]+)"/);
      const url = urlMatch
        ? urlMatch[1].startsWith("http")
          ? urlMatch[1]
          : `https://www.gyandhan.com${urlMatch[1]}`
        : "https://www.gyandhan.com/events";

      if (title) {
        events.push({
          title,
          date,
          location,
          url,
          cta_label: "Register",
        });
      }
    }
  } catch (error) {
    console.error("Error parsing events:", error);
  }

  // If no events found, return fallback data
  if (events.length === 0) {
    return getFallbackEvents();
  }

  return events.slice(0, 2);
}

/**
 * Format event object
 */
function formatEvent(event) {
  return {
    title: event.title || event.name || "",
    date: event.date || event.start_date || event.starts_at || "",
    location: event.location || event.mode || "Online Event",
    url: event.url || event.link || "https://www.gyandhan.com/events",
    cta_label: "Register",
  };
}

/**
 * Fallback events when scraping fails
 */
function getFallbackEvents() {
  return [
    {
      title: "Complete Guide to Studying Abroad After 12th: From Admission to Loans",
      date: "Nov 29, 2025",
      location: "Online Event",
      url: "https://www.gyandhan.com/events",
      cta_label: "Register",
    },
    {
      title: "Ireland's Study Abroad Revolution: Smart Move or Strategic Mirage?",
      date: "Nov 30, 2025",
      location: "Online Event",
      url: "https://www.gyandhan.com/events",
      cta_label: "Register",
    },
  ];
}
