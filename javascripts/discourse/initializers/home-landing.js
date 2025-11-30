import { apiInitializer } from "discourse/lib/api";

const escapeHtml = (value) =>
  (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const removeSkeleton = (block) => {
  block.classList.remove("gh-skeleton");
};

// Custom field IDs for user profile data
const CUSTOM_FIELD_IDS = {
  location: "17",
  college: "18",
  degree: "19",
};

// Fetch user data from Discourse user API
const fetchUserData = async (username) => {
  try {
    const response = await fetch(`/u/${username}.json`, {
      credentials: "same-origin",
    });
    if (!response.ok) {
      console.warn(`[GD Connect Theme] Failed to fetch user: ${username}`);
      return null;
    }
    const data = await response.json();
    const user = data.user;

    // Extract custom field values
    const customFields = user.user_fields || {};
    const location = customFields[CUSTOM_FIELD_IDS.location] || "";
    const college = customFields[CUSTOM_FIELD_IDS.college] || "";
    const degree = customFields[CUSTOM_FIELD_IDS.degree] || "";

    return {
      name: user.name || user.username,
      username: user.username,
      avatar_template: user.avatar_template,
      title: degree, // Use degree as the title/subtitle
      university: college, // Use college as university
      location: location,
      url: `/u/${user.username}`,
      cta_label: "Message",
      cta_url: `/u/${user.username}/messages`,
    };
  } catch (error) {
    console.warn(
      `[GD Connect Theme] Error fetching user ${username}:`,
      error
    );
    return null;
  }
};

// Fetch multiple users by usernames
const fetchAlumniByUsernames = async (usernames) => {
  const usernameList = Array.isArray(usernames)
    ? usernames
    : String(usernames || "")
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean);

  if (!usernameList.length) {
    return [];
  }

  const alumniData = await Promise.all(
    usernameList.slice(0, 6).map((username) => fetchUserData(username))
  );

  // Filter out null values (failed fetches)
  return alumniData.filter(Boolean);
};

const renderEmpty = (block, message = "No data available yet.") => {
  block.innerHTML = `<div class="gh-card"><p class="gh-card__meta">${escapeHtml(
    message
  )}</p></div>`;
  removeSkeleton(block);
};

const renderAlumni = (block, alumni) => {
  if (!alumni?.length) {
    renderEmpty(block);
    return;
  }

  const cards = alumni
    .slice(0, 6)
    .map((person) => {
      const name = escapeHtml(person.name || "Alumnus");
      const title = escapeHtml(person.title || person.subtitle || "");
      const university = escapeHtml(person.university || person.location || "");
      const cta = escapeHtml(person.cta_label || "Message");
      const avatar = person.avatar || person.avatar_template;
      const href = person.cta_url || person.url || "#";
      const avatarUrl = avatar
        ? avatar.replace("{size}", "90")
        : "https://placehold.co/90x90?text=Alumni";

      const titleHtml = title
        ? `<p class="gh-person__title">${title}</p>`
        : "";
      const universityHtml = university
        ? `<p class="gh-card__meta">${university}</p>`
        : "";

      return `
        <article class="gh-card gh-card--person">
          <img class="gh-avatar" src="${avatarUrl}" alt="${name}">
          <div class="gh-person__meta">
            <p class="gh-person__name">${name}</p>
            ${titleHtml}
            ${universityHtml}
            <button class="gh-button gh-button--ghost gh-message-btn" data-username="${escapeHtml(person.username || '')}">${cta}</button>
          </div>
        </article>
      `;
    })
    .join("");

  block.innerHTML = cards;
  removeSkeleton(block);
};

const renderTopics = (block, topics) => {
  if (!topics?.length) {
    renderEmpty(block);
    return;
  }

  const cards = topics.slice(0, 3).map((topic) => {
    const title = escapeHtml(topic.title || "Topic");
    const link = topic.url || `/t/${topic.slug}/${topic.id}`;
    const replies = topic.posts_count ?? topic.reply_count ?? topic.replies;
    const views = topic.views;
    const tags = topic.tags || [];

    return `
      <article class="gh-card gh-card--topic">
        <a class="gh-card__title" href="${link}">${title}</a>
        <p class="gh-card__meta">${replies || 0} replies · ${views || 0} views</p>
        <div>${tags
          .slice(0, 2)
          .map((tag) => `<span class="gh-card__tag">#${escapeHtml(tag)}</span>`)
          .join("")}</div>
      </article>
    `;
  });

  block.innerHTML = cards.join("");
  removeSkeleton(block);
};

const renderCourses = (block, courses) => {
  if (!courses?.length) {
    renderEmpty(block);
    return;
  }

  const cards = courses.slice(0, 4).map((course) => {
    const title = escapeHtml(course.title || "Course");
    const duration = escapeHtml(course.Duration || course.duration || "");
    const price = escapeHtml(course.price || "");
    const cta = escapeHtml(course.cta_label || "Learn more");
    const href = course.url || course.cta_url || "#";

    return `
      <article class="gh-card gh-card--course">
        <h3 class="gh-card__title">${title}</h3>
        <div class="gh-card__details">
          ${duration ? `
            <div class="gh-card__meta">
              <svg class="gh-icon gh-icon--duration" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
              </svg>
              <span>${duration}</span>
            </div>
          ` : ''}
          ${price ? `
            <div class="gh-card__meta">
              <svg class="gh-icon gh-icon--price" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
              <span>${price}</span>
            </div>
          ` : ''}
        </div>
        <div class="gh-card__footer">
          <a class="gh-button gh-button--ghost" href="${href}">${cta}</a>
        </div>
      </article>
    `;
  });

  block.innerHTML = cards.join("");
  removeSkeleton(block);
};

const renderEvents = (block, events) => {
  if (!events?.length) {
    renderEmpty(block);
    return;
  }

  const cards = events.slice(0, 4).map((event) => {
    const title = escapeHtml(event.title || "Event");
    const date = escapeHtml(event.date || event.starts_at || "");
    const location = escapeHtml(event.location || event.mode || "");
    const href = event.url || event.cta_url || "#";
    const cta = escapeHtml(event.cta_label || "Register");
    const image = escapeHtml(event.image || event.thumbnail || "https://placehold.co/160x120?text=Event");

    return `
      <article class="gh-card gh-card--event">
        <img class="gh-event__thumb" src="${image}" alt="${title}">
        <div>
          <p class="gh-card__title">${title}</p>
          <p class="gh-card__meta">${date} · ${location}</p>
          <a class="gh-button gh-button--ghost" href="${href}">${cta}</a>
        </div>
      </article>
    `;
  });

  block.innerHTML = cards.join("");
  removeSkeleton(block);
};

const renderCategories = (block, categories) => {
  if (!categories?.length) {
    renderEmpty(block);
    return;
  }

  const chips = categories.map((cat) => {
    const name = escapeHtml(cat.name || "Category");
    const href = cat.url || `/c/${cat.slug}/${cat.id}`;
    return `<a class="gh-chip" href="${href}">${name}</a>`;
  });

  block.innerHTML = chips.join("");
  removeSkeleton(block);
};

const normalizers = {
  alumni: (data) => data?.alumni || data?.users || data || [],
  "most-talked": (data) =>
    data?.topic_list?.topics ||
    data?.topics ||
    (data?.rows || []).map((row) => ({
      id: row.topic_id || row.id,
      title: row.title || row[1],
      slug: row.slug,
      replies: row.posts_count || row.reply_count || row[2],
      views: row.views || row[3],
      tags: row.tags || [],
    })),
  latest: (data) => data?.topic_list?.topics || data?.topics || [],
  "popular-courses": (data) => data?.courses || data || [],
  events: (data) => {
    // Handle various event data structures
    const eventList = data?.events || data?.data?.events || data || [];
    // Limit to 2 upcoming events
    return eventList.slice(0, 2);
  },
  categories: (data) =>
    data?.category_list?.categories ||
    data?.categories ||
    (data || []).map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name || row[1],
      url: row.url,
    })),
};

const renderers = {
  alumni: renderAlumni,
  "most-talked": renderTopics,
  latest: renderTopics,
  "popular-courses": renderCourses,
  events: renderEvents,
  categories: renderCategories,
};

const isLandingRoute = () => {
  const path = (window.location.pathname || "/").replace(/\/+$/, "");
  return path === "" || path === "/" || path === "/categories";
};

const filterCategories = (cats, s) => {
  const limit = Number(s.categories_limit || 6) || 6;
  const slugsRaw = s.categories_slugs || [];
  const allowlist = Array.isArray(slugsRaw)
    ? slugsRaw
    : String(slugsRaw || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

  let filtered = cats || [];

  if (allowlist.length) {
    // Validate slugs against available categories
    const validSlugs = (cats || []).map((c) => String(c.slug));
    const validIds = (cats || []).map((c) => String(c.id));
    const validNames = (cats || []).map((c) => String(c.name));

    const invalidSlugs = allowlist.filter(
      (slug) =>
        !validSlugs.includes(slug) &&
        !validIds.includes(slug) &&
        !validNames.includes(slug)
    );

    if (invalidSlugs.length > 0) {
      console.warn(
        "[GD Connect Theme] Invalid category slugs detected:",
        invalidSlugs.join(", ")
      );
      console.info(
        "[GD Connect Theme] Available category slugs:",
        validSlugs.join(", ")
      );
    }

    if (allowlist.length > limit) {
      console.warn(
        `[GD Connect Theme] Too many categories selected (${allowlist.length}). Only first ${limit} will be displayed.`
      );
    }

    filtered = filtered.filter(
      (c) =>
        allowlist.includes(String(c.slug)) ||
        allowlist.includes(String(c.id)) ||
        allowlist.includes(String(c.name))
    );
  }

  return filtered.slice(0, limit);
};

const placeholders = {
  alumni: [
    {
      name: "Akash Tandon",
      title: "Data Science @ UCLA",
      university: "Los Angeles, USA",
      cta_label: "Message",
      avatar: "https://placehold.co/90x90?text=AT",
    },
    {
      name: "John Elbert",
      title: "ML Engineer @ MIT",
      university: "Massachusetts, USA",
      cta_label: "Message",
      avatar: "https://placehold.co/90x90?text=JE",
    },
    {
      name: "Anay Kular",
      title: "FinTech @ Oxford",
      university: "Oxford, UK",
      cta_label: "Message",
      avatar: "https://placehold.co/90x90?text=AK",
    },
  ],
  "most-talked": [
    { title: "What does an ecologist do in their job? I need some help here", slug: "eco-job", id: 1, posts_count: 12, views: 320 },
    { title: "Contract premed and number of credits in USA", slug: "premed-credits", id: 2, posts_count: 18, views: 540 },
    { title: "What is scaling in education?", slug: "scaling-education", id: 3, posts_count: 9, views: 210 },
  ],
  latest: [
    { title: "What are the criteria in selecting students for college?", slug: "criteria", id: 4, posts_count: 5, views: 120 },
    { title: "Baylor versus St. George for the business game", slug: "baylor-st-george", id: 5, posts_count: 7, views: 180 },
    { title: "Staying in Europe or moving to Australia?", slug: "europe-aus", id: 6, posts_count: 4, views: 95 },
  ],
  "popular-courses": [
    { title: "MS in Computer Science", Duration: "18-24 Months", price: "$50k-$70k", cta_label: "Learn More" },
    { title: "Global MBA", Duration: "12-24 Months", price: "$70k-$100k", cta_label: "Learn More" },
    { title: "MSC in Data Science", Duration: "12-18 Months", price: "$40k-$60k", cta_label: "Learn More" },
    { title: "Masters of Eng. Management", Duration: "12-15 Months", price: "$45k-$65k", cta_label: "Learn More" },


  ],
  events: [
    {
      title: "Complete Guide to Studying Abroad After 12th: From Admission to Loans",
      date: "Nov 29, 2025",
      location: "Online Event",
      cta_label: "Register",
      url: "https://www.gyandhan.com/events"
    },
    {
      title: "Ireland's Study Abroad Revolution: Smart Move or Strategic Mirage?",
      date: "Nov 30, 2025",
      location: "Online Event",
      cta_label: "Register",
      url: "https://www.gyandhan.com/events"
    },
  ],
  categories: [
    { name: "Students", slug: "students", id: 1 },
    { name: "Education", slug: "education", id: 2 },
    { name: "Cultural", slug: "cultural", id: 3 },
    { name: "Engineering", slug: "engineering", id: 4 },
    { name: "Research", slug: "research", id: 5 },
    { name: "Social", slug: "social", id: 6 },
  ],
};

const buildHomeHtml = (s) => {
  const stat1 = escapeHtml(s.hero_stat_1 || "");
  const stat2 = escapeHtml(s.hero_stat_2 || "");
  const stat3 = escapeHtml(s.hero_stat_3 || "");

  const hero = `
    <section class="gh-hero gh-hero--background" style="background-image: url('/images/GDC Banner.png');">
      <div class="gh-hero__overlay"></div>
      <div class="gh-hero__content">
        <p class="gh-hero__eyebrow">GD Connect</p>
        <h1>${escapeHtml(s.hero_title || "")}</h1>
        <p class="gh-hero__subtitle">${escapeHtml(s.hero_subtitle || "")}</p>
        <div class="gh-hero__actions">
          <a class="gh-button gh-button--primary" href="${escapeHtml(
            s.cta_primary_url || "/"
          )}">${escapeHtml(s.cta_primary_label || "Explore")}</a>
          <a class="gh-button gh-button--ghost" href="${escapeHtml(
            s.cta_secondary_url || "/"
          )}">${escapeHtml(s.cta_secondary_label || "Join")}</a>
        </div>
        <div class="gh-hero__stats">
          <div class="gh-stat">${stat1}</div>
          <div class="gh-stat">${stat2}</div>
          <div class="gh-stat">${stat3}</div>
        </div>
      </div>
    </section>
  `;

  const alumni = s.show_alumni_spotlight
    ? `
    <section class="gh-section">
      <div class="gh-section__header">
        <div>
          <h1 class="gh-section__eyebrow">Alumni Spotlight</h1>
          <h2>Talk to alumni</h2>
          <p class="gh-section__sub">Get real advice from people who have been there.</p>
        </div>
      </div>
      <div class="gh-card-grid gh-card-grid--three gh-skeleton" data-block="alumni" data-endpoint="${escapeHtml(
        s.alumni_endpoint || ""
      )}">
        <div class="gh-card gh-card--person"></div>
        <div class="gh-card gh-card--person"></div>
        <div class="gh-card gh-card--person"></div>
      </div>
    </section>`
    : "";

  const mostTalked = s.show_most_talked
    ? `
    <section class="gh-section">
      <div class="gh-section__header">
        <div>
          <h1 class="gh-section__eyebrow">Most Talked Topics</h1>
          <h2>Trending conversations</h2>
        </div>
        <div class="gh-filter">
          <select id="gh-trending-filter" data-period="">
            <option value="">All time</option>
            <option value='yearly'>Year</option>
            <option value='quarterly'>Quarter</option>
            <option value='monthly'>Month</option>
            <option value='weekly'>Week</option>
            <option value='daily'>Day</option>
          </select>
        </div>
      </div>
      <div class="gh-card-grid gh-card-grid--three gh-skeleton" data-block="most-talked" data-endpoint="${escapeHtml(
        s.most_talked_endpoint || ""
      )}">
        <div class="gh-card gh-card--topic"></div>
        <div class="gh-card gh-card--topic"></div>
        <div class="gh-card gh-card--topic"></div>
      </div>
    </section>`
    : "";

  const latest = s.show_latest
    ? `
    <div class="gh-section__col">
      <div class="gh-section__header">
        <div>
          <h1 class="gh-section__eyebrow">Latest</h1>
          <h2>Latest</h2>
        </div>
        <a class="gh-link" href="/latest">View all</a>
      </div>
      <div class="gh-card-list gh-skeleton" data-block="latest" data-endpoint="${escapeHtml(
        s.latest_endpoint || "/latest.json"
      )}">
        <div class="gh-card gh-card--topic"></div>
        <div class="gh-card gh-card--topic"></div>
        <div class="gh-card gh-card--topic"></div>
      </div>
    </div>`
    : "";

  const courses = s.show_popular_courses
    ? `
    <div class="gh-section__col">
      <div class="gh-section__header">
        <div>
          <h1 class="gh-section__eyebrow">Most Popular Courses</h1>
          <h2>Courses loved by peers</h2>
        </div>
      </div>
      <div class="gh-card-list gh-skeleton" data-block="popular-courses" data-endpoint="${escapeHtml(
        s.popular_courses_endpoint || ""
      )}">
        <div class="gh-card gh-card--course"></div>
        <div class="gh-card gh-card--course"></div>
        <div class="gh-card gh-card--course"></div>
      </div>
    </div>`
    : "";

  const events = s.show_events
    ? `
    <div class="gh-section__col">
      <div class="gh-section__header">
        <div>
          <h1 class="gh-section__eyebrow">Upcoming Events</h1>
          <h2>Upcoming Events</h2>
        </div>
      </div>
      <div class="gh-card-list gh-card-list--events gh-skeleton" data-block="events" data-endpoint="${escapeHtml(
        s.events_endpoint || ""
      )}">
        <div class="gh-card gh-card--event"></div>
        <div class="gh-card gh-card--event"></div>
      </div>
    </div>`
    : "";

  const categories = s.show_categories
    ? `
    <div class="gh-section__col">
      <div class="gh-section__header">
        <div>
          <h1 class="gh-section__eyebrow">Explore Categories</h1>
          <h2>Browse by interest</h2>
        </div>
        <a class="gh-link" href="/categories">View all</a>
      </div>
      <div class="gh-category-grid gh-skeleton" data-block="categories" data-endpoint="${escapeHtml(
        s.categories_endpoint || "/categories.json"
      )}">
        <div class="gh-chip"></div>
        <div class="gh-chip"></div>
        <div class="gh-chip"></div>
        <div class="gh-chip"></div>
        <div class="gh-chip"></div>
        <div class="gh-chip"></div>
      </div>
    </div>`
    : "";

  const twoCol1 = latest || courses ? `<section class="gh-section gh-section--two-col">${latest}${courses}</section>` : "";
  const twoCol2 = events || categories ? `<section class="gh-section gh-section--two-col">${events}${categories}</section>` : "";

  return `${hero}${alumni}${mostTalked}${twoCol1}${twoCol2}`;
};

export default apiInitializer("0.11.3", (api) => {
  // Setup message button click handler using event delegation
  const attachMessageHandlers = (container) => {
    console.log("[GD Connect Theme] Setting up message button event delegation");

    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".gh-message-btn");
      if (btn) {
        e.preventDefault();
        const username = btn.dataset.username;
        console.log("[GD Connect Theme] Message button clicked for:", username);

        if (username) {
          try {
            const composer = api.container.lookup("controller:composer");

            // Close any existing composer first
            if (composer.get("model")) {
              composer.close();
            }

            // Open composer with proper parameters
            composer.open({
              action: "privateMessage",
              recipients: username,
              archetypeId: "private_message",
              draftKey: `new_private_message_${username}`,
            });

            console.log("[GD Connect Theme] Composer opened for:", username);
          } catch (error) {
            console.error("[GD Connect Theme] Error opening composer:", error);
          }
        } else {
          console.warn("[GD Connect Theme] No username found on button");
        }
      }
    });

    console.log("[GD Connect Theme] Message button event delegation setup complete");
  };

  const loadBlock = async (wrapper, endpoint) => {
    const blockName = wrapper.dataset.block;
    const renderer = renderers[blockName];
    const normalize = normalizers[blockName];

    if (!renderer || !normalize) {
      removeSkeleton(wrapper);
      return;
    }

    // Special handling for alumni block with usernames
    if (blockName === "alumni" && settings.alumni_usernames) {
      wrapper.classList.add("gh-skeleton");
      try {
        const alumniData = await fetchAlumniByUsernames(
          settings.alumni_usernames
        );
        if (alumniData.length > 0) {
          renderer(wrapper, alumniData);
        } else {
          renderer(wrapper, placeholders[blockName] || []);
        }
      } catch (error) {
        console.warn("[GD Connect Theme] Error loading alumni:", error);
        renderer(wrapper, placeholders[blockName] || []);
      }
      return;
    }

    const usePlaceholder = !endpoint;
    if (usePlaceholder) {
      renderer(wrapper, placeholders[blockName] || []);
      return;
    }

    wrapper.classList.add("gh-skeleton");
    fetch(endpoint, { credentials: "same-origin" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Request failed");
        }
        return response.json();
      })
      .then((data) => {
        if (blockName === "categories") {
          renderer(wrapper, filterCategories(normalize(data), settings));
        } else {
          renderer(wrapper, normalize(data));
        }
      })
      .catch(() =>
        usePlaceholder
          ? renderer(wrapper, placeholders[blockName] || [])
          : renderEmpty(wrapper, "We could not load this section right now.")
      );
  };

  const hydrate = (root) => {
    const blocks = root.querySelectorAll("[data-block]");
    blocks.forEach((wrapper) => {
      const endpoint = wrapper.dataset.endpoint;
      loadBlock(wrapper, endpoint);
    });

    // Setup trending filter
    const trendingFilter = root.querySelector("#gh-trending-filter");
    if (trendingFilter) {
      trendingFilter.addEventListener("change", (e) => {
        const period = e.target.value;
        const block = root.querySelector('[data-block="most-talked"]');
        if (block) {
          const baseEndpoint = block.dataset.endpoint || "/top.json";
          const newEndpoint = period ? `/top/${period}.json` : baseEndpoint;
          loadBlock(block, newEndpoint);
        }
      });
    }
  };

  const injectLanding = () => {
    const allowed = isLandingRoute();
    if (!allowed) {
      const existing = document.querySelector("[data-gh-landing]");
      if (existing) {
        existing.style.display = "none";
      }
      return;
    }

    let container = document.querySelector("[data-gh-landing]");
    if (!container) {
      // Fallback: create and prepend into the discovery list container
      const discovery = document.querySelector(".discovery-list-container, .discovery-categories");
      if (discovery) {
        container = document.createElement("div");
        container.className = "gh-home";
        container.dataset.ghLanding = "true";
        discovery.insertBefore(container, discovery.firstChild);
      }
    }
    if (!container) {
      return;
    }
    container.style.display = "block";
    if (!container.dataset.hydrated) {
      container.innerHTML = buildHomeHtml(settings);
      container.dataset.hydrated = "true";
      hydrate(container);

      // Setup event delegation for message buttons on the container
      attachMessageHandlers(container);
    }
  };

  // Helper to log available categories for theme configuration
  const logAvailableSlugs = () => {
    if (settings.categories_endpoint) {
      fetch(settings.categories_endpoint, { credentials: "same-origin" })
        .then((response) => response.json())
        .then((data) => {
          const cats = normalizers.categories(data);
          const slugs = cats.map((c) => c.slug).filter(Boolean);
          const names = cats.map((c) => ({ slug: c.slug, name: c.name }));

          console.groupCollapsed(
            "%c[GD Connect Theme] Category Configuration Helper",
            "color: #0ca08e; font-weight: bold; font-size: 12px;"
          );

          console.log(
            "%cAvailable Categories:",
            "font-weight: bold; color: #1f2b2e;"
          );
          console.table(names);

          console.log(
            "%cTo configure the categories_slugs theme setting:",
            "font-weight: bold; color: #1f2b2e; margin-top: 10px;"
          );
          console.log(
            "1. Go to Admin → Customize → Themes → Air → Components → Air Home Landing"
          );
          console.log(
            "2. Find the 'categories_slugs' setting"
          );
          console.log(
            "3. Enter a comma-separated list of slugs (max 6)"
          );

          console.log(
            "%cExample configuration:",
            "font-weight: bold; color: #0ca08e; margin-top: 10px;"
          );
          const exampleSlugs = slugs.slice(0, 6).join(",");
          console.log(`%c${exampleSlugs}`, "background: #f6fbfb; padding: 4px 8px; border-radius: 4px; font-family: monospace;");

          console.log(
            "%cCurrent configuration:",
            "font-weight: bold; color: #1f2b2e; margin-top: 10px;"
          );
          const currentSlugs = settings.categories_slugs || "(empty - showing all categories)";
          console.log(`%c${currentSlugs}`, "background: #f6fbfb; padding: 4px 8px; border-radius: 4px; font-family: monospace;");

          console.groupEnd();
        })
        .catch(() => {});
    }
  };

  // Helper to show alumni username configuration guide
  const logAlumniHelper = () => {
    console.groupCollapsed(
      "%c[GD Connect Theme] Alumni Spotlight Configuration Helper",
      "color: #0ca08e; font-weight: bold; font-size: 12px;"
    );

    console.log(
      "%cTo configure alumni spotlight:",
      "font-weight: bold; color: #1f2b2e;"
    );
    console.log(
      "1. Go to Admin → Customize → Themes → Air → Components → Air Home Landing"
    );
    console.log("2. Find the 'alumni_usernames' setting");
    console.log("3. Enter a comma-separated list of usernames (max 6)");

    console.log(
      "%cExample configuration:",
      "font-weight: bold; color: #0ca08e; margin-top: 10px;"
    );
    console.log(
      "%cjohn_doe,jane_smith,alumni_mentor",
      "background: #f6fbfb; padding: 4px 8px; border-radius: 4px; font-family: monospace;"
    );

    console.log(
      "%cCurrent configuration:",
      "font-weight: bold; color: #1f2b2e; margin-top: 10px;"
    );
    const currentUsernames =
      settings.alumni_usernames || "(empty - using alumni_endpoint or placeholders)";
    console.log(
      `%c${currentUsernames}`,
      "background: #f6fbfb; padding: 4px 8px; border-radius: 4px; font-family: monospace;"
    );

    console.log(
      "%cData fetched from user profiles:",
      "font-weight: bold; color: #1f2b2e; margin-top: 10px;"
    );
    console.log("• Name: user.name or user.username");
    console.log("• Avatar: user.avatar_template");
    console.log("• Degree (title): user_fields[19]");
    console.log("• College: user_fields[18]");
    console.log("• Location: user_fields[17]");

    console.log(
      "%cNote:",
      "font-weight: bold; color: #20a6c9; margin-top: 10px;"
    );
    console.log(
      "If any custom field is empty, it will be hidden in the card display."
    );

    console.groupEnd();
  };

  // Log available slugs once on initial load to help with configuration
  if (window.location.pathname === "/" || window.location.pathname === "/categories") {
    setTimeout(() => {
      logAvailableSlugs();
      logAlumniHelper();
    }, 1000);
  }

  api.onPageChange(() => injectLanding());
  injectLanding();
});
