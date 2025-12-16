import { apiInitializer } from "discourse/lib/api";

const heroImageUrl = 'https://gyandhan.s3.ap-south-1.amazonaws.com/uploads/gyandhan_asset/document/15434/GDC_Banner__1__52463ab7818b22c0c1bf.png';
const SIGNUP_URL = "/signup";
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
const bio = escapeHtml(person.bio || "An alumnus of " + university + ", " + name.split(' ')[0] + " was working as Data Engineer- SQL .....");
const avatar = person.avatar || person.avatar_template;
const avatarUrl = avatar
? avatar.replace("{size}", "90")
: "https://placehold.co/90x90?text=Alumni";

const titleHtml = title ? `<p class="gh-mobile-alumni-card__degree">Degree- ${title}</p>` : "";

return `
       <article class="gh-mobile-alumni-card">
         <div class="gh-mobile-alumni-card__avatar-wrapper">
           <img class="gh-mobile-alumni-card__avatar" src="${avatarUrl}" alt="${name}">
         </div>
         <h3 class="gh-mobile-alumni-card__name">${name}</h3>
         <p class="gh-mobile-alumni-card__university">${university}</p>
         ${titleHtml}
         <div class="gh-mobile-alumni-card__divider"></div>
         <p class="gh-mobile-alumni-card__bio">${bio}</p>
         <button class="gh-mobile-button gh-mobile-button--primary gh-mobile-alumni-card__cta gh-message-btn" data-username="${escapeHtml(person.username || '')}">Message</button>
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

// Check if this is for the "Latest" section (grid layout)
const isLatestGrid = block.classList.contains('gh-mobile-latest-grid');
const displayCount = isLatestGrid ? 2 : 3;

const cards = topics.slice(0, displayCount).map((topic) => {
const title = escapeHtml(topic.title || "Topic");
const link = topic.url || `/t/${topic.slug}/${topic.id}`;
const replies = topic.posts_count ?? topic.reply_count ?? topic.replies;
const views = topic.views;
const tags = topic.tags || [];

if (isLatestGrid) {
// Latest grid card with tags
const tagsHtml = tags
.slice(0, 3)
.map((tag) => `<span class="gh-mobile-tag-chip">${escapeHtml(tag)}</span>`)
.join("");

return `
       <article class="gh-mobile-latest-card">
         <p class="gh-mobile-latest-card__title">${title}</p>
         <div class="gh-mobile-latest-card__meta">
           <svg class="gh-mobile-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
             <path d="M12.8333 8.75003V11.0834C12.8333 11.4616 12.6829 11.8244 12.4172 12.0901C12.1515 12.3557 11.7887 12.5062 11.4105 12.5062H2.92267C2.5445 12.5062 2.18165 12.3557 1.91597 12.0901C1.65029 11.8244 1.49988 11.4616 1.49988 11.0834V8.75003M4.25532 5.83337L7.16643 8.75003M7.16643 8.75003L10.0775 5.83337M7.16643 8.75003V1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
           </svg>
           <span>${replies || 0} replies</span>
           <span class="gh-mobile-meta-dot">•</span>
           <svg class="gh-mobile-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
             <path d="M0.583496 7.2295C0.583496 7.2295 2.91683 2.5625 7.00016 2.5625C11.0835 2.5625 13.4168 7.2295 13.4168 7.2295C13.4168 7.2295 11.0835 11.8958 7.00016 11.8958C2.91683 11.8958 0.583496 7.2295 0.583496 7.2295Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
             <path d="M7 9.04163C7.99754 9.04163 8.80625 8.23292 8.80625 7.23538C8.80625 6.23783 7.99754 5.42913 7 5.42913C6.00246 5.42913 5.19375 6.23783 5.19375 7.23538C5.19375 8.23292 6.00246 9.04163 7 9.04163Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
           </svg>
           <span>${views || 0} Views</span>
         </div>
         <div class="gh-mobile-tag-list">${tagsHtml}</div>
       </article>
     `;
} else {
// Most Talked Topics card
return `
       <article class="gh-mobile-topic-card">
         <p class="gh-mobile-topic-card__title">${title}</p>
         <div class="gh-mobile-topic-card__meta">
           <svg class="gh-mobile-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
             <path d="M12.8333 8.75003V11.0834C12.8333 11.4616 12.6829 11.8244 12.4172 12.0901C12.1515 12.3557 11.7887 12.5062 11.4105 12.5062H2.92267C2.5445 12.5062 2.18165 12.3557 1.91597 12.0901C1.65029 11.8244 1.49988 11.4616 1.49988 11.0834V8.75003M4.25532 5.83337L7.16643 8.75003M7.16643 8.75003L10.0775 5.83337M7.16643 8.75003V1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
           </svg>
           <span>${replies || 0} replies</span>
           <span class="gh-mobile-meta-dot">•</span>
           <svg class="gh-mobile-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
             <path d="M0.583496 7.2295C0.583496 7.2295 2.91683 2.5625 7.00016 2.5625C11.0835 2.5625 13.4168 7.2295 13.4168 7.2295C13.4168 7.2295 11.0835 11.8958 7.00016 11.8958C2.91683 11.8958 0.583496 7.2295 0.583496 7.2295Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
             <path d="M7 9.04163C7.99754 9.04163 8.80625 8.23292 8.80625 7.23538C8.80625 6.23783 7.99754 5.42913 7 5.42913C6.00246 5.42913 5.19375 6.23783 5.19375 7.23538C5.19375 8.23292 6.00246 9.04163 7 9.04163Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
           </svg>
           <span>${views || 0} Views</span>
         </div>
       </article>
     `;
}
});

block.innerHTML = cards.join("");
removeSkeleton(block);
};

// Country flag mapping
const countryFlags = {
"US": "🇺🇸", "USA": "🇺🇸",
"UK": "🇬🇧", "United Kingdom": "🇬🇧",
"Australia": "🇦🇺", "AU": "🇦🇺",
"Canada": "🇨🇦", "CA": "🇨🇦",
"Germany": "🇩🇪", "DE": "🇩🇪",
"Ireland": "🇮🇪", "IE": "🇮🇪",
"France": "🇫🇷", "FR": "🇫🇷"
};

const renderCourses = (block, courses) => {
if (!courses?.length) {
renderEmpty(block);
return;
}

const items = courses.slice(0, 3).map((course) => {
const title = escapeHtml(course.title || "Course");
const price = escapeHtml(course.price || "");

const priceHtml = price 
? `<p class="gh-mobile-course-item__price">Starts at: ${price}</p>` 
: '';

return `
     <div class="gh-mobile-course-item">
       <p class="gh-mobile-course-item__title">${title}</p>
       ${priceHtml}
     </div>
   `;
});

block.innerHTML = items.join("");
removeSkeleton(block);
};

const renderEvents = (block, events) => {
if (!events?.length) {
renderEmpty(block);
return;
}

const cards = events.slice(0, 2).map((event) => {
const title = escapeHtml(event.title || "Event");
const date = escapeHtml(event.date || event.starts_at || "");
const location = escapeHtml(event.location || event.mode || "Online Event");
const href = event.url || event.cta_url || "#";
const attendees = event.attendees || "25";
const image = escapeHtml(event.image || event.thumbnail || "https://placehold.co/250x180?text=Event");

return `
     <article class="gh-mobile-event-card">
       <img class="gh-mobile-event-card__image" src="${image}" alt="${title}">
       <div class="gh-mobile-event-card__content">
         <h3 class="gh-mobile-event-card__title">${title}</h3>
         <div class="gh-mobile-event-card__meta">
           <div class="gh-mobile-event-card__info">
             <svg class="gh-mobile-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
               <path d="M11.375 2.33337H2.625C1.93464 2.33337 1.375 2.89302 1.375 3.58337V11.6667C1.375 12.357 1.93464 12.9167 2.625 12.9167H11.375C12.0654 12.9167 12.625 12.357 12.625 11.6667V3.58337C12.625 2.89302 12.0654 2.33337 11.375 2.33337Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
               <path d="M9.5 1.08337V3.58337M4.5 1.08337V3.58337M1.375 6.08337H12.625" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
             </svg>
             <span>${date}</span>
           </div>
           <div class="gh-mobile-event-card__info">
             <svg class="gh-mobile-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
               <path d="M7 12.8333C10.2217 12.8333 12.8333 10.2217 12.8333 7C12.8333 3.77834 10.2217 1.16667 7 1.16667C3.77834 1.16667 1.16667 3.77834 1.16667 7C1.16667 10.2217 3.77834 12.8333 7 12.8333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
               <path d="M7 3.5V7H10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
             </svg>
             <span>${attendees} Interested</span>
           </div>
         </div>
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

const chips = categories.slice(0, 6).map((category) => {
const name = escapeHtml(category.name || "Category");
const url = category.url || `/c/${category.slug}/${category.id}`;
const icon = category.icon || "📚";

return `
     <a class="gh-mobile-category-chip" href="${url}">
       <div class="gh-mobile-category-chip__icon">
         <span>${icon}</span>
       </div>
       <div class="gh-mobile-category-chip__label">${name}</div>
     </a>
   `;
}).join("");

block.innerHTML = chips;
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

const isLoginRoute = (pageSetting = "both") => {
  const path = (window.location.pathname || "/").replace(/\/+$/, "");

  if (pageSetting === "signup") {
    return path === "/signup";
  } else if (pageSetting === "login") {
    return path === "/login";
  }
  // "both" or any other value
  return path === "/login" || path === "/signup";
};

// Build login video HTML
const buildLoginVideoHtml = (videoId) => {
  if (!videoId) return "";
  const escapedVideoId = escapeHtml(videoId);
  return `
    <div class="gh-login-video">
      <iframe
        src="https://www.youtube.com/embed/${escapedVideoId}?rel=0&modestbranding=1"
        title="Welcome Video"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen>
      </iframe>
    </div>
  `;
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
name: "Diksha Sinha",
title: "M.Sc Marketing",
university: "Queen Mary University, London",
cta_label: "Message",
avatar: "https://placehold.co/90x90?text=DS",
},
{
name: "Gayatree Borul",
title: "MS Electrical Engineering and IT ",
university: "Applied science University of Darmstadt, Germany",
cta_label: "Message",
avatar: "https://placehold.co/90x90?text=GB",
},
{
name: "Palak Ranjan",
title: "LLM Transnational Crime and Justice",
university: "UNICRI, Italy",
cta_label: "Message",
avatar: "https://placehold.co/90x90?text=PR",
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
{ 
title: "MS in Computer Science", 
countries: ["US", "Australia", "Canada", "Germany"], 
price: "INR 4 Lakhs", 
},
{ 
title: "Global MBA", 
countries: ["US", "UK", "Australia", "Canada", "Ireland"], 
price: "INR 3 Lakhs", 
},
{ 
title: "MSc in Data Science", 
countries: ["Germany", "USA", "Australia", "France"], 
price: "INR 3 Lakhs", 
},
{ 
title: "Master of Eng. Management", 
countries: ["US", "UK", "Germany"], 
price: "INR 4 Lakhs", 
},
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
{ 
name: "Videshi Chai", 
slug: "videshi-chai", 
id: 190,
url: "https://discussions.gyandhan.com/c/videshi-chai/190",
icon: "🍵"
},
{ 
name: "Scholarships", 
slug: "scholarships", 
id: 53,
url: "https://discussions.gyandhan.com/c/scholarships/53",
icon: "🏠"
},
{ 
name: "Accommodation", 
slug: "accommodation", 
id: 214,
url: "https://discussions.gyandhan.com/c/accommodation/214",
icon: "🏡"
},
{ 
name: "University Discussions", 
slug: "university-discussions", 
id: 39,
url: "https://discussions.gyandhan.com/c/university-discussions/39",
icon: "📚"
},
{ 
name: "Newsverse", 
slug: "newsverse", 
id: 52,
url: "https://discussions.gyandhan.com/c/newsverse/52",
icon: "📰"
},
{ 
name: "Articles", 
slug: "articles", 
id: 216,
url: "https://discussions.gyandhan.com/c/articles/216",
icon: "💧"
},
],
};

const buildHomeHtml = (s, options = {}) => {
const { isLoggedIn = false, signupUrl = SIGNUP_URL } = options;
const heroPrimaryHref = escapeHtml(
!isLoggedIn ? signupUrl : s.cta_primary_url || "/"
);

// New mobile-first hero section
const hero = `
   <section class="gh-mobile-hero">
     <div class="gh-mobile-hero__gradient"></div>
     <div class="gh-mobile-hero__header"></div>
     <div class="gh-mobile-hero__content">
       <div class="gh-mobile-tag">
         <span class="gh-mobile-tag__emoji">🎓</span>
         <span class="gh-mobile-tag__text">Study Abroad Made Simple</span>
       </div>
       <h1 class="gh-mobile-hero__title">Real Advise,<br>Actual Results</h1>
       <p class="gh-mobile-hero__subtitle">Lorem ipsum dolor sit amet consectetur. Sagittis iaculis porta nunc magna aliquet volutpat.</p>
       <a class="gh-mobile-button gh-mobile-button--primary" href="${heroPrimaryHref}">
         <span>Button CTA</span>
         <svg class="gh-mobile-button__icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
           <path d="M4.16669 10H15.8334M15.8334 10L10 4.16669M15.8334 10L10 15.8334" stroke="currentColor" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round"/>
         </svg>
       </a>
     </div>
     <div class="gh-mobile-hero__image">
       <div class="gh-mobile-hero__image-overlay gh-mobile-hero__image-overlay--left">Lorem Ipsum</div>
       <div class="gh-mobile-hero__image-overlay gh-mobile-hero__image-overlay--right">Lorem Ipsum</div>
     </div>
   </section>
 `;

// Stats section - mobile design
const stats = `
   <section class="gh-mobile-stats">
     <div class="gh-mobile-stat-card">
       <div class="gh-mobile-stat-card__icon">
         <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
           <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
         </svg>
       </div>
       <div class="gh-mobile-stat-card__content">
         <div class="gh-mobile-stat-card__value">4K+</div>
         <div class="gh-mobile-stat-card__label">Active Members</div>
       </div>
     </div>
     <div class="gh-mobile-stat-card">
       <div class="gh-mobile-stat-card__icon">
         <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
           <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
         </svg>
       </div>
       <div class="gh-mobile-stat-card__content">
         <div class="gh-mobile-stat-card__value">500+</div>
         <div class="gh-mobile-stat-card__label">Alumni Mentors</div>
       </div>
     </div>
     <div class="gh-mobile-stat-card">
       <div class="gh-mobile-stat-card__icon">
         <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
           <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
           <path d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
         </svg>
       </div>
       <div class="gh-mobile-stat-card__content">
         <div class="gh-mobile-stat-card__value">200+</div>
         <div class="gh-mobile-stat-card__label">Event Hosted</div>
       </div>
     </div>
   </section>
 `;

const alumni = s.show_alumni_spotlight
? `
   <section class="gh-mobile-section">
     <div class="gh-mobile-section__header">
       <h2 class="gh-mobile-section__title">Alumni Spotlight</h2>
     </div>
     <div class="gh-mobile-alumni-carousel gh-skeleton" data-block="alumni" data-endpoint="${escapeHtml(
       s.alumni_endpoint || ""
     )}">
       <div class="gh-mobile-alumni-card"></div>
       <div class="gh-mobile-alumni-card"></div>
     </div>
     <div class="gh-mobile-carousel-dots">
       <span class="gh-mobile-carousel-dot gh-mobile-carousel-dot--active"></span>
       <span class="gh-mobile-carousel-dot"></span>
       <span class="gh-mobile-carousel-dot"></span>
     </div>
   </section>`
: "";

const mostTalked = s.show_most_talked
? `
   <section class="gh-mobile-section">
     <div class="gh-mobile-section__header">
       <h2 class="gh-mobile-section__title">Most Talked Topics</h2>
     </div>
     <div class="gh-mobile-topic-list gh-skeleton" data-block="most-talked" data-endpoint="${escapeHtml(
       s.most_talked_endpoint || ""
     )}">
       <div class="gh-mobile-topic-card"></div>
       <div class="gh-mobile-topic-card"></div>
       <div class="gh-mobile-topic-card"></div>
     </div>
   </section>`
: "";

const latest = s.show_latest
? `
   <section class="gh-mobile-section">
     <div class="gh-mobile-section__header">
       <h2 class="gh-mobile-section__title">Latest</h2>
     </div>
     <div class="gh-mobile-latest-grid gh-skeleton" data-block="latest" data-endpoint="${escapeHtml(
       s.latest_endpoint || "/latest.json"
     )}">
       <div class="gh-mobile-latest-card"></div>
       <div class="gh-mobile-latest-card"></div>
     </div>
   </section>`
: "";

const courses = s.show_popular_courses
? `
   <section class="gh-mobile-section">
     <div class="gh-mobile-section__header">
       <h2 class="gh-mobile-section__title">Most Popular Courses</h2>
     </div>
     <div class="gh-mobile-tabs">
       <div class="gh-mobile-tabs__row">
         <button class="gh-mobile-tab gh-mobile-tab--active" data-country="USA">
           <span class="gh-mobile-tab__flag">🇺🇸</span>
           <span class="gh-mobile-tab__label">USA</span>
         </button>
         <button class="gh-mobile-tab" data-country="Germany">
           <span class="gh-mobile-tab__flag">🇩🇪</span>
           <span class="gh-mobile-tab__label">Germany</span>
         </button>
         <button class="gh-mobile-tab" data-country="UK">
           <span class="gh-mobile-tab__flag">🇬🇧</span>
           <span class="gh-mobile-tab__label">UK</span>
         </button>
       </div>
       <div class="gh-mobile-tabs__row">
         <button class="gh-mobile-tab" data-country="Ireland">
           <span class="gh-mobile-tab__flag">🇮🇪</span>
           <span class="gh-mobile-tab__label">Ireland</span>
         </button>
         <button class="gh-mobile-tab" data-country="Netherland">
           <span class="gh-mobile-tab__flag">🇳🇱</span>
           <span class="gh-mobile-tab__label">Netherland</span>
         </button>
         <button class="gh-mobile-tab" data-country="Canada">
           <span class="gh-mobile-tab__flag">🇨🇦</span>
           <span class="gh-mobile-tab__label">CANADA</span>
         </button>
       </div>
     </div>
     <div class="gh-mobile-course-list gh-skeleton" data-block="popular-courses" data-endpoint="${escapeHtml(
       s.popular_courses_endpoint || ""
     )}">
       <div class="gh-mobile-course-item"></div>
       <div class="gh-mobile-course-item"></div>
       <div class="gh-mobile-course-item"></div>
     </div>
   </section>`
: "";

const events = s.show_events
? `
   <section class="gh-mobile-section">
     <div class="gh-mobile-section__header">
       <h2 class="gh-mobile-section__title">Upcoming Events</h2>
     </div>
     <div class="gh-mobile-event-carousel gh-skeleton" data-block="events" data-endpoint="${escapeHtml(
       s.events_endpoint || ""
     )}">
       <div class="gh-mobile-event-card"></div>
       <div class="gh-mobile-event-card"></div>
     </div>
   </section>`
: "";

const categories = s.show_categories
? `
   <section class="gh-mobile-section">
     <div class="gh-mobile-section__header">
       <h2 class="gh-mobile-section__title">Explore Categories</h2>
     </div>
     <div class="gh-mobile-category-grid gh-skeleton" data-block="categories" data-endpoint="${escapeHtml(
       s.categories_endpoint || "/categories.json"
     )}">
       <div class="gh-mobile-category-chip"></div>
       <div class="gh-mobile-category-chip"></div>
       <div class="gh-mobile-category-chip"></div>
       <div class="gh-mobile-category-chip"></div>
       <div class="gh-mobile-category-chip"></div>
       <div class="gh-mobile-category-chip"></div>
     </div>
   </section>`
: "";

return `${hero}${stats}${alumni}${mostTalked}${latest}${courses}${events}${categories}`;
};

export default apiInitializer("0.11.3", (api) => {
const isUserLoggedIn = () => Boolean(api.getCurrentUser());

// Setup message button click handler using event delegation
const attachMessageHandlers = (container, { signupUrl }) => {
console.log("[GD Connect Theme] Setting up message button event delegation");

container.addEventListener("click", (e) => {
const btn = e.target.closest(".gh-message-btn");
if (btn) {
e.preventDefault();
if (!isUserLoggedIn()) {
window.location.href = signupUrl;
return;
}
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
container.innerHTML = buildHomeHtml(settings, {
isLoggedIn: isUserLoggedIn(),
signupUrl: SIGNUP_URL,
});
container.dataset.hydrated = "true";
hydrate(container);

// Setup event delegation for message buttons on the container
attachMessageHandlers(container, { signupUrl: SIGNUP_URL });
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
  // Login video injection
  let loginVideoObserver = null;

  const injectLoginVideo = () => {
    // Clean up previous observer if exists
    if (loginVideoObserver) {
      loginVideoObserver.disconnect();
      loginVideoObserver = null;
    }

    if (!isLoginRoute(settings.login_video_pages)) return;
    if (!settings.show_login_video || !settings.login_video_youtube_id) return;

    const videoHtml = buildLoginVideoHtml(settings.login_video_youtube_id);
    if (!videoHtml) return;

    // Function to inject video into the login modal
    const tryInjectVideo = () => {
      // Check if already injected
      if (document.querySelector(".gh-login-video")) return true;

      // Try to find the login modal
      const loginModal = document.querySelector(".login-modal, .d-modal.login-modal, #login-form, .login-modal-body");
      if (!loginModal) return false;

      // Desktop: inject into right pane (above social logins)
      const rightSide = loginModal.querySelector(".login-right-side");
      if (rightSide && !rightSide.querySelector(".gh-login-video")) {
        rightSide.insertAdjacentHTML("afterbegin", videoHtml);
        console.log("[GD Connect Theme] Login video injected (desktop - right side)");
        return true;
      }

      // Mobile/Alternative: inject after welcome header or at the top of form
      const welcomeHeader = loginModal.querySelector(".login-welcome-header, .login-title, .modal-header");
      if (welcomeHeader && !welcomeHeader.parentElement.querySelector(".gh-login-video")) {
        welcomeHeader.insertAdjacentHTML("afterend", videoHtml);
        console.log("[GD Connect Theme] Login video injected (mobile - after header)");
        return true;
      }

      // Fallback: inject at the beginning of the modal body
      const modalBody = loginModal.querySelector(".modal-body, .login-form");
      if (modalBody && !modalBody.querySelector(".gh-login-video")) {
        modalBody.insertAdjacentHTML("afterbegin", videoHtml);
        console.log("[GD Connect Theme] Login video injected (fallback - modal body)");
        return true;
      }

      return false;
    };

    // Try immediate injection
    if (tryInjectVideo()) return;

    // Set up observer to wait for modal to render
    loginVideoObserver = new MutationObserver(() => {
      if (tryInjectVideo()) {
        loginVideoObserver.disconnect();
        loginVideoObserver = null;
      }
    });

    loginVideoObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Safety timeout to disconnect observer after 10 seconds
    setTimeout(() => {
      if (loginVideoObserver) {
        loginVideoObserver.disconnect();
        loginVideoObserver = null;
      }
    }, 10000);
  };

  api.onPageChange(() => {
    injectLanding();
    injectLoginVideo();
  });
injectLanding();
  injectLoginVideo();
});