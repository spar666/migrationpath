import type { Page } from '@playwright/test';

/**
 * The news index and article pages.
 *
 * One structural note that drives most of the selectors: the first article is
 * rendered TWICE — once as the big `FeaturedArticle` hero and again as the
 * first `NewsCard` in the grid. Any locator matched on its title therefore
 * resolves to two nodes and fails Playwright's strict mode. Everything below
 * is scoped to one region or the other for that reason.
 */
export class NewsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/news');
  }

  async gotoArticle(slug: string) {
    await this.page.goto(`/news/${slug}`);
  }

  // --- Index ---

  heading() {
    return this.page.getByRole('heading', { name: /policy updates & analysis/i });
  }

  loading() {
    return this.page.getByText(/loading articles/i);
  }

  emptyState() {
    return this.page.getByText(/no articles available yet/i);
  }

  /** The hero. Scoped by its badge so it cannot collide with the grid card. */
  featured() {
    return this.page
      .locator('a')
      .filter({ has: this.page.getByText('Featured', { exact: true }) })
      .first();
  }

  featuredBadge() {
    return this.page.getByText('Featured', { exact: true });
  }

  featuredCta() {
    return this.page.getByText(/read full analysis/i);
  }

  latestHeading() {
    return this.page.getByRole('heading', { name: /latest analysis/i });
  }

  /** "N articles" — the count beside the Latest Analysis heading. */
  articleCount() {
    return this.page.getByText(/^\d+ articles$/);
  }

  /** The grid section, excluding the featured hero above it. */
  grid() {
    return this.page
      .locator('section')
      .filter({ has: this.page.getByRole('heading', { name: /latest analysis/i }) });
  }

  cards() {
    return this.grid().getByRole('link');
  }

  cardTitled(title: string | RegExp) {
    return this.grid().getByRole('link').filter({ hasText: title }).first();
  }

  sidebar() {
    return this.grid().locator('.sticky').first();
  }

  // --- Article ---

  articleTitle(name: string | RegExp) {
    return this.page.getByRole('heading', { name, level: 1 });
  }

  notFound() {
    return this.page.getByRole('heading', { name: /article not found/i });
  }

  backToNews() {
    return this.page.getByRole('link', { name: /back to news/i }).first();
  }

  category() {
    return this.page.getByText(/^(policy|news|analysis|update)$/i).first();
  }

  readTime() {
    return this.page.getByText(/\d+ min read/i).first();
  }

  relatedLink(slug: string) {
    return this.page.locator(`a[href="/news/${slug}"]`).first();
  }
}
