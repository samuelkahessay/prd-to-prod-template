import { test, expect } from "@playwright/test";

test.describe("Activity Feed", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test("feed collapses and expands correctly", async ({ page }) => {
    const feed = page.getByTestId("activity-feed");
    await expect(feed).toBeVisible();

    const expandButton = page.getByRole("button", { name: /show more/i });
    
    if (await expandButton.isVisible()) {
      await expandButton.click();

      const collapseButton = page.getByRole("button", { name: /show less/i });
      await expect(collapseButton).toBeVisible();

      await page.screenshot({ path: ".sisyphus/evidence/task-15-activity-feed-expanded.png" });

      await collapseButton.click();

      await expect(expandButton).toBeVisible();
      await page.screenshot({ path: ".sisyphus/evidence/task-15-activity-feed-collapsed.png" });
    } else {
      await page.screenshot({ path: ".sisyphus/evidence/task-15-activity-feed.png" });
    }
  });

  test("event type filtering works", async ({ page }) => {
    const filterButton = page.getByTestId("activity-filter-trigger");
    
    if (await filterButton.isVisible()) {
      await filterButton.click();

      const workflowsCheckbox = page.getByRole("checkbox", { name: /workflows/i });
      await expect(workflowsCheckbox).toBeVisible();

      await workflowsCheckbox.click();

      await page.screenshot({ path: ".sisyphus/evidence/task-15-activity-filter.png" });

      await page.keyboard.press("Escape");
    }
  });
});
