import { COINGECKO } from './types';
export function useApi() {
  async function GET(url) {
    const result = await fetch(`${COINGECKO}${url}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    const data = await result.json();
    return { data };
  }

  // eslint-disable-next-line no-unused-vars
  async function POST(url, params) {
    const result = await fetch(`${COINGECKO}${url}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    const data = await result.json();
    return { data };
  }

  return {
    async getCoinData(id) {
      const { data } = await GET('coins/' + id);
      return data;
    },
  };
}
