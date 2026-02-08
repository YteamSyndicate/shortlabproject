// import { NextResponse } from 'next/server';

// export async function GET(
//   request: Request,
//   { params }: { params: Promise<{ path: string[] }> }
// ) {
//   try {
//     const resolvedParams = await params;
//     const path = resolvedParams.path.join('/');
//     const { searchParams } = new URL(request.url);
//     const queryString = searchParams.toString();
    
//     const targetUrl = `https://api.sansekai.my.id/api/${path}${queryString ? `?${queryString}` : ''}`;

//     const res = await fetch(targetUrl, {
//       method: 'GET',
//       headers: { 
//         'Accept': 'application/json',
//         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
//         'Referer': 'https://www.dramabox.com/',
//       },
//       cache: 'no-store'
//     });

//     const data = await res.json();
//     return NextResponse.json(data, { status: res.status });
//   } catch {
//     return NextResponse.json({ data: [] }, { status: 500 });
//   }
// }

import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const path = resolvedParams.path.join('/');
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const targetUrl = `https://api.sansekai.my.id/api/${path}${queryString ? `?${queryString}` : ''}`;

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Referer': 'https://www.dramabox.com/',
      },
      next: { revalidate: 3600 } 
    });

    const responseText = await res.text();

    if (!responseText || responseText.trim().length === 0) {
      console.warn(`Peringatan: API ${path} mengembalikan body kosong.`);
      return NextResponse.json({ data: null, message: "Konten kosong dari server pusat" }, { status: 200 });
    }

    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch {
      console.error("Gagal parse JSON. Respon aslinya bukan format JSON.");
      return NextResponse.json({ data: null, error: "Format data bukan JSON" }, { status: 502 });
    }
    
  } catch (error) {
    console.error("Route Error:", error);
    return NextResponse.json({ data: null, error: "Internal Server Error" }, { status: 500 });
  }
}