export const publicLink = (base, path, localOrigin = window.location.origin) =>
  new URL(path, base || localOrigin).toString();
