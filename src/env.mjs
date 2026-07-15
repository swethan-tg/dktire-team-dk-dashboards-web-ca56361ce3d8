export const env = {
  NODE_ENV: import.meta.env.MODE,
  NEXTAUTH_SECRET: import.meta.env.VITE_NEXTAUTH_SECRET || '',
  NEXTAUTH_URL: import.meta.env.VITE_NEXTAUTH_URL || window.location.origin,
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
  NEXT_PUBLIC_APP_NAME: import.meta.env.VITE_APP_NAME || 'Isomorphic',
  NEXT_PUBLIC_GOOGLE_MAP_API_KEY:
    import.meta.env.VITE_GOOGLE_MAP_API_KEY ||
    import.meta.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY ||
    '',
};
