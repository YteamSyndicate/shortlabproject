import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://api.tmtreader.com/worldance/api/v1/home', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://www.melolo.vip',
        'Referer': 'https://www.melolo.vip/',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 600 } 
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Melolo API Error (${response.status}):`, errorText.slice(0, 100));
      return NextResponse.json({ error: 'Melolo API Down', status: response.status }, { status: 502 });
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Respon bukan JSON' }, { status: 502 });
    }

    const data = await response.json();

    const result = data.data?.list || data.data || data;
    return NextResponse.json(result);

  } catch (error) { 
    console.error("Fetch Catch Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}