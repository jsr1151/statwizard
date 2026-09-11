import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, vi } from 'vitest';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const roots = [];

export async function render(element) {
  const container = document.createElement('main');
  document.body.append(container);
  const root = createRoot(container);
  roots.push({ root, container });
  await act(async () => root.render(element));
  return container;
}

export async function rerender(container, element) {
  const { root } = roots.find(entry => entry.container === container);
  await act(async () => root.render(element));
}

export function button(container, name) {
  const found = [...container.querySelectorAll('button')].find(node => node.textContent.trim() === name);
  expect(found, `Button: ${name}`).toBeTruthy();
  return found;
}

export async function click(container, name) {
  await act(async () => button(container, name).click());
}

export async function input(node, value) {
  expect(node).toBeTruthy();
  await act(async () => {
    const prototype = node.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(node, String(value));
    node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
}

export function field(container, name) {
  return [...container.querySelectorAll('input, select')].find(node =>
    node.getAttribute('aria-label') === name || [...(node.labels || [])].some(label => label.textContent.trim() === name));
}

afterEach(async () => {
  for (const { root, container } of roots.splice(0)) {
    await act(async () => root.unmount());
    container.remove();
  }
  vi.restoreAllMocks();
});
