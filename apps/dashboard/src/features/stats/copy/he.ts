// The Statistics page (coach dashboard design). The wording comes from the approved design
// (docs/design/coach-dashboard.html); lines marked PLACEHOLDER are not in it and wait for the owner.
export const he = {
  title: 'סטטיסטיקה',
  subtitle: 'איך העסק וההתמדה של המתאמנות מתקדמים',
  loadError: 'לא הצלחנו לטעון את הסטטיסטיקה.', // PLACEHOLDER
  rangeLabel: 'טווח זמן',
  ranges: { months3: '3 חודשים', months6: '6 חודשים', months12: 'שנה' },
  tiles: {
    active: 'מתאמנות פעילות',
    activeChange: 'החודש',
    newThisMonth: 'מתאמנות חדשות החודש',
    newChange: 'מהחודש שעבר',
    completion: 'ביצוע אימונים ממוצע',
    completionNote: 'מתוך האימונים שתוכננו',
    timeToPlan: 'זמן ממוצע עד תוכנית',
    timeToPlanNote: 'מתוך חלון של 48 שעות',
    hours: 'שע׳',
  },
  active: {
    title: 'מתאמנות פעילות',
    subtitle: 'בסוף כל חודש',
    label: 'מתאמנות פעילות לפי חודש',
    unit: 'מתאמנות',
  },
  weekly: {
    title: 'אימונים שבוצעו בשבוע',
    subtitle: '8 השבועות האחרונים',
    label: 'אימונים שבוצעו בשבוע',
    unit: 'אימונים',
  },
  goals: {
    title: 'מטרות המתאמנות',
    subtitle: 'מתוך {count} מתאמנות פעילות',
    empty: 'עדיין אין מטרות להצגה.', // PLACEHOLDER
  },
  retention: {
    title: 'שימור מתאמנות',
    subtitle: 'כמה עדיין פעילות אחרי…',
    month1: 'חודש',
    month3: '3 חודשים',
    month6: '6 חודשים',
    rating: 'דירוג אימון ממוצע',
    // For screen readers and the cell's tooltip. PLACEHOLDER
    count: '{retained} מתוך {eligible}',
  },
  // "label: value" lines read by screen readers under each chart.
  dataPoint: '{label}: {value}',
} as const;
