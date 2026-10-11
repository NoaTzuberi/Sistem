import { describe, it, expect } from 'vitest';
import { findForeignTextIssues } from '../aiOutputText';

// Every AI reply (training and nutrition): only Hebrew, Latin, digits, punctuation and emoji.

describe('findForeignTextIssues', () => {
  it('accepts Hebrew, English, digits, punctuation and emoji', () => {
    const reply = {
      summary: 'שלושה אימונים בשבוע — 3 × 45 דק׳, מנוחה של 90 שנ׳ (8–12 חזרות).',
      nikud: 'שָׁלוֹם',
      english: 'Upper / Lower: "classic" split, 50% café & naïve; ~2.5 kg + 1°.',
      emoji: 'כל הכבוד 💪🏽🔥 👩‍👧 ❤️ ✅ → • … ₪',
      ids: ['full_body', 'F001', null, 3, true],
    };
    expect(findForeignTextIssues(reply)).toEqual([]);
  });

  it('reports where the text is and which characters, for letters and digits of other scripts', () => {
    const issues = findForeignTextIssues({
      splitOptions: [{ why: 'fine' }, { why: 'חלוקה קลาสית', pros: ['ok', 'Сила and 力'] }],
      considerations: ['٣ sets'],
    });
    expect(issues).toHaveLength(3);
    expect(issues[0]).toContain('splitOptions[1].why');
    expect(issues[0]).toContain('"ลาส"');
    expect(issues[0]).toContain('חלוקה קลาสית');
    expect(issues[1]).toContain('splitOptions[1].pros[1]');
    expect(issues[1]).toContain('"Сила", "力"');
    expect(issues[2]).toContain('considerations[0]');
  });

  it('lists only the first few when the whole reply is in another script', () => {
    const issues = findForeignTextIssues({ lines: Array.from({ length: 20 }, () => 'สวัสดี') });
    expect(issues).toHaveLength(5);
  });
});
