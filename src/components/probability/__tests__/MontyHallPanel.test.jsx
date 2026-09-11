/** @vitest-environment jsdom */

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MontyHallPanel from '../MontyHallPanel';
import ProbabilityParadoxes from '../ProbabilityParadoxes';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mountedRoots = [];

async function render(element) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  mountedRoots.push({ container, root });
  await act(async () => root.render(element));
  return container;
}

afterEach(async () => {
  while (mountedRoots.length) {
    const { container, root } = mountedRoots.pop();
    await act(async () => root.unmount());
    container.remove();
  }
  vi.restoreAllMocks();
});

function panelProps(doorCount = 3, gameState = 'start') {
  return {
    darkMode: false,
    doorInput: String(doorCount),
    handleMontyFinal: vi.fn(),
    handleMontyPick: vi.fn(),
    resetMonty: vi.fn(),
    setDoorInput: vi.fn(),
    setMontyState: vi.fn(),
    montyState: {
      doors: Array.from({ length: doorCount }, (_, i) => i === 0 ? 'car' : 'goat'),
      selected: gameState === 'start' ? null : 1,
      revealed: gameState === 'start' ? [] : gameState === 'picked' ? [2] : [0, 1, 2],
      gameState,
      win: false,
      doorCount,
      history: { stayWins: 0, switchWins: 0, stayTotal: 0, switchTotal: 0 },
    },
  };
}

const doorsIn = (container) => [...container.querySelectorAll('button[aria-label^="Door "]')];
const buttonNamed = (container, name) => [...container.querySelectorAll('button')].find((button) => button.textContent.trim() === name);

describe('Monty Hall door accessibility', () => {
  it.each([3, 10, 30, 100])('makes all %i doors named, focusable native buttons without exposing the prize', async (count) => {
    const props = panelProps(count);
    const container = await render(<MontyHallPanel {...props} />);
    const doors = doorsIn(container);

    expect(doors).toHaveLength(count);
    doors.forEach((door, index) => {
      expect(door.type).toBe('button');
      expect(door.disabled).toBe(false);
      expect(door.tabIndex).toBe(0);
      expect(door.getAttribute('aria-label')).toBe(`Door ${index + 1}, closed`);
      door.focus();
      expect(document.activeElement).toBe(door);
    });

    // jsdom does not synthesize native Enter/Space activation; verify the
    // native button click path here and actual keystrokes in browser review.
    await act(async () => doors.at(-1).click());
    expect(props.handleMontyPick).toHaveBeenCalledExactlyOnceWith(count - 1);
  });

  it.each(['picked', 'result'])('disables selection and names only revealed contents during %s', async (state) => {
    const props = panelProps(3, state);
    const container = await render(<MontyHallPanel {...props} />);
    const doors = doorsIn(container);

    expect(doors).toHaveLength(3);
    expect(doors[0].getAttribute('aria-label')).toBe(`Door 1, ${state === 'result' ? 'car' : 'closed'}`);
    expect(doors[1].getAttribute('aria-label')).toBe(`Door 2, ${state === 'result' ? 'goat' : 'closed'}, selected`);
    expect(doors[2].getAttribute('aria-label')).toBe('Door 3, goat');
    for (const door of doors) {
      expect(door.disabled).toBe(true);
      await act(async () => door.click());
    }
    expect(props.handleMontyPick).not.toHaveBeenCalled();
  });

  it.each([false, true])('provides an explicit focus indicator with darkMode=%s', async (darkMode) => {
    const container = await render(<MontyHallPanel {...panelProps()} darkMode={darkMode} />);
    expect(doorsIn(container)).toHaveLength(3);
    for (const door of doorsIn(container)) {
      expect(door.classList.contains('focus-visible:outline-2')).toBe(true);
      expect(door.classList.contains('focus-visible:outline-offset-2')).toBe(true);
      expect(door.classList.contains(darkMode ? 'focus-visible:outline-indigo-300' : 'focus-visible:outline-indigo-700')).toBe(true);
    }
  });

  it.each([
    ['STAY (Gut)', 'YOU GOT A GOAT...', 'Door 2, goat, selected'],
    ['SWITCH (Math)', 'YOU WON THE CAR!', 'Door 1, car, selected'],
  ])('preserves reveal, %s, and replay behavior', async (choice, result, selectedLabel) => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const container = await render(<ProbabilityParadoxes darkMode={false} />);
    await act(async () => doorsIn(container)[1].click());

    expect(container.textContent).toContain('Monty revealed 1 goats! Stay or Switch?');
    expect(doorsIn(container).every((door) => door.disabled)).toBe(true);
    await act(async () => buttonNamed(container, choice).click());
    expect(container.textContent).toContain(result);
    expect(container.querySelector(`[aria-label="${selectedLabel}"]`)).not.toBeNull();
    expect(container.textContent).toContain('Games: 1');

    await act(async () => buttonNamed(container, 'Play Again').click());
    expect(doorsIn(container).every((door) => !door.disabled)).toBe(true);
    expect(doorsIn(container).every((door) => door.getAttribute('aria-label').endsWith(', closed'))).toBe(true);
    expect(container.textContent).not.toContain(result);
    expect(container.textContent).toContain('Games: 1');
  });
});
