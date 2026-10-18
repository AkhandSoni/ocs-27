import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const list: string[] = [];
  errors.set(page, list);
  page.on("pageerror", (e) => list.push(e.message));
  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      /\.(svg|glb|jpg|webp|png|woff2?)(\?|$)/.test(response.url())
    )
      list.push(`Asset ${response.status()}: ${response.url()}`);
  });
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});
async function enter(page: Page, renderer = "webgl") {
  await page.addInitScript(() => sessionStorage.setItem("ocs:boot:v2", "1"));
  await page.goto(renderer ? `/?renderer=${renderer}` : "/");
  await expect(page.locator("[data-console-home]")).toBeVisible();
  await expect(page.locator(".room-stage")).toHaveAttribute(
    "data-renderer",
    /WebGPU|WebGL 2/,
  );
}
async function choose(page: Page, name: string) {
  await page
    .getByRole("button", { name: `Select ${name}`, exact: true })
    .click();
}
async function identity(page: Page) {
  await page.getByLabel("Full name", { exact: true }).fill("Console Explorer");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("applicant@example.test");
  await page
    .getByLabel("VIT registration number", { exact: true })
    .fill("26BCE0001");
  await page
    .getByLabel("Branch / programme", { exact: true })
    .fill("B.Tech CSE");
  await page
    .getByRole("combobox", { name: "Year of study", exact: true })
    .selectOption("1");
}
async function register(page: Page, name = "Console Explorer") {
  const email = `${randomUUID()}@prototype.test`;
  const response = await page.request.post("/api/auth/register", {
    headers: { origin: "http://127.0.0.1:3100" },
    data: {
      name,
      email,
      password: "console-prototype-password",
      avatar: "astro",
    },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).user;
}

test("short skippable startup opens an original guest console and five domains", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?renderer=webgl");
  await expect(page.locator('[data-console-stage="boot"]')).toBeVisible();
  await page.screenshot({
    path: info.outputPath("startup.png"),
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: /Skip startup/ })
    .click({ force: true, timeout: 800 })
    .catch(() => {});
  await expect(page.locator("[data-console-home]")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".room-stage")).toHaveAttribute(
    "data-renderer",
    "WebGL 2",
  );
  await expect(page.locator(".cartridge")).toHaveCount(8);
  await expect(page.locator(".console-home img")).toHaveCount(0);
  await expect(page.locator(".experience-preview")).toContainText("Web & App");
  await expect(page.locator(".console-home canvas")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("home.png") });
  for (const name of [
    "TECH",
    "RESEARCH",
    "MANAGEMENT",
    "DESIGN",
    "COMPETITIVE CODING",
  ]) {
    await choose(page, name);
    await expect(
      page.getByRole("button", { name: "Begin application", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Your role", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "What you’ll do", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Selections", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Your next two steps.", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Home");
    await expect(page.locator("[data-console-home]")).toBeVisible();
  }
  await choose(page, "TECH");
  await page.screenshot({ path: info.outputPath("selected-domain.png") });
  await page
    .getByRole("button", { name: "Begin application", exact: true })
    .click();
  await page.screenshot({ path: info.outputPath("application.png") });
});

test("guest application persists, signs in at submission, and saves an honest local receipt", async ({
  page,
}) => {
  await enter(page);
  await choose(page, "TECH");
  await page
    .getByRole("button", { name: "Begin application", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "First, your introduction." }),
  ).toBeVisible();
  await identity(page);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("Your answer", { exact: true })
    .fill("I want to build useful software with a curious team.");
  await page.keyboard.press("Backspace");
  await expect(page.getByLabel("Your answer", { exact: true })).toHaveValue(
    "I want to build useful software with a curious team",
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  for (let i = 0; i < 3; i++) {
    await page
      .getByLabel("Your answer", { exact: true })
      .fill(`My considered answer ${i + 1}.`);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  }
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Sign in to submit", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Player sign in" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "New player? Create an account", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Display name", { exact: true })
    .fill("Console Explorer");
  await page
    .getByRole("dialog")
    .getByLabel("Email address", { exact: true })
    .fill(`${randomUUID()}@prototype.test`);
  await page
    .getByRole("dialog")
    .getByLabel("Password", { exact: true })
    .fill("console-prototype-password");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Save submission", exact: true })
    .click();
  await expect(page.locator("[data-application-complete]")).toBeVisible();
  await expect(
    page.getByText("It has not been sent to a recruitment team.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("[data-console-home]")).toBeVisible();
  await choose(page, "MY CONSOLE");
  await page
    .getByRole("button", { name: /Tech.*local submission saved/ })
    .click();
  await expect(
    page.getByText("My considered answer 1.", { exact: true }),
  ).toBeVisible();
});

test("keyboard, physical controller, contextual back and draft persistence work", async ({
  page,
}) => {
  await enter(page);
  await page.keyboard.press("ArrowUp");
  await expect(
    page.getByRole("button", { name: "Experiences", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("button", { name: "Collection", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.down("ArrowRight");
  await expect(page.locator(".physical-right")).toHaveAttribute(
    "data-pressed",
    "true",
  );
  await page.keyboard.up("ArrowRight");
  await expect(
    page.getByRole("button", { name: "Select RESEARCH", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Enter");
  await expect(page.locator('[data-domain="research"]')).toBeVisible();
  await page.keyboard.press("Backspace");
  await expect(page.locator("[data-console-home]")).toBeVisible();
  await page.getByRole("button", { name: "Room view", exact: true }).click();
  await page
    .getByRole("button", { name: "Room controller move right", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Select MANAGEMENT", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Focus console", exact: true })
    .click();
  await page.keyboard.press("Enter");
  await page
    .getByRole("button", { name: "Begin application", exact: true })
    .click();
  await identity(page);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Your answer", { exact: true }).fill("A saved draft.");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "First, your introduction." }),
  ).toBeVisible();
  await expect(
    page.getByLabel("VIT registration number", { exact: true }),
  ).toHaveValue("26BCE0001");
  await page.keyboard.press("Home");
  await page.reload();
  await choose(page, "MANAGEMENT");
  await page
    .getByRole("button", { name: "Begin application", exact: true })
    .click();
  await expect(
    page.getByLabel("VIT registration number", { exact: true }),
  ).toHaveValue("26BCE0001");
});

test("arcade is playable, pauses, scores, ends, and retains a high score", async ({
  page,
}, info) => {
  await enter(page);
  await page.getByRole("button", { name: "Arcade", exact: true }).click();
  await expect(page.locator("[data-arcade]")).toBeVisible();
  await page.screenshot({ path: info.outputPath("arcade.png") });
  await page.getByRole("button", { name: "Start run", exact: true }).click();
  await expect(page.locator("[data-score]")).toHaveText("010");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "Take a breath.", exact: true }),
  ).toBeVisible();
  const score = await page.locator("[data-score]").innerText();
  await page.waitForTimeout(300);
  await expect(page.locator("[data-score]")).toHaveText(score!);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(
    page.getByText("CONNECTION LOST", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "10 points.", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("arcade-played.png") });
  await page.reload();
  await page.getByRole("button", { name: "Arcade", exact: true }).click();
  await expect(page.locator(".arcade-score")).toContainText("010");
  await page.getByRole("button", { name: "Start run", exact: true }).click();
  await page.keyboard.press("ArrowUp");
  await expect(
    page.getByRole("heading", { name: "0 points.", exact: true }),
  ).toBeVisible();
});

test("chapter collection, profile isolation, logout and reset use the same console", async ({
  page,
}) => {
  const first = await register(page);
  await enter(page);
  await page.getByRole("button", { name: "Collection", exact: true }).click();
  await expect
    .poll(() =>
      page
        .locator(".collection-case img")
        .evaluateAll(
          (images) =>
            images.length === 5 &&
            images.every(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0,
            ),
        ),
    )
    .toBe(true);
  await expect(
    page.getByRole("heading", { name: "UniPool", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open source reference", exact: true }),
  ).toHaveAttribute("href", "https://github.com/ACM-VIT/unipool-webapp");
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("heading", { name: "Code 2 Create", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Home");
  await choose(page, "TECH");
  await page
    .getByRole("button", { name: "Begin application", exact: true })
    .click();
  await identity(page);
  await register(page, "Second Player");
  await page.reload();
  await choose(page, "MY CONSOLE");
  await expect(
    page.getByText("No application started", { exact: true }),
  ).toHaveCount(5);
  expect(
    await page.evaluate(
      (id) =>
        JSON.parse(localStorage.getItem(`ocs:console:v2:${id}`)!).applications
          .tech.applicant.registration,
      first.id,
    ),
  ).toBe("26BCE0001");
  await page
    .getByRole("button", { name: "Open control center", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reset local progress", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Keep progress", exact: true })
    .click();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page.locator("[data-console-home]")).toBeVisible();
  await expect(page.locator(".console-statusbar")).toContainText(
    "GUEST SESSION",
  );
});

test("WebGPU renders the retained room; mobile console stays usable", async ({
  page,
}, info) => {
  await enter(page, "");
  await expect(page.locator(".room-stage")).toHaveAttribute(
    "data-renderer",
    /WebGPU|WebGL 2/,
  );
  console.log(
    "Room renderer",
    await page.locator(".room-stage").getAttribute("data-renderer"),
  );
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(
      page.getByRole("button", { name: "Enter domain", exact: true }),
    ).toBeInViewport();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".flat-console [data-console-home]")).toBeVisible();
  await choose(page, "TECH");
  await page
    .getByRole("button", { name: "Begin application", exact: true })
    .click();
  await identity(page);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByLabel("Your answer", { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("mobile-application.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.getByRole("button", { name: "Controller", exact: true }).click();
  await page.getByRole("button", { name: "Back", exact: true }).last().click();
  await expect(
    page.getByRole("heading", { name: "First, your introduction." }),
  ).toBeVisible();
});

test("unavailable browser storage reports failure without pretending to submit", async ({
  page,
}) => {
  await register(page);
  await enter(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key.startsWith("ocs:console:v2:"))
        throw new DOMException("Storage disabled", "QuotaExceededError");
      original.call(this, key, value);
    };
  });
  await choose(page, "TECH");
  await page
    .getByRole("button", { name: "Begin application", exact: true })
    .click();
  await identity(page);
  await expect(
    page.getByText("Storage is unavailable.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  for (let i = 0; i < 4; i++) {
    await page
      .getByLabel("Your answer", { exact: true })
      .fill("A thoughtful answer retained in memory.");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  }
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Save submission", exact: true })
    .click();
  await expect(
    page.getByText("Your submission could not be saved.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator("[data-application-complete]")).toHaveCount(0);
});
