import { describe, expect, it } from 'vitest';
import { MATH_TERMS } from '../mathTerms';

describe('math term content', () => {
  it('expresses coefficient of variation using the absolute mean and a percentage', () => {
    expect(MATH_TERMS.CV.calc).toBe('({s} / |{x\u0304}|) \u00d7 100%');
    expect(MATH_TERMS['x\u0304'].title).toBe('Arithmetic Mean');
  });

  it('contains no common mojibake markers in term keys or content', () => {
    // UTF-8 misread as Windows-1252/Latin-1, or replacement characters.
    const mojibake = /[\u00c2\u00c3\u00cc\u00ce\u00cf\u00e2\u00f0\ufffd]/u;
    for (const [key, term] of Object.entries(MATH_TERMS)) {
      expect(key, `term key: ${key}`).not.toMatch(mojibake);
      for (const [field, value] of Object.entries(term)) {
        expect(value, `${key}.${field}`).not.toMatch(mojibake);
      }
    }
  });
});
