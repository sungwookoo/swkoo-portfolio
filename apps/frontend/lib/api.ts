import type { PortfolioOverview } from './types';

const defaultBaseUrl =
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000/api' : undefined;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? defaultBaseUrl;

export async function fetchOverview(): Promise<PortfolioOverview | null> {
  if (!API_BASE_URL) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/overview`, {
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      console.warn('Failed to load overview', response.statusText);
      return null;
    }

    return (await response.json()) as PortfolioOverview;
  } catch (error) {
    console.warn('Overview request failed', error);
    return null;
  }
}
