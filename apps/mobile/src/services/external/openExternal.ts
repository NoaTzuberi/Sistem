/** Opens a web address outside the app. Every external link goes through here. */
export function openExternal(url: string) {
  // TODO(5b): inside Capacitor open it with @capacitor/browser (Browser.open({ url })).
  window.open(url, '_blank', 'noopener,noreferrer');
}
