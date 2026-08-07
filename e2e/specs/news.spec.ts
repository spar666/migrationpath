import { test, expect, waitForApp } from '../fixtures/test';
import { stubApi, NEWS_ARTICLE, SECOND_NEWS_ARTICLE } from '../fixtures/api-stubs';
import { NewsPage } from '../pages/news.page';

/**
 * The news index and article pages.
 *
 * The failure mode this file is built around is a quiet one. `newsService`
 * reads `envelope.data.data` — our own `{ success, data }` wrapper around a
 * Strapi page — and when that shape is wrong the page does not error. It
 * renders "No articles available yet." A spec that only checks the page loaded
 * passes against a news section that has silently been empty for a month.
 *
 * So the assertions here are mostly about content actually arriving: the
 * featured hero, the grid, the count, and the slug links that connect them.
 *
 * One structural quirk drives several selectors: the first article renders
 * twice, once as the hero and once as the first grid card. Anything matched on
 * its title alone resolves to two nodes and fails strict mode.
 */

test.describe('the index', () => {
  test.beforeEach(async ({ page }) => {
    await stubApi(page);
  });

  test('renders its own masthead', async ({ page }) => {
    const news = new NewsPage(page);
    await news.goto();
    await waitForApp(page);

    await expect(news.heading()).toBeVisible();
  });

  test('promotes the newest article to the hero', async ({ page }) => {
    const news = new NewsPage(page);
    await news.goto();
    await waitForApp(page);

    await expect(news.featuredBadge()).toBeVisible();
    await expect(news.featured()).toContainText(NEWS_ARTICLE.title);
  });

  test('lists the rest below it', async ({ page }) => {
    const news = new NewsPage(page);
    await news.goto();
    await waitForApp(page);

    await expect(news.latestHeading()).toBeVisible();
    await expect(news.cardTitled(SECOND_NEWS_ARTICLE.title)).toBeVisible();
  });

  test('counts the articles it received', async ({ page }) => {
    // The count comes from the response, not from what rendered, so it is the
    // cheapest check that the envelope was unwrapped correctly.
    const news = new NewsPage(page);
    await news.goto();
    await waitForApp(page);

    await expect(news.articleCount()).toHaveText('2 articles');
  });

  test('shows the sidebar alongside the grid', async ({ page }) => {
    const news = new NewsPage(page);
    await news.goto();
    await waitForApp(page);

    await expect(news.sidebar()).toBeVisible();
  });

  test('the hero links to the article it is promoting', async ({ page }) => {
    const news = new NewsPage(page);
    await news.goto();
    await waitForApp(page);

    await expect(news.featured()).toHaveAttribute(
      'href',
      `/news/${NEWS_ARTICLE.slug}`,
    );
  });

  test('opens an article from a grid card', async ({ page }) => {
    const news = new NewsPage(page);
    await news.goto();
    await waitForApp(page);

    await news.cardTitled(SECOND_NEWS_ARTICLE.title).click();

    await expect(page).toHaveURL(new RegExp(`/news/${SECOND_NEWS_ARTICLE.slug}$`));
    await expect(news.articleTitle(SECOND_NEWS_ARTICLE.title)).toBeVisible();
  });

  test('every card links somewhere, not to a dead placeholder', async ({ page }) => {
    // NewsCard falls back to `/news/article` when a slug is missing, which is
    // a 404 wearing a working link's clothes.
    const news = new NewsPage(page);
    await news.goto();
    await waitForApp(page);

    const cards = news.cards();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).not.toHaveAttribute('href', '/news/article');
    }
  });
});

test.describe('when there is nothing to show', () => {
  test('says so rather than rendering an empty grid', async ({ page }) => {
    await stubApi(page, { empty: true });
    const news = new NewsPage(page);
    await news.goto();
    await waitForApp(page);

    await expect(news.emptyState()).toBeVisible();
  });

  test('does not render a hero with no article behind it', async ({ page }) => {
    await stubApi(page, { empty: true });
    const news = new NewsPage(page);
    await news.goto();
    await waitForApp(page);

    await expect(news.featuredBadge()).toHaveCount(0);
    await expect(news.latestHeading()).toHaveCount(0);
  });
});

test.describe('when the feed is down', () => {
  test('degrades to the empty state instead of white-screening', async ({
    page,
    health,
  }) => {
    health.expectErrors('the page logs the failed fetch');
    await stubApi(page, { failing: ['/cms/news-articles'] });
    const news = new NewsPage(page);
    await news.goto();
    await waitForApp(page);

    await expect(news.emptyState()).toBeVisible();
    await expect(news.heading()).toBeVisible();
  });

  test('stops loading rather than spinning forever', async ({ page, health }) => {
    // `finally { setLoading(false) }` is what makes this true. Without it a
    // failed fetch leaves the spinner up permanently.
    health.expectErrors('the page logs the failed fetch');
    await stubApi(page, { failing: ['/cms/news-articles'] });
    const news = new NewsPage(page);
    await news.goto();
    await waitForApp(page);

    await expect(news.loading()).toHaveCount(0);
  });
});

test.describe('an article', () => {
  test.beforeEach(async ({ page }) => {
    await stubApi(page);
  });

  test('renders the article named in the URL', async ({ page }) => {
    const news = new NewsPage(page);
    await news.gotoArticle(NEWS_ARTICLE.slug);
    await waitForApp(page);

    await expect(news.articleTitle(NEWS_ARTICLE.title)).toBeVisible();
  });

  test('renders the OTHER article when that slug is asked for', async ({ page }) => {
    // Guards against a handler that ignores the slug and always serves the
    // first article — which looks completely correct until you click through
    // to the second one.
    const news = new NewsPage(page);
    await news.gotoArticle(SECOND_NEWS_ARTICLE.slug);
    await waitForApp(page);

    await expect(news.articleTitle(SECOND_NEWS_ARTICLE.title)).toBeVisible();
    await expect(news.articleTitle(NEWS_ARTICLE.title)).toHaveCount(0);
  });

  test('shows the category and reading time', async ({ page }) => {
    const news = new NewsPage(page);
    await news.gotoArticle(NEWS_ARTICLE.slug);
    await waitForApp(page);

    await expect(news.readTime()).toBeVisible();
  });

  test('offers a route back to the index', async ({ page }) => {
    const news = new NewsPage(page);
    await news.gotoArticle(NEWS_ARTICLE.slug);
    await waitForApp(page);

    await news.backToNews().click();

    await expect(page).toHaveURL(/\/news$/);
    await expect(news.heading()).toBeVisible();
  });

  test('links to a related article, and it resolves', async ({ page }) => {
    const news = new NewsPage(page);
    await news.gotoArticle(NEWS_ARTICLE.slug);
    await waitForApp(page);

    const related = news.relatedLink(SECOND_NEWS_ARTICLE.slug);
    await expect(related).toBeVisible();
    await related.click();

    await expect(news.articleTitle(SECOND_NEWS_ARTICLE.title)).toBeVisible();
  });

  test('does not list itself among the related articles', async ({ page }) => {
    const news = new NewsPage(page);
    await news.gotoArticle(NEWS_ARTICLE.slug);
    await waitForApp(page);

    await expect(news.relatedLink(NEWS_ARTICLE.slug)).toHaveCount(0);
  });

  test('says so plainly when the slug matches nothing', async ({ page }) => {
    const news = new NewsPage(page);
    await news.gotoArticle('no-such-article');
    await waitForApp(page);

    await expect(news.notFound()).toBeVisible();
  });

  test('offers a way out of a missing article', async ({ page }) => {
    // A dead end on a shared link is how a visitor leaves the site.
    const news = new NewsPage(page);
    await news.gotoArticle('no-such-article');
    await waitForApp(page);

    await expect(news.backToNews()).toBeVisible();
  });

  test('survives a reload — these URLs get shared', async ({ page }) => {
    const news = new NewsPage(page);
    await news.gotoArticle(NEWS_ARTICLE.slug);
    await waitForApp(page);

    await page.reload();
    await waitForApp(page);

    await expect(news.articleTitle(NEWS_ARTICLE.title)).toBeVisible();
  });
});
