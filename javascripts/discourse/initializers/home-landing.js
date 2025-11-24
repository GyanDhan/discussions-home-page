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

      return `
        <article class="gh-card gh-card--person">
          <img class="gh-avatar" src="${avatarUrl}" alt="${name}">
          <div>
            <p class="gh-person__name">${name}</p>
            <p class="gh-person__title">${title}</p>
            <p class="gh-card__meta">${university}</p>
            <a class="gh-button gh-button--ghost" href="${href}">${cta}</a>
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

  const cards = topics.slice(0, 6).map((topic) => {
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
    const desc = escapeHtml(course.description || course.subtitle || "");
    const price = escapeHtml(course.price || "");
    const cta = escapeHtml(course.cta_label || "Learn more");
    const href = course.url || course.cta_url || "#";

    return `
      <article class="gh-card gh-card--course">
        <h3 class="gh-card__title">${title}</h3>
        <p class="gh-card__meta">${desc}</p>
        <div class="gh-card__footer">
          <span>${price}</span>
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

    return `
      <article class="gh-card gh-card--event">
        <p class="gh-card__title">${title}</p>
        <p class="gh-card__meta">${date} · ${location}</p>
        <a class="gh-button gh-button--ghost" href="${href}">${cta}</a>
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

  const chips = categories.slice(0, 12).map((cat) => {
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
  events: (data) => data?.events || data || [],
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

const buildHomeHtml = (s) => {
  const stat1 = escapeHtml(s.hero_stat_1 || "");
  const stat2 = escapeHtml(s.hero_stat_2 || "");
  const stat3 = escapeHtml(s.hero_stat_3 || "");

  const hero = `
    <section class="gh-hero">
      <div class="gh-hero__copy">
        <p class="gh-hero__eyebrow">For future admits</p>
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
      <div class="gh-hero__art">
        <div class="gh-hero__blob"></div>
      </div>
    </section>
  `;

  const alumni = s.show_alumni_spotlight
    ? `
    <section class="gh-section" data-block="alumni" data-endpoint="${escapeHtml(
      s.alumni_endpoint || ""
    )}">
      <div class="gh-section__header">
        <div>
          <p class="gh-section__eyebrow">Alumni Spotlight</p>
          <h2>Talk to alumni</h2>
          <p class="gh-section__sub">Get real advice from people who have been there.</p>
        </div>
      </div>
      <div class="gh-card-grid gh-card-grid--four gh-skeleton">
        <div class="gh-card gh-card--person"></div>
        <div class="gh-card gh-card--person"></div>
        <div class="gh-card gh-card--person"></div>
        <div class="gh-card gh-card--person"></div>
      </div>
    </section>`
    : "";

  const mostTalked = s.show_most_talked
    ? `
    <section class="gh-section gh-section--split" data-block="most-talked" data-endpoint="${escapeHtml(
      s.most_talked_endpoint || ""
    )}">
      <div class="gh-section__header">
        <div>
          <p class="gh-section__eyebrow">Most Talked Topics</p>
          <h2>Trending conversations</h2>
        </div>
      </div>
      <div class="gh-card-list gh-skeleton">
        <div class="gh-card gh-card--topic"></div>
        <div class="gh-card gh-card--topic"></div>
        <div class="gh-card gh-card--topic"></div>
      </div>
    </section>`
    : "";

  const latest = s.show_latest
    ? `
    <div class="gh-section__col" data-block="latest" data-endpoint="${escapeHtml(
      s.latest_endpoint || "/latest.json"
    )}">
      <div class="gh-section__header">
        <div>
          <p class="gh-section__eyebrow">Latest</p>
          <h2>Fresh from the community</h2>
        </div>
        <a class="gh-link" href="/latest">View all</a>
      </div>
      <div class="gh-card-list gh-skeleton">
        <div class="gh-card gh-card--topic"></div>
        <div class="gh-card gh-card--topic"></div>
        <div class="gh-card gh-card--topic"></div>
      </div>
    </div>`
    : "";

  const courses = s.show_popular_courses
    ? `
    <div class="gh-section__col" data-block="popular-courses" data-endpoint="${escapeHtml(
      s.popular_courses_endpoint || ""
    )}">
      <div class="gh-section__header">
        <div>
          <p class="gh-section__eyebrow">Most Popular Courses</p>
          <h2>Courses loved by peers</h2>
        </div>
      </div>
      <div class="gh-card-list gh-skeleton">
        <div class="gh-card gh-card--course"></div>
        <div class="gh-card gh-card--course"></div>
        <div class="gh-card gh-card--course"></div>
      </div>
    </div>`
    : "";

  const events = s.show_events
    ? `
    <div class="gh-section__col" data-block="events" data-endpoint="${escapeHtml(
      s.events_endpoint || ""
    )}">
      <div class="gh-section__header">
        <div>
          <p class="gh-section__eyebrow">Upcoming Events</p>
          <h2>Join live sessions</h2>
        </div>
      </div>
      <div class="gh-card-list gh-skeleton">
        <div class="gh-card gh-card--event"></div>
        <div class="gh-card gh-card--event"></div>
      </div>
    </div>`
    : "";

  const categories = s.show_categories
    ? `
    <div class="gh-section__col" data-block="categories" data-endpoint="${escapeHtml(
      s.categories_endpoint || "/categories.json"
    )}">
      <div class="gh-section__header">
        <div>
          <p class="gh-section__eyebrow">Explore Categories</p>
          <h2>Browse by interest</h2>
        </div>
        <a class="gh-link" href="/categories">View all</a>
      </div>
      <div class="gh-category-grid gh-skeleton">
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
  const hydrate = (root) => {
    const blocks = root.querySelectorAll("[data-block]");
    blocks.forEach((wrapper) => {
      const blockName = wrapper.dataset.block;
      const endpoint = wrapper.dataset.endpoint;
      const renderer = renderers[blockName];
      const normalize = normalizers[blockName];
      if (!renderer || !normalize || !endpoint) {
        removeSkeleton(wrapper);
        return;
      }

      fetch(endpoint, { credentials: "same-origin" })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Request failed");
          }
          return response.json();
        })
        .then((data) => renderer(wrapper, normalize(data)))
        .catch(() => renderEmpty(wrapper, "We could not load this section right now."));
    });
  };

  const injectLanding = () => {
    const container = document.querySelector('[data-gh-landing]');
    if (!container) {
      return;
    }
    if (!container.dataset.hydrated) {
      container.innerHTML = buildHomeHtml(settings);
      container.dataset.hydrated = "true";
      hydrate(container);
    }
  };

  api.onPageChange((path) => {
    if (path === "/" || path.startsWith("/categories")) {
      injectLanding();
    }
  });

  if (window.location.pathname === "/" || window.location.pathname.startsWith("/categories")) {
    injectLanding();
  }
});
