// LayerEngine.ai Blog Posts
// This file is auto-updated by the scheduled blog automation.
// DO NOT edit manually — changes will be overwritten on the next scheduled run.

const BLOG_POSTS = [
  {
    slug: "why-real-estate-brokerages-lose-agents-in-first-90-days",
    title: "Why Real Estate Brokerages Lose Agents in the First 90 Days (And the Automation Fix)",
    excerpt: "46% of real estate agents changed brokerages or left the industry in a single year. The culprit isn't compensation — it's what happens after they sign. Here's the onboarding failure pattern and how AI automation closes the gap.",
    category: "Agent Retention",
    date: "June 17, 2025",
    readTime: "6 min read",
    icon: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="rgba(37,99,235,0.1)"/><path d="M20 10a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round"/><path d="M20 14v6l4 2" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round"/></svg>`
  },
  {
    slug: "ai-recruiting-vs-cold-calling-real-estate-agents",
    title: "AI Recruiting vs. Cold Calling: Why Brokerages Are Ditching the Dialer in 2025",
    excerpt: "Traditional cold calling costs your managers 3–5 hours a day to book one recruiting appointment. AI voice and SMS systems contact thousands of candidates simultaneously. Here's the real math — and what it means for your growth.",
    category: "AI Recruiting",
    date: "June 20, 2025",
    readTime: "7 min read",
    icon: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="rgba(37,99,235,0.1)"/><path d="M28 24.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 10.15 20a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 9.05 9h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11l-1.27 1.27a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 27 23z" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round"/></svg>`
  }
];

function renderPosts(categoryFilter) {
  const grid = document.getElementById('blog-grid');
  if (!grid) return;

  const filtered = categoryFilter
    ? BLOG_POSTS.filter(p => p.category === categoryFilter)
    : BLOG_POSTS;

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:4rem 0;color:#6B7280;font-size:15px;">No posts in this category yet. Check back soon.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(post => `
    <article class="blog-card">
      <div class="blog-card-img-placeholder">
        ${post.icon}
      </div>
      <div class="blog-card-body">
        <div class="blog-card-meta">
          <span class="blog-card-tag">${post.category}</span>
          <span class="blog-card-date">${post.date}</span>
        </div>
        <h2>${post.title}</h2>
        <p>${post.excerpt}</p>
        <div class="blog-card-footer">
          <a href="/blog/${post.slug}/" class="blog-read-more">
            Read Article
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
          <span class="blog-read-time">${post.readTime}</span>
        </div>
      </div>
    </article>
  `).join('');
}

// Initial render
renderPosts(null);
