/**
 * Local test script for Cloudflare Worker
 * Run with: node test-local.js
 */

// Polyfill fetch for Node.js if needed
const fetch =
  globalThis.fetch ||
  ((...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args)));

/**
 * Parse events from HTML
 */
function parseEventsFromHTML(html) {
  const events = extractUpcomingEvents(html);

  if (events.length === 0) {
    console.log("⚠️  No events found in upcoming section, will return fallback data\n");
  }

  return events;
}

function formatEvent(event) {
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

function getFallbackEvents() {
  return [
    {
      title: "Complete Guide to Studying Abroad After 12th: From Admission to Loans",
      name: "Complete Guide to Studying Abroad After 12th: From Admission to Loans",
      date: "Nov 29, 2025",
      location: "Online Event",
      url: "https://www.gyandhan.com/events",
      image: "https://gyandhan.s3.ap-south-1.amazonaws.com/uploads/event/large_image/845/event_25th_large_image_845e8c1728ba7c0be_banner.webp",
      imageurl:
        "https://gyandhan.s3.ap-south-1.amazonaws.com/uploads/event/large_image/845/event_25th_large_image_845e8c1728ba7c0be_banner.webp",
      cta_label: "Register",
    },
    {
      title: "Ireland's Study Abroad Revolution: Smart Move or Strategic Mirage?",
      name: "Ireland's Study Abroad Revolution: Smart Move or Strategic Mirage?",
      date: "Nov 30, 2025",
      location: "Online Event",
      url: "https://www.gyandhan.com/events",
      image:
        "https://gyandhan.s3.ap-south-1.amazonaws.com/uploads/event/large_image/836/Ireland_s_Study_Abroad_Revolution_Smart_Move_or_Strategic_Mirage_event_page_images_14_Nov_2025_64b9c3be7518d1ffc179.webp",
      imageurl:
        "https://gyandhan.s3.ap-south-1.amazonaws.com/uploads/event/large_image/836/Ireland_s_Study_Abroad_Revolution_Smart_Move_or_Strategic_Mirage_event_page_images_14_Nov_2025_64b9c3be7518d1ffc179.webp",
      cta_label: "Register",
    },
  ];
}

function extractUpcomingEvents(html) {
  console.log("\n🔍 Analyzing Upcoming Events section...\n");

  const sectionMatch = html.match(/<section[^>]*id="upcoming-events"[^>]*>([\s\S]*?)<\/section>/i);
  if (!sectionMatch) {
    console.log("❌ No #upcoming-events section found");
    return [];
  }

  const sectionHtml = sectionMatch[1];
  const cardStarts = [...sectionHtml.matchAll(/<div[^>]*class="[^"]*bg-white[^"]*snap-center[^"]*"[^>]*>/gi)];

  console.log(`📄 Found ${cardStarts.length} event cards in the slider`);

  const events = [];

  for (let i = 0; i < cardStarts.length; i++) {
    const start = cardStarts[i].index;
    const end = i + 1 < cardStarts.length ? cardStarts[i + 1].index : sectionHtml.length;
    const cardHtml = sectionHtml.slice(start, end);
    const parsed = parseCard(cardHtml);

    if (parsed) {
      console.log(`\n🎯 Event ${i + 1}`);
      console.log(`  ✅ Title: ${parsed.title}`);
      console.log(`  ✅ Date: ${parsed.date}`);
      console.log(`  ✅ URL: ${parsed.url}`);
      console.log(`  ✅ Image: ${parsed.image}`);
      console.log(`  ✅ Location: ${parsed.location}`);
      events.push(parsed);
    } else {
      console.log(`  ⚠️  Skipping card ${i + 1} (missing title)`);
    }
  }

  return events;
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
 * Main test function
 */
async function testWorker() {
  console.log("🚀 Testing Gyandhan Events Scraper");
  console.log("=====================================\n");

  try {
    console.log("📡 Fetching https://www.gyandhan.com/events...\n");

    const response = await fetch("https://www.gyandhan.com/events", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GyandhanBot/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`✅ Fetched ${html.length} bytes of HTML\n`);

    // Save HTML to file for inspection
    const fs = require('fs');
    fs.writeFileSync('/tmp/gyandhan-events.html', html);
    console.log("💾 Saved HTML to /tmp/gyandhan-events.html for inspection\n");

    // Parse events
    const events = parseEventsFromHTML(html);

    console.log("\n📊 RESULTS");
    console.log("=====================================\n");

    if (events.length > 0) {
      console.log(`✅ Successfully extracted ${events.length} events:\n`);
      console.log(JSON.stringify({ events }, null, 2));
      console.log("\n✅ This is what will be returned to Discourse");
    } else {
      console.log("⚠️  No events found by parser");
      console.log("📋 Will use fallback events:\n");
      const fallback = getFallbackEvents();
      console.log(JSON.stringify({ events: fallback }, null, 2));
      console.log("\n💡 Tip: Check /tmp/gyandhan-events.html to see the actual HTML structure");
    }

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error("\n📋 Fallback events will be used:\n");
    const fallback = getFallbackEvents();
    console.log(JSON.stringify({ events: fallback }, null, 2));
  }

  console.log("\n=====================================");
  console.log("✅ Test complete!");
}

// Run the test
testWorker();
