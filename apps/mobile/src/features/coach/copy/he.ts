// Coach mode on the phone (Phase 6b): the light plan actions. Texts both apps show are in the shared
// copy (coach.*). DRAFT Hebrew of the English placeholders (phase-15 report).
export const he = {
  plansLoadError: 'לא הצלחנו לטעון את התוכניות.',
  publishError: 'לא הצלחנו לפרסם את התוכנית. נסי שוב.',
  copySavedNotPublished: 'העותק נשמר כטיוטה, אבל לא פורסם. {message}',
  publishPlan: 'פרסום התוכנית',
  noPlanThisWeek: 'עדיין אין תוכנית לשבוע הזה.',
  duplicateLastWeek: 'שכפול השבוע שעבר ופרסום',
  fixOnDashboard: 'תקני את זה בדשבורד, ואז פרסמי.',
  plansOnDashboard: 'בונים ועורכים תוכניות בדשבורד, במחשב.',
  confirmDuplicateTitle: 'לשכפל ולפרסם?',
  confirmPublishTitle: 'לפרסם את התוכנית הזו?',
  confirmDuplicateMessage: 'התוכנית האחרונה של {name} תועתק ל־{week} ותפורסם. המתאמנת תקבל התראה.',
  confirmPublishMessage: '{name} תראה את התוכנית של {week}. המתאמנת תקבל התראה.',
  duplicateConfirm: 'שכפול ופרסום',
  publishConfirm: 'פרסום',
  nutritionLoadError: 'לא הצלחנו לטעון את תוכנית התזונה.',
  // Owner's wording (docs/phase-reports/design-coach-link.md).
  openFullDashboard: 'פתחי את הדשבורד המלא',
} as const;
