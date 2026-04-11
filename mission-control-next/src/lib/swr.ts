export async function fetcher(url: string, serviceKey: string): Promise<any> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SWR fetch error ${res.status}: ${text}`);
  }

  return res.json();
}
