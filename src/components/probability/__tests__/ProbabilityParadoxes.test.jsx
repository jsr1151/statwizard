/** @vitest-environment jsdom */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import ProbabilityParadoxes from '../ProbabilityParadoxes';
import { button, click, field, input, render } from './testUtils';

describe('probability paradox interactions', () => {
  it('aggregates deterministic Monty trials and starts a fresh history when door count changes', async () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    const view = await render(<ProbabilityParadoxes darkMode={false} />);
    let draws = 0;
    random.mockImplementation(() => draws++ % 2 === 0 ? 0 : 0.9);
    await click(view, 'Run 10k Sim');
    expect(view.textContent).toContain('Stay: 0.0%');
    expect(view.textContent).toContain('Switch: 100.0%');
    expect(view.textContent).toContain('Games: 20000');
    await input(field(view, 'Number of doors'), 10);
    await click(view, 'Set & Reset');
    expect(view.querySelectorAll('button[aria-label^="Door "]')).toHaveLength(10);
    expect(view.textContent).toContain('Games: 0');
  });

  it.each([['-2', 3], ['1000', 100], ['4.9', 4], ['', 3]])('normalizes door count %s to %i', async (value, count) => {
    const view = await render(<ProbabilityParadoxes darkMode={false} />);
    await input(field(view, 'Number of doors'), value);
    await click(view, 'Set & Reset');
    expect(view.querySelectorAll('button[aria-label^="Door "]')).toHaveLength(count);
    expect(field(view, 'Number of doors').value).toBe(String(count));
  });

  it('regenerates birthdays, reports 1,000 trials, and resets totals when group size changes', async () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    const view = await render(<ProbabilityParadoxes darkMode={false} />);
    await click(view, 'Birthday');
    expect(button(view, 'Birthday').getAttribute('aria-pressed')).toBe('true');
    expect(view.textContent).toContain('23 people share');
    let day = 0;
    random.mockImplementation(() => ((day++ % 365) + 0.5) / 365);
    await click(view, 'Generate another group');
    expect(view.textContent).toContain('No match in this group.');
    random.mockReturnValue(0);
    await click(view, 'Simulate 1,000 groups');
    expect(view.textContent).toMatch(/Empirical rate: 100\.00%/);
    expect(view.textContent).toContain('(1,000 matching groups out of 1,000)');
    await input(field(view, 'Group size'), 1);
    expect(view.textContent).toContain('Run the experiment to begin');
    await click(view, 'Simulate 1,000 groups');
    expect(view.textContent).toContain('(0 matching groups out of 1,000)');
  });

  it('records predictions and estimates 50% for the next flip after a streak', async () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    const view = await render(<ProbabilityParadoxes darkMode />);
    await click(view, 'Gambler');
    for (let i = 0; i < 4; i++) await click(view, 'Flip the coin');
    expect(view.textContent).toContain('4/4');
    await click(view, 'Tails');
    expect(button(view, 'Tails').getAttribute('aria-pressed')).toBe('true');
    await click(view, 'Flip the coin');
    expect(view.textContent).toContain('4/5');
    let flip = 0;
    random.mockImplementation(() => flip++ % 2 ? 0.75 : 0.25);
    await click(view, 'Simulate 1,000 next flips');
    expect(view.textContent).toContain('Heads occurred 50.0%');
    expect(view.textContent).toContain('H 500');
    expect(view.textContent).toContain('T 500');
    await click(view, 'Monty');
    await click(view, 'Gambler');
    expect(view.textContent).toContain('4/5');
  });
});
