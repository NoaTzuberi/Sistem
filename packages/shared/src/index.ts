// Coach-side logic and display helpers used by both the web dashboard and the coach
// mode of the mobile app. No UI and no API calls: components stay in each app, calls
// in @sistem/api-client, contract types in @sistem/types (types only — this package
// holds runtime code, so the server never imports it).
export * from './format';
export * from './traineeStatus';
export * from './onboardingSections';
export * from './coachNotifications';
export { useLoad } from './hooks/useLoad';
export { useServerNow } from './hooks/useServerNow';
