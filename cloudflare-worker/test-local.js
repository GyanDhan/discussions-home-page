/**
 * Local test script for Cloudflare Worker
 * Run with: node test-local.js
 */

// Polyfill fetch for Node.js if needed
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * Parse events from HTML
 */
function parseEventsFromHTML(html) {
  const events = [];

  try {
    console.log("\n🔍 Analyzing HTML structure...\n");

    // Check for JSON data in the page
    const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/s);
    if (jsonMatch) {
      console.log("✅ Found window.__INITIAL_STATE__ JSON data");
      try {
        const data = JSON.parse(jsonMatch[1]);
        console.log("📦 Parsed data:", JSON.stringify(data, null, 2));
        if (data.events && Array.isArray(data.events)) {
          return data.events.slice(0, 2).map(formatEvent);
        }
      } catch (e) {
        console.log("❌ Failed to parse JSON:", e.message);
      }
    } else {
      console.log("ℹ️  No window.__INITIAL_STATE__ found, trying HTML parsing");
    }

    // Try different HTML patterns
    console.log("\n🔍 Looking for event HTML patterns...\n");

    // Pattern 1: Articles with event class
    let eventRegex = /<article[^>]*class="[^"]*event[^"]*"[^>]*>(.*?)<\/article>/gis;
    let matches = [...html.matchAll(eventRegex)];
    console.log(`📄 Pattern 1 (article.event): Found ${matches.length} matches`);

    if (matches.length === 0) {
      // Pattern 2: Divs with event class
      eventRegex = /<div[^>]*class="[^"]*event[^"]*card[^"]*"[^>]*>(.*?)<\/div>/gis;
      matches = [...html.matchAll(eventRegex)];
      console.log(`📄 Pattern 2 (div.event-card): Found ${matches.length} matches`);
    }

    if (matches.length === 0) {
      // Pattern 3: Any element with data-event attribute
      eventRegex = /<[^>]*data-event[^>]*>(.*?)<\/[^>]+>/gis;
      matches = [...html.matchAll(eventRegex)];
      console.log(`📄 Pattern 3 (data-event): Found ${matches.length} matches`);
    }

    // Show sample HTML if found
    if (matches.length > 0) {
      console.log("\n📝 Sample event HTML (first 500 chars):");
      console.log(matches[0][0].substring(0, 500) + "...\n");
    }

    for (let i = 0; i < Math.min(matches.length, 2); i++) {
      const eventHtml = matches[i][1] || matches[i][0];

      console.log(`\n🎯 Parsing Event ${i + 1}:`);

      // Extract title - try multiple patterns
      let title = "";
      const titlePatterns = [
        /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i,
        /<[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)/i,
        /<[^>]*class="[^"]*heading[^"]*"[^>]*>([^<]+)/i,
      ];

      for (const pattern of titlePatterns) {
        const match = eventHtml.match(pattern);
        if (match) {
          title = match[1].trim();
          console.log(`  ✅ Title: "${title}"`);
          break;
        }
      }

      // Extract date
      let date = "";
      const datePatterns = [
        /<time[^>]*>([^<]+)<\/time>/i,
        /<[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/[^>]*>/i,
        /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}/i,
      ];

      for (const pattern of datePatterns) {
        const match = eventHtml.match(pattern);
        if (match) {
          date = match[1] ? match[1].trim() : match[0].trim();
          console.log(`  ✅ Date: "${date}"`);
          break;
        }
      }

      // Extract location
      let location = "Online Event";
      const locationPatterns = [
        /<[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)/i,
        /\b(Online|Hybrid|Virtual)\b/i,
      ];

      for (const pattern of locationPatterns) {
        const match = eventHtml.match(pattern);
        if (match) {
          location = match[1] ? match[1].trim() : match[0].trim();
          console.log(`  ✅ Location: "${location}"`);
          break;
        }
      }

      // Extract URL
      let url = "https://www.gyandhan.com/events";
      const urlMatch = eventHtml.match(/<a[^>]*href="([^"]+)"/);
      if (urlMatch) {
        url = urlMatch[1].startsWith("http")
          ? urlMatch[1]
          : `https://www.gyandhan.com${urlMatch[1]}`;
        console.log(`  ✅ URL: "${url}"`);
      }

      if (title) {
        events.push({
          title,
          date,
          location,
          url,
          cta_label: "Register",
        });
      } else {
        console.log("  ❌ No title found, skipping event");
      }
    }
  } catch (error) {
    console.error("❌ Error parsing events:", error);
  }

  return events;
}

function formatEvent(event) {
  return {
    title: event.title || event.name || "",
    date: event.date || event.start_date || event.starts_at || "",
    location: event.location || event.mode || "Online Event",
    url: event.url || event.link || "https://www.gyandhan.com/events",
    cta_label: "Register",
  };
}

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
