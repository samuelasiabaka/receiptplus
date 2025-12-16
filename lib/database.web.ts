// Web platform stub - SQLite is not supported on web
// This app is Android-first, so web support is not required for Phase 1

export const db = null as any;

export const initDb = () => {
  // No-op for web platform
  console.warn('SQLite is not supported on web. This app is designed for Android/iOS.');
};

