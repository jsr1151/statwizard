/** @vitest-environment jsdom */
import React from 'react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import ProbabilityPage from '../ProbabilityPage';
import { click, render } from './testUtils';

const views = [
  ['foundations', []], ['foundations', ['Rules']], ['foundations', ['Rules', 'Mutual Exclusivity']],
  ['calculator', []],
  ['simulations', []], ['simulations', ['Binomial']], ['simulations', ['EV Game']],
  ['simulations', ['Dice']], ['simulations', ['Dice', 'Sums']],
  ['simulations', ['Dice', 'CLT']], ['simulations', ['Dice', 'EV Game']],
  ['simulations', ['Spinner']], ['simulations', ['Spinner', 'Weights']], ['simulations', ['Spinner', 'EV/Sets']],
  ['demos', []], ['demos', ['Birthday']], ['demos', ['Gambler']], ['demos', ['Simpson']],
  ['demos', ['Cards']], ['demos', ['Cards', 'Hunt & Bet']], ['demos', ['Cards', 'Replace']],
  ['demos', ['Cards', 'Deck Tracker']], ['demos', ['Cards', 'Outs']], ['demos', ['Cards', 'Hi-Lo Count']],
];

describe.each([false, true])('probability accessibility (darkMode=%s)', darkMode => {
  it.each(views)('%s / %j has named controls and valid accessibility semantics', async (section, path) => {
    const view = await render(<ProbabilityPage section={section} darkMode={darkMode} />);
    for (const name of path) await click(view, name);
    const result = await axe.run(view, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
      // Contrast needs actual layout; this is checked separately in the browser.
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([]);
  });
});
