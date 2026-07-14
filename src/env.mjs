export const env = {
  NODE_ENV: import.meta.env.MODE,
  NEXTAUTH_SECRET: 'local-demo-secret',
  NEXTAUTH_URL: window.location.origin,
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  NEXT_PUBLIC_APP_NAME: 'Isomorphic',
  NEXT_PUBLIC_GOOGLE_MAP_API_KEY:
    import.meta.env.VITE_GOOGLE_MAP_API_KEY ||
    import.meta.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY ||
    '',
};
