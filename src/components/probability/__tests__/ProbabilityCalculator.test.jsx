/** @vitest-environment jsdom */
import React from 'react';
import { describe, expect, it } from 'vitest';
import ProbabilityPage from '../ProbabilityPage';
import { field, input, render, rerender } from './testUtils';

describe('probability calculator interactions', () => {
  it('preserves calculator entries while visiting another section', async () => {
    const view = await render(<ProbabilityPage section="calculator" darkMode={false} />);
    await input(field(view, 'Favorable'), 3);
    await rerender(view, <ProbabilityPage section="foundations" darkMode={false} />);
    await rerender(view, <ProbabilityPage section="calculator" darkMode={false} />);
    expect(field(view, 'Favorable').value).toBe('3');
    expect(view.textContent).toContain('50.00%');
  });
  it('renders valid defaults and recalculates edited probabilities', async () => {
    const view = await render(<ProbabilityPage section="calculator" darkMode={false} />);
    expect(view.textContent).toContain('16.67%');
    expect(view.textContent).toContain('24.609%');
    expect(view.textContent).toContain('Most likely sum: 7');
    await input(field(view, 'Favorable'), 3);
    expect(view.textContent).toContain('50.00%');
    await input(field(view, 'n'), 2);
    await input(field(view, 'k'), 1);
    await input(field(view, 'p'), 0.25);
    expect(view.textContent).toContain('37.500%');
  });

  it.each([
    ['n', -1], ['n', 2.5], ['n', ''],
    ['k', -1], ['k', 11], ['k', 1.5], ['k', ''],
    ['p', -0.1], ['p', 1.1], ['p', ''],
    ['Favorable', -1], ['Favorable', 7], ['Favorable', 1.5], ['Favorable', ''],
    ['Total', 0], ['Total', -1], ['Total', 2.5], ['Total', ''],
  ])('reports invalid %s=%s and recovers after correction', async (name, value) => {
    const view = await render(<ProbabilityPage section="calculator" darkMode />);
    const node = field(view, name);
    const initial = node.value;
    await input(node, value);
    expect(node.closest('section').textContent).toContain('Invalid');
    expect(node.getAttribute('aria-invalid')).toBe('true');
    await input(node, initial);
    expect(node.closest('section').textContent).not.toContain('Invalid');
    expect(node.getAttribute('aria-invalid')).toBe('false');
  });

  it('accepts zero and one probability boundaries and the empty binomial experiment', async () => {
    const view = await render(<ProbabilityPage section="calculator" darkMode={false} />);
    await input(field(view, 'Favorable'), 0);
    expect(view.textContent).toContain('0.00%');
    await input(field(view, 'k'), 0);
    await input(field(view, 'p'), 0);
    expect(view.textContent).toContain('100.000%');
    await input(field(view, 'n'), 0);
    expect(view.textContent).toContain('100.000%');
    await input(field(view, 'n'), 10);
    await input(field(view, 'k'), 10);
    await input(field(view, 'p'), 1);
    expect(view.textContent).toContain('100.000%');
  });
});
