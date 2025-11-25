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
 */
function parseEventsFromHTML(html) {
  const events = extractUpcomingEvents(html);
  return events.length ? events.slice(0, 6) : getFallbackEvents();
}

function extractUpcomingEvents(html) {
  const sectionMatch = html.match(/<section[^>]*id="upcoming-events"[^>]*>([\s\S]*?)<\/section>/i);
  if (!sectionMatch) {
    console.warn("Upcoming events section not found");
    return [];
  }

  const sectionHtml = sectionMatch[1];

  const cardStarts = [...sectionHtml.matchAll(/<div[^>]*class="[^"]*bg-white[^"]*snap-center[^"]*"[^>]*>/gi)];
  const events = [];

  for (let i = 0; i < cardStarts.length; i++) {
    const start = cardStarts[i].index;
    const end = i + 1 < cardStarts.length ? cardStarts[i + 1].index : sectionHtml.length;
    const cardHtml = sectionHtml.slice(start, end);
    const event = formatEvent(cardHtml);

    if (event) {
      events.push(event);
    }
  }

  return events;
}

/**
 * Format event object
 */
function formatEvent(event) {
  if (typeof event === "string") {
    return parseCard(event);
  }

  return {
    title: event.title || event.name || "",
    name: event.title || event.name || "",
    date: event.date || event.start_date || event.starts_at || "",
    location: event.location || event.mode || "Online Event",
    url: event.url || event.link || event.registration_url || "https://www.gyandhan.com/events",
    image: event.image || event.thumbnail || event.image_url || event.imageurl || "",
    imageurl: event.image || event.thumbnail || event.image_url || event.imageurl || "",
    cta_label: "Register",
  };
}

function parseCard(cardHtml) {
  const imageMatch = cardHtml.match(/<img[^>]*src="([^"]+)"[^>]*>/i);
  const imageurl = imageMatch ? toAbsoluteUrl(imageMatch[1]) : "";

  const urlMatch = cardHtml.match(/href="([^"]*\/events[^"]*)"[^>]*>/i);
  const url = urlMatch ? toAbsoluteUrl(urlMatch[1]) : "https://www.gyandhan.com/events";

  const titleMatch =
    cardHtml.match(/<span[^>]*class="[^"]*line-clamp-2[^"]*"[^>]*>([^<]+)<\/span>/i) ||
    cardHtml.match(/class="[^"]*sr-only[^"]*"[^>]*>([^<]+)<\/span>/i) ||
    cardHtml.match(/alt="([^"]+)"\s*\/?>/i);
  const title = titleMatch ? cleanText(titleMatch[1]) : "";

  const infoSpans = [...cardHtml.matchAll(/<span[^>]*class="[^"]*pl-1\.5[^"]*"[^>]*>([^<]+)<\/span>/gi)];
  const dateText = infoSpans[0] ? cleanText(infoSpans[0][1]) : "";
  const timeText = infoSpans[1] ? cleanText(infoSpans[1][1]) : "";
  const date = [dateText, timeText].filter(Boolean).join(" ").trim();

  const locationMatch = cardHtml.match(/text-center[^>]*>\s*([^<]+)\s*<\/div>/i);
  const location = locationMatch ? cleanText(locationMatch[1]) : "Online Event";

  if (!title) {
    return null;
  }

  return {
    title,
    name: title,
    date: date || dateText,
    location,
    url,
    image: imageurl,
    imageurl,
    cta_label: "Register",
  };
}

function toAbsoluteUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `https://www.gyandhan.com${url}`;
  return `https://www.gyandhan.com/${url}`;
}

function cleanText(text) {
  return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Fallback events when scraping fails
 */
function getFallbackEvents() {
  return [
    {
      title: "Complete Guide to Studying Abroad After 12th: From Admission to Loans",
      name: "Complete Guide to Studying Abroad After 12th: From Admission to Loans",
      date: "Nov 29, 2025",
      location: "Online Event",
      url: "https://www.gyandhan.com/events",
      image: "https://gyandhan.s3.ap-south-1.amazonaws.com/uploads/event/large_image/845/event_25th_large_image_845e8c1728ba7c0be_banner.webp",
      imageurl: "https://gyandhan.s3.ap-south-1.amazonaws.com/uploads/event/large_image/845/event_25th_large_image_845e8c1728ba7c0be_banner.webp",
      cta_label: "Register",
    },
    {
      title: "Ireland's Study Abroad Revolution: Smart Move or Strategic Mirage?",
      name: "Ireland's Study Abroad Revolution: Smart Move or Strategic Mirage?",
      date: "Nov 30, 2025",
      location: "Online Event",
      url: "https://www.gyandhan.com/events",
      image: "https://gyandhan.s3.ap-south-1.amazonaws.com/uploads/event/large_image/836/Ireland_s_Study_Abroad_Revolution_Smart_Move_or_Strategic_Mirage_event_page_images_14_Nov_2025_64b9c3be7518d1ffc179.webp",
      imageurl: "https://gyandhan.s3.ap-south-1.amazonaws.com/uploads/event/large_image/836/Ireland_s_Study_Abroad_Revolution_Smart_Move_or_Strategic_Mirage_event_page_images_14_Nov_2025_64b9c3be7518d1ffc179.webp",
      cta_label: "Register",
    },
  ];
}
