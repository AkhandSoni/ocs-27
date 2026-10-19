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
  await page.goto(renderer ? `/?renderer=${renderer}` : "/");
  await continueStartup(page);
  await expect(page.locator("[data-console-home]")).toBeVisible();
  await expect(page.locator(".room-stage")).toHaveAttribute(
    "data-renderer",
    /WebGPU|WebGL 2/,
  );
}
async function continueStartup(page: Page) {
  const skip = page.getByRole("button", { name: /Skip startup/ });
  if (await skip.isVisible().catch(() => false))
    await skip.click({ force: true });
  await page
    .getByRole("button", { name: /Continue as guest|Continue to console/ })
    .click();
  await expect(page.locator(".startup-screen")).toHaveCount(0);
  await expect(page.locator('[data-console-stage="boot"]')).toHaveCount(0);
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

test("reference opening reaches player selection and accepts startup authentication", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?renderer=webgl");
  await expect(page.locator('[data-console-stage="boot"]')).toBeVisible();
  await expect(page.locator(".boot-emblem .acm-symbol")).toBeVisible();
  await page.screenshot({ path: info.outputPath("opening-logo.png") });
  await expect.poll(() => page.locator(".boot-message").evaluate((node) => getComputedStyle(node).opacity)).toBe("1");
  await expect(page.locator(".boot-emblem")).toHaveCSS("opacity", "0");
  await page.screenshot({ path: info.outputPath("opening-message.png") });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: info.outputPath("opening-sweep.png") });
  await expect(page.getByRole("heading", { name: "Welcome Back to ACM-VIT" })).toBeVisible();
  await expect(page.locator(".console-surface")).toHaveCSS("opacity", "0");
  await expect(page.getByRole("button", { name: "Continue as guest", exact: true })).toBeFocused();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: info.outputPath("opening-players.png") });
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("button", { name: "Add user", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Email address", { exact: true })).toBeFocused();
  await page.screenshot({ path: info.outputPath("opening-signin.png") });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Continue as guest", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Add user", exact: true }).click();
  await page.getByRole("button", { name: "New player? Create an account", exact: true }).click();
  await page.getByLabel("Display name", { exact: true }).fill("Opening Explorer");
  await page.getByLabel("Email address", { exact: true }).fill(`${randomUUID()}@prototype.test`);
  await page.getByLabel("Password", { exact: true }).fill("console-prototype-password");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.locator(".startup-screen")).toHaveCount(0);
  await expect(page.locator(".console-statusbar")).toContainText("LOCAL PLAYER");
  await expect(page.locator(".console-surface")).toHaveCSS("opacity", "1");
});

test("short skippable startup opens an original guest console and five domains", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?renderer=webgl");
  await expect(page.locator('[data-console-stage="boot"]')).toBeVisible();
  await page.screenshot({
    path: info.outputPath("startup.png"),
  });
  await page
    .getByRole("button", { name: /Skip startup/ })
    .click({ force: true, timeout: 800 })
    .catch(() => {});
  await expect(page.locator(".startup-screen")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Welcome Back to ACM-VIT" }),
  ).toBeVisible();
  await page.waitForTimeout(700);
  await page.screenshot({ path: info.outputPath("login.png") });
  await page
    .getByRole("button", { name: "Continue as guest", exact: true })
    .click();
  await expect(page.locator(".startup-screen")).toHaveCount(0);
  await expect(page.locator("[data-console-home]")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".room-stage")).toHaveAttribute(
    "data-renderer",
    "WebGL 2",
  );
  await expect(page.locator(".cartridge")).toHaveCount(8);
  await expect(page.locator(".console-home img")).toHaveCount(0);
  await expect(page.locator(".game-capabilities")).toContainText("Web & App");
  await expect(page.locator(".console-home canvas")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("home.png") });
  for (const [id, name] of [
    ["tech", "TECH"],
    ["research", "RESEARCH"],
    ["management", "MANAGEMENT"],
    ["design", "DESIGN"],
    ["cc", "COMPETITIVE CODING"],
  ]) {
    const cartridge = page.getByRole("button", {
      name: `Select ${name}`,
      exact: true,
    });
    await cartridge.focus();
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("button", { name: "Begin application", exact: true }),
    ).toBeVisible();
    await page.screenshot({ path: info.outputPath(`hub-${id}.png`) });
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

test("physical console powers off to TV static and the complete controller works", async ({
  page,
}) => {
  await enter(page);
  await page.getByRole("button", { name: "Room view" }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Console power", exact: true }).click();
  await expect(page.getByRole("heading", { name: "System off" })).toBeVisible();
  await expect(page.locator(".tv-static canvas")).toBeVisible();
  await page.getByRole("button", { name: "Power on" }).click();
  await continueStartup(page);
  await expect(page.locator("[data-console-home]")).toBeVisible();

  await page.getByRole("button", { name: "Controller", exact: true }).click();
  await expect(page.locator(".virtual-controller button")).toHaveCount(25);
  await page
    .getByRole("button", { name: "L2 trigger · Previous", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Options · Control center", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Control center" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Turn off console/ }).click();
  await expect(page.getByRole("heading", { name: "System off" })).toBeVisible();
  await page.getByRole("button", { name: "Power on" }).click();
  await continueStartup(page);
  await expect(page.locator("[data-console-home]")).toBeVisible();
});

test("every virtual controller button emits its assigned console action", async ({ page }) => {
  await enter(page);
  await page.getByRole("button", { name: "Controller", exact: true }).click();
  await page.evaluate(() => {
    const actions: string[] = [];
    window.addEventListener("ocs:controller-action", (event) => {
      actions.push((event as CustomEvent<string>).detail);
      event.stopImmediatePropagation();
    }, true);
    Object.assign(window, { __controllerActions: actions });
  });
  const mapped = [
    ["L2 trigger · Previous", "left"], ["L1 · Previous", "left"],
    ["R1 · Next", "right"], ["R2 trigger · Next", "right"],
    ["D-pad up", "up"], ["D-pad left", "left"], ["D-pad right", "right"],
    ["D-pad down", "down"], ["Create · Help", "help"],
    ["Touchpad · Console home", "home"], ["Options · Control center", "system"],
    ["Left stick click · Select", "confirm"], ["Right stick click · Select", "confirm"],
    ["Left stick up", "up"], ["Left stick down", "down"],
    ["Left stick left", "left"], ["Left stick right", "right"],
    ["Right stick up", "up"], ["Right stick down", "down"],
    ["Right stick left", "left"], ["Right stick right", "right"],
    ["Square · Back", "back"], ["Triangle · Home", "home"],
    ["Circle · Back", "back"], ["Cross · Select", "confirm"],
  ] as const;
  for (const [label] of mapped) {
    const button = page.getByRole("button", { name: label, exact: true });
    await button.hover();
    await page.mouse.down();
    await expect(button).toHaveAttribute("data-pressed", "true");
    await expect(page.locator('.virtual-controller button[data-pressed="true"]')).toHaveCount(1);
    await expect(page.locator('.physical-controller button[data-pressed="true"]')).toHaveCount(1);
    await page.mouse.up();
    await expect(page.locator('.virtual-controller button[data-pressed="true"]')).toHaveCount(0);
    await expect(page.locator('.physical-controller button[data-pressed="true"]')).toHaveCount(0);
  }
  expect(await page.evaluate(() => (window as Window & { __controllerActions?: string[] }).__controllerActions)).toEqual(
    mapped.map(([, action]) => action),
  );
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
  await continueStartup(page);
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
    .getByRole("button", { name: "Room controller D-pad right", exact: true })
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
  await continueStartup(page);
  await choose(page, "MANAGEMENT");
  await page
    .getByRole("button", { name: "Begin application", exact: true })
    .click();
  await expect(
    page.getByLabel("VIT registration number", { exact: true }),
  ).toHaveValue("26BCE0001");
});

test("standard Gamepad API keeps polling and maps triggers, sticks, and select", async ({
  page,
}) => {
  await enter(page);
  await page.evaluate(() => {
    const fakePad = {
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 18 }, () => ({ pressed: false, value: 0 })),
      connected: true,
      id: "ACM test controller",
      index: 0,
      mapping: "standard",
      timestamp: 0,
    };
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [fakePad],
    });
    (window as unknown as { __fakePad: typeof fakePad }).__fakePad = fakePad;
    window.dispatchEvent(new Event("gamepadconnected"));
  });
  await page.waitForTimeout(100);
  await page.evaluate(() => {
    type FakePad = {
      axes: number[];
      buttons: { pressed: boolean; value: number }[];
    };
    (window as unknown as { __fakePad: FakePad }).__fakePad.buttons[7] = {
      pressed: true,
      value: 1,
    };
  });
  await expect(
    page.getByRole("button", { name: "Select RESEARCH", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.evaluate(() => {
    type FakePad = {
      axes: number[];
      buttons: { pressed: boolean; value: number }[];
    };
    const pad = (window as unknown as { __fakePad: FakePad }).__fakePad;
    pad.buttons[7] = { pressed: false, value: 0 };
    pad.axes[0] = 0.9;
  });
  await expect(
    page.getByRole("button", { name: "Select MANAGEMENT", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.evaluate(() => {
    type FakePad = {
      axes: number[];
      buttons: { pressed: boolean; value: number }[];
    };
    const pad = (window as unknown as { __fakePad: FakePad }).__fakePad;
    pad.axes[0] = 0;
    pad.buttons[0] = { pressed: true, value: 1 };
  });
  await expect(page.locator('[data-domain="management"]')).toBeVisible();
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
  await continueStartup(page);
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
  await continueStartup(page);
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
      page.getByRole("button", { name: "Select TECH", exact: true }),
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
  await page
    .getByRole("button", { name: "Circle · Back", exact: true })
    .click();
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


test("focus enlarges the TV with the room behind it and keyboard feedback identifies the held controller key", async ({ page }, info) => {
  await enter(page);
  await expect(page.getByRole("button", { name: "Console power", exact: true })).toBeHidden();
  await expect(page.locator(".physical-controller")).toBeHidden();
  await expect(page.locator(".room-stage")).toHaveAttribute("data-room-visible", "true");
  await page.getByRole("button", { name: "Controller", exact: true }).click();
  await page.locator(".ocs-console").focus();
  const mappings = [["ArrowRight", "right"], ["q", "l1"], ["e", "r1"], ["z", "l2"], ["c", "r2"]];
  for (const [key, control] of mappings) {
    await page.keyboard.down(key);
    await expect(page.locator(`.virtual-controller .pad-${control}`)).toHaveAttribute("data-pressed", "true");
    await expect(page.locator('.virtual-controller button[data-pressed="true"]')).toHaveCount(1);
    await page.keyboard.up(key);
    await expect(page.locator('.virtual-controller button[data-pressed="true"]')).toHaveCount(0);
  }
  await page.keyboard.down("ArrowLeft");
  await page.screenshot({ path: info.outputPath("focus-key-feedback.png") });
  await page.keyboard.up("ArrowLeft");
  await page.getByRole("button", { name: "Close controller", exact: true }).click();
  await page.getByRole("button", { name: "Room view", exact: true }).click();
  await expect(page.getByRole("button", { name: "Console power", exact: true })).toBeVisible();
  await expect(page.locator(".physical-controller")).toBeVisible();
  await page.screenshot({ path: info.outputPath("room.png") });
  await page.getByRole("button", { name: "Focus console", exact: true }).click();
  await expect(page.locator(".physical-controller")).toBeHidden();
  await page.screenshot({ path: info.outputPath("focus-tv.png") });
});

test("physical domain discs launch the real OCS experience and preserve contextual form back", async ({ page }, info) => {
  await enter(page);
  await page.getByRole("button", { name: "Domain discs", exact: true }).click();
  const research = page.getByRole("button", { name: "Select Research case", exact: true });
  await expect(research).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(research).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({ path: info.outputPath("domain-discs.png") });
  await page.keyboard.press("Enter");
  await expect(page.locator('.domain-app[data-domain="research"]')).toBeVisible();
  await page.getByRole("button", { name: "Tools", exact: true }).click();
  await expect(page.getByText("Jupyter", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Begin application", exact: true }).click();
  await expect(page.locator('[data-console-screen="apply"]')).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-console-screen="domain"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Eject disc", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Eject disc", exact: true }).click();
  await expect(page.getByRole("button", { name: "Domain discs", exact: true })).toBeVisible();
  await expect(page.locator("[data-console-home]")).toBeVisible();
  // Loaded discs must not lock the camera or disable the room controls.
  // The physical disc ID differs from the application ID for CC.
  await page.getByRole("button", { name: "Domain discs", exact: true }).click();
  const coding = page.getByRole("button", { name: "Select Competitive Coding case", exact: true });
  await expect(coding).toBeVisible();
  // Cases overlap physically. Click an actually exposed part of the cover,
  // rather than the bounding-box center behind the foremost case.
  const exposed = await coding.evaluate(button => {
    const box = button.getBoundingClientRect();
    for (const x of [.9, .8, .7, .95, .6, .5, .3, .1]) for (const y of [.5, .3, .7, .15, .85]) {
      const target = document.elementFromPoint(box.x + box.width * x, box.y + box.height * y);
      if (target?.closest("button") === button) return { x: box.width * x, y: box.height * y };
    }
    return null;
  });
  expect(exposed, "each fanned case has an exposed, clickable cover edge").not.toBeNull();
  await coding.click({ position: exposed! });
  await expect(coding).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(100);
  await coding.click();
  await expect(page.locator('.domain-app[data-domain="cc"]')).toBeVisible();
  await page.getByRole("button", { name: "Room view", exact: true }).click();
  await expect(page.getByRole("button", { name: "Console power", exact: true })).toBeVisible();
  await expect(page.locator(".physical-controller")).toBeVisible();
  await page.screenshot({ path: info.outputPath("room-with-loaded-disc.png") });
  await page.getByRole("button", { name: "Focus console", exact: true }).click();
  await page.keyboard.press("Home");
  await page.evaluate(() => {
    const phases: string[] = [];
    const stage = document.querySelector(".room-stage")!;
    new MutationObserver(records => records.forEach(record => {
      if (record.oldValue) phases.push(record.oldValue);
    })).observe(stage, { attributes: true, attributeFilter: ["data-domain-phase"], attributeOldValue: true });
    Object.assign(window, { __discPhases: phases });
  });
  await choose(page, "DESIGN");
  await expect(page.locator('.domain-app[data-domain="design"]')).toBeVisible();
  const phases = await page.evaluate(() => (window as unknown as { __discPhases: string[] }).__discPhases);
  expect(phases).toContain("returning");
  expect(phases.indexOf("returning")).toBeLessThan(phases.lastIndexOf("opening"));
  await page.getByRole("button", { name: "Room view", exact: true }).click();
  await expect(page.getByRole("button", { name: "Console power", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Console home", exact: true }).click();
  await choose(page, "TECH");
  await expect(page.locator('.domain-app[data-domain="tech"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Focus console", exact: true })).toBeVisible();
  await expect(page.locator(".physical-controller")).toBeVisible();
});


test('domain tiles launch directly and clicking away dismisses the physical chooser', async ({ page }) => {
  await enter(page);
  await expect(page.getByRole("button", { name: "Enter domain", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Domain discs", exact: true }).click();
  await expect(page.locator('.domain-case-target[aria-pressed="true"]')).toBeVisible();
  const boxes = await page.locator('.domain-case-target').evaluateAll(nodes => nodes.map(node => {
    const box = node.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height };
  }));
  const leftmost = boxes.sort((a, b) => a.x - b.x)[0];
  await page.mouse.click(leftmost.x - 10, leftmost.y + leftmost.height / 2);
  await expect(page.locator('.room-stage')).toHaveAttribute('data-domain-phase', 'choosing');
  await page.mouse.click(25, 100);
  await expect(page.locator('.room-stage')).toHaveAttribute('data-domain-phase', 'idle');
  await expect(page.locator('[data-console-home]')).toBeVisible();
  await choose(page, 'TECH');
  await expect(page.locator('.domain-app[data-domain="tech"]')).toBeVisible();
});
