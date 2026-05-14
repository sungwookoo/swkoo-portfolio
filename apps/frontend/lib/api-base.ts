const defaultBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000/api'
    : 'https://swkoo.kr/api');

export const API_BASE_URL = defaultBaseUrl;
