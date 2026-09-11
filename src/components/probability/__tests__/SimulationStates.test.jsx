/** @vitest-environment jsdom */
import React, { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CoinSimulation from '../CoinSimulation';
import SpinnerSimulation from '../SpinnerSimulation';
import { button, click, field, input, render } from './testUtils';

afterEach(() => vi.useRealTimers());

describe('simulation state transitions', () => {
  it('finishes a coin flip after leaving its panel and permits another flip', async () => {
    vi.useFakeTimers();
    const view = await render(<CoinSimulation darkMode={false} />);
    await click(view, 'SINGLE FLIP');
    expect(button(view, 'SINGLE FLIP').disabled).toBe(true);
    await click(view, 'Binomial');
    await act(async () => vi.advanceTimersByTime(1000));
    await click(view, 'LLN');
    expect(button(view, 'SINGLE FLIP').disabled).toBe(false);
    await click(view, 'SINGLE FLIP');
    await click(view, 'Reset');
    expect(button(view, 'SINGLE FLIP').disabled).toBe(false);
  });

  it('honors zero spinner weights, handles an empty distribution, and restores fresh defaults', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const view = await render(<SpinnerSimulation darkMode={false} />);
    await click(view, 'SPIN THE WHEEL');
    expect(view.textContent).toContain('Last spin: WIN (10 points)');
    await click(view, 'EV/Sets');
    expect(view.textContent).toContain('1 Spins');
    await click(view, 'Weights');
    await input(field(view, 'Segment 1 weight'), 0);
    await click(view, 'Spin');
    expect(view.textContent).toContain('0.0% WIN');
    expect(view.textContent).toContain('33.3% LOSS');
    await click(view, 'EV/Sets');
    expect(view.textContent).toContain('0 Spins');
    await click(view, 'Weights');
    for (let i = 2; i <= 4; i++) await input(field(view, `Segment ${i} weight`), 0);
    await click(view, 'Spin');
    expect(button(view, 'SPIN THE WHEEL').disabled).toBe(true);
    expect(view.textContent).toContain('Set at least one positive segment weight');
    expect(view.textContent).not.toMatch(/NaN|Infinity/);
    await click(view, 'Weights');
    await input(field(view, 'Segment 2 weight'), 1);
    await click(view, 'Spin');
    expect(button(view, 'SPIN THE WHEEL').disabled).toBe(false);
    expect(view.textContent).toContain('100.0% LOSS');
    const fresh = await render(<SpinnerSimulation darkMode={false} />);
    expect(fresh.textContent).toContain('25.0% WIN');
    expect(fresh.textContent).toContain('25.0% LOSS');
  });
});
