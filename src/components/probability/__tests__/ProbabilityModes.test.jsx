/** @vitest-environment jsdom */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import ProbabilityPage from '../ProbabilityPage';
import ProbabilityCards from '../ProbabilityCards';
import CoinSimulation from '../CoinSimulation';
import { button, click, field, input, render } from './testUtils';

describe('probability modes and reset isolation', () => {
  it.each([
    ['foundations', 'Basics', 'Rules', 'Complement Rule'],
    ['simulations', 'Coin', 'Dice', 'Single Die'],
    ['simulations', 'Coin', 'Spinner', 'SPIN THE WHEEL'],
    ['demos', 'Paradoxes', 'Cards', 'Poker hand odds'],
  ])('switches %s from %s to %s with selected state', async (section, initial, next, content) => {
    const view = await render(<ProbabilityPage section={section} darkMode={false} />);
    expect(button(view, initial).getAttribute('aria-pressed')).toBe('true');
    await click(view, next);
    expect(button(view, initial).getAttribute('aria-pressed')).toBe('false');
    expect(button(view, next).getAttribute('aria-pressed')).toBe('true');
    expect(view.textContent).toContain(content);
  });

  it('selects every card mode and displays its instructions', async () => {
    const view = await render(<ProbabilityCards darkMode />);
    const modes = [
      ['Poker', 'Poker hand odds'], ['Hunt & Bet', 'Hunt and bet'],
      ['Replace', 'With or without replacement'], ['Deck Tracker', 'Deck tracker'],
      ['Outs', 'Poker outs'], ['Hi-Lo Count', 'Hi-Lo counting'],
    ];
    for (const [name, heading] of modes) {
      await click(view, name);
      expect(button(view, name).getAttribute('aria-pressed')).toBe('true');
      expect(view.textContent).toContain(heading);
      for (const [other] of modes.filter(([label]) => label !== name)) {
        expect(button(view, other).getAttribute('aria-pressed')).toBe('false');
      }
    }
  });

  it('clears card histories independently across modes', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.4);
    const view = await render(<ProbabilityCards darkMode={false} />);
    await click(view, 'Deal 5 Cards');
    expect(view.textContent).toContain('Hands recorded: 1');
    const pokerResults = view.textContent;
    await click(view, 'Deck Tracker');
    await click(view, 'REVEAL NEXT CARD');
    expect(view.textContent).toContain('Remaining: 51/52');
    await click(view, 'Hi-Lo Count');
    await click(view, 'Flip Card');
    expect(view.textContent).toContain('51 Cards Left');
    await click(view, 'Reset');
    expect(view.textContent).toContain('52 Cards Left');
    expect(view.textContent).toContain('Flip a Card');
    await click(view, 'Deck Tracker');
    expect(view.textContent).toContain('Remaining: 51/52');
    await click(view, 'Reset');
    expect(view.textContent).toContain('Remaining: 52/52');
    await click(view, 'Poker');
    expect(view.textContent).toBe(pokerResults);
    await click(view, 'Clear Stats');
    expect(view.textContent).toContain('Hands recorded: 0');
    await click(view, 'Deck Tracker');
    expect(view.textContent).toContain('Remaining: 52/52');
  });

  it('clears coin histories independently and preserves the other experiments', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.75);
    const view = await render(<CoinSimulation darkMode />);
    await click(view, '+10 FLIPS');
    const lln = view.textContent;
    await click(view, 'Binomial');
    await click(view, 'Run 1 Trial');
    expect(view.textContent).toContain('Trials: 1');
    await click(view, 'EV Game');
    await click(view, '+10 TRIALS');
    expect(view.textContent).toContain('(10 trials)');
    await click(view, 'Clear');
    expect(view.textContent).toContain('(0 trials)');
    await click(view, 'Binomial');
    expect(view.textContent).toContain('Trials: 1');
    await click(view, 'Reset History');
    expect(view.textContent).toContain('Trials: 0');
    await click(view, 'LLN');
    expect(view.textContent).toBe(lln);
    await click(view, 'Reset');
    expect(view.textContent).not.toBe(lln);
    expect(view.textContent).not.toContain('100%');
  });

  it('supports the complement endpoints and the replacement switch', async () => {
    const foundation = await render(<ProbabilityPage section="foundations" darkMode={false} />);
    await click(foundation, 'Rules');
    await input(field(foundation, 'Event probability'), 0);
    expect(field(foundation, 'Event probability').value).toBe('0');
    expect(foundation.textContent).toContain('0%');
    await input(field(foundation, 'Event probability'), 1);
    expect(field(foundation, 'Event probability').value).toBe('1');
    const cards = await render(<ProbabilityCards darkMode={false} />);
    await click(cards, 'Hunt & Bet');
    const toggle = cards.querySelector('[role="switch"]');
    expect(toggle.tagName).toBe('BUTTON');
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    await click(cards, toggle.textContent.trim());
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(cards.textContent).toContain('Binomial');
  });
});
