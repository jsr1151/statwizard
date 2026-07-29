/** @vitest-environment jsdom */

import React, { act } from "react";
import axe from "axe-core";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import Header from "../Header";
import MathTerm from "../MathTerm";
import UpdateToast from "../UpdateToast";
import MainMenu from "../../navigation/MainMenu";
import SearchView from "../../navigation/SearchView";
import ResultNavigation from "../../results/ResultNavigation";
import { PRODUCT } from "../../../config/product";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mountedRoots = [];

const render = async (element) => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(element);
  });

  mountedRoots.push({ container, root });
  return container;
};

const expectNoAccessibilityViolations = async (container) => {
  const results = await axe.run(container, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
    },
    rules: {
      "color-contrast": { enabled: false },
    },
  });

  expect(results.violations).toEqual([]);
};

afterEach(async () => {
  while (mountedRoots.length) {
    const { container, root } = mountedRoots.pop();
    await act(async () => root.unmount());
    container.remove();
  }
});

describe("shared component accessibility", () => {
  it("gives the application header named keyboard controls and toggle state", async () => {
    const container = await render(
      <Header
        onBack={() => {}}
        onHome={() => {}}
        canGoBack
        darkMode
        onToggleDarkMode={() => {}}
      />,
    );

    expect(
      container
        .querySelector('[aria-label="Switch to light mode"]')
        ?.getAttribute("aria-pressed"),
    ).toBe("true");
    expect(container.textContent).toContain(PRODUCT.displayVersion);
    expect(container.textContent).not.toMatch(/Alpha|BETA/);
    await expectNoAccessibilityViolations(container);
  });

  it("labels navigation and search controls", async () => {
    const menu = await render(
      <MainMenu onSelect={() => {}} darkMode={false} />,
    );
    const results = await render(
      <ResultNavigation
        activeSection="calculator"
        darkMode={false}
        onSelect={() => {}}
      />,
    );
    const search = await render(
      <SearchView
        onSelect={() => {}}
        darkMode={false}
        searchQuery=""
        setSearchQuery={() => {}}
      />,
    );

    expect(
      results.querySelector('[aria-current="page"]')?.textContent,
    ).toContain("Test Calculator");
    expect(search.querySelector('label[for="stat-search"]')?.textContent).toBe(
      "Search statistical modules and concepts",
    );
    await expectNoAccessibilityViolations(menu);
    await expectNoAccessibilityViolations(results);
    await expectNoAccessibilityViolations(search);
  });

  it("announces updates while keeping both actions named", async () => {
    const container = await render(
      <UpdateToast onReload={() => {}} onDismiss={() => {}} />,
    );

    expect(
      container.querySelector('[role="status"]')?.getAttribute("aria-live"),
    ).toBe("polite");
    await expectNoAccessibilityViolations(container);
  });

  it("makes explorable equation terms keyboard-operable", async () => {
    const onInfo = vi.fn();
    const onHover = vi.fn();
    const container = await render(
      <MathTerm
        term="n"
        onInfo={onInfo}
        onHover={onHover}
        darkMode={false}
        value={20}
        showValue
      />,
    );
    const term = container.querySelector("button");

    expect(term?.getAttribute("aria-label")).toMatch(/n: Total observations/);
    act(() => term.click());
    expect(onInfo).toHaveBeenCalledWith("n");
    await expectNoAccessibilityViolations(container);
  });
});
