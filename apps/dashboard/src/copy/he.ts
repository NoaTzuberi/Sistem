// The dashboard's own texts that belong to no feature (top bar, login). Hebrew = primary;
// DRAFT translations for the owner's review (phase-15 report).
export const he = {
  // The sidebar (coach dashboard design). Pages keep their own existing names (trainees, the
  // exercise library, the nutrition pages); these are the group labels and the new entries.
  nav: {
    main: 'ראשי',
    trainees: 'מתאמנות',
    nutrition: 'תזונה',
    training: 'אימונים',
    overview: 'סקירה',
    stats: 'סטטיסטיקה',
    allTrainees: 'כל המתאמנות',
    waiting: 'מחכות לתוכנית',
  },
  shell: {
    collapse: 'כיווץ התפריט',
    expand: 'הרחבת התפריט',
    menu: 'תפריט',
    search: 'חיפוש',
    coach: 'מאמנת',
    // {count} is spoken after the item's name: "מחכות לתוכנית, 2".
    badge: '{label}, {count}',
  },
  // The ⌘K palette. `pickTrainee` and `empty` are PLACEHOLDERS (not in the design's wording list).
  palette: {
    placeholder: 'חיפוש מתאמנת, מסך או פעולה',
    pickTrainee: 'תוכנית חדשה — לאיזו מתאמנת?',
    empty: 'לא נמצא. נסי שם של מתאמנת או של מסך.',
    screens: 'מסכים',
    actions: 'פעולות',
  },
  email: 'אימייל',
  password: 'סיסמה',
  loggingIn: 'מתחברת…',
  // The login screen (coach login design update) — the owner's wording, except where marked.
  login: {
    badge: 'COACH',
    // Around the brand word "Sisterhood", which stays in English: "ה-Sisterhood שלך."
    headlineBefore: 'ה-',
    headlineAfter: ' שלך.',
    sub: 'ניהול מתאמנות, בניית תוכניות ומעקב אחרי ההתקדמות. הכל במקום אחד.',
    // The three captions are PLACEHOLDERS: the brief gave the titles only.
    features: {
      trainees: { title: 'מתאמנות', caption: 'כל המתאמנות שלך' },
      plans: { title: 'תוכניות', caption: 'תוכניות אימון שבועיות' },
      nutrition: { title: 'תזונה', caption: 'תוכניות תזונה' },
    },
    title: 'כניסת מאמנת',
    subtitle: 'התחברי כדי לנהל את המתאמנות שלך',
    forgot: 'שכחתי',
    rememberMe: 'השאירי אותי מחוברת',
    submit: 'כניסה לדשבורד',
    traineePrompt: 'מתאמנת?',
    traineeLink: 'הכניסה שלך באפליקציה',
  },
  coachOnly: 'הדשבורד הזה מיועד לחשבונות מאמנת בלבד.',
  loginFailed: 'ההתחברות נכשלה. נסי שוב.',
  languageSaveError: 'לא הצלחנו לשמור את השפה. נסי שוב.',
} as const;
