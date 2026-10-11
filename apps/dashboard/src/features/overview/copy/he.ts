import { plural } from '@sistem/shared';

// The Overview page (coach dashboard design). The wording comes from the approved design
// (docs/design/coach-dashboard.html) and the owner's brief; lines marked PLACEHOLDER are not in
// either and wait for the owner.
export const he = {
  // Only "ערב טוב" is in the design; the other three are PLACEHOLDERS.
  greeting: {
    morning: 'בוקר טוב, {name}',
    afternoon: 'צהריים טובים, {name}',
    evening: 'ערב טוב, {name}',
    night: 'לילה טוב, {name}',
  },
  weekLine: 'שבוע {week} · {date}',
  activeTrainees: 'מתאמנות פעילות',
  newThisMonth: 'מתאמנות חדשות החודש',
  loadError: 'לא הצלחנו לטעון את הסקירה.', // PLACEHOLDER
  completion: {
    title: 'ביצוע אימונים השבוע',
    caption: '{done} מתוך {planned} האימונים שתכננת בוצעו',
    empty: 'אין אימונים מתוכננים השבוע', // PLACEHOLDER
    weeks: '8 שבועות אחרונים',
  },
  waiting: {
    title: 'מחכות לתוכנית',
    window: 'חלון 48 השעות',
    more: 'ועוד {count}', // PLACEHOLDER
  },
  pump: {
    // The feature's name, the same in both languages.
    title: 'Daily Pump',
    subtitle: 'תמונות חדשות מהאימונים',
    newSince: 'חדשות מאז אתמול',
  },
  board: {
    title: 'השבוע של המתאמנות',
    subtitle: '7 הימים האחרונים',
    today: 'היום',
    done: 'בוצע',
    planned: 'מתוכנן',
    missed: 'פוספס',
    allTrainees: 'לכל המתאמנות',
    empty: 'אין אימונים מתוכננים ב־7 הימים האחרונים.', // PLACEHOLDER
  },
  activity: {
    title: 'פעילות אחרונה',
    subtitle: 'מה קרה בשעות האחרונות',
  },
  ending: {
    title: 'תוכניות שנגמרות השבוע',
    subtitle: 'הגיע הזמן לבנות את השבוע הבא',
    daysLeft: plural({ one: 'עוד יום אחד', two: 'עוד יומיים', other: 'עוד {count} ימים' }),
    endsToday: 'נגמרת היום', // PLACEHOLDER
    workouts: '{done} / {planned} אימונים',
    buildNext: 'לבניית השבוע הבא',
  },
} as const;
