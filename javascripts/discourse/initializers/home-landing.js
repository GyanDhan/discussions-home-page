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

const fetchJson = (endpoint) =>
  fetch(endpoint, { credentials: "same-origin" }).then((response) => {
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
  });

export default apiInitializer("0.11.3", (api) => {
  const injectHomeIfNeeded = () => {
    const pathname = window.location.pathname || "/";
    if (!(pathname === "/" || pathname.startsWith("/categories"))) {
      return;
    }
    if (document.querySelector(".gh-home")) {
      return;
    }
    const tpl = document.getElementById("gh-home-template");
    const outlet = document.querySelector("#main-outlet");
    if (!tpl || !outlet) {
      return;
    }

    // Render the template into the main outlet, replacing the default categories layout.
    outlet.innerHTML = tpl.innerHTML;
  };

  const initHome = () => {
    injectHomeIfNeeded();

    const page = document.querySelector(".gh-home");
    if (!page) {
      return;
    }

    const blocks = page.querySelectorAll("[data-block]");
    blocks.forEach((wrapper) => {
      const blockName = wrapper.dataset.block;
      const endpoint = wrapper.dataset.endpoint;
      const renderer = renderers[blockName];
      const normalize = normalizers[blockName];
      if (!renderer || !normalize) {
        return;
      }

      if (!endpoint) {
        removeSkeleton(wrapper);
        return;
      }

      fetchJson(endpoint)
        .then((data) => renderer(wrapper, normalize(data)))
        .catch(() => renderEmpty(wrapper, "We could not load this section right now."));
    });
  };

  api.onPageChange(() => initHome());
  initHome();
});
