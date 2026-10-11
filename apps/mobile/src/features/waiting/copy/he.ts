// The waiting screen (PRD §4.1). `overdueMessage` is TEMPORARY copy from the owner. `title`, `readyTitle`,
// `message` + `messageNote`, the unit labels and `enableNotifications` are the owner's wording (waiting design
// update). DRAFT Hebrew for the rest (phase-15 report).
export const he = {
  title: 'התוכנית שלך בהכנה',
  readyTitle: 'התוכנית שלך מוכנה!',
  message: 'המאמנת שלך בונה לך תוכנית אישית.',
  // The second sentence of the same line, shown stronger.
  messageNote: 'נעדכן אותך ברגע שהיא מוכנה.',
  overdueMessage: 'המאמנת שלך מוסיפה את הנגיעות האחרונות לתוכנית. תקבלי התראה ברגע שהיא תהיה מוכנה.',
  countdownLabel: 'הזמן שנותר',
  hours: 'שעות',
  minutes: 'דקות',
  seconds: 'שניות',
  enableNotifications: 'הפעילי התראות',
} as const;
