import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get('url');

  if (!videoUrl) return new Response('Missing URL', { status: 400 });

  try {
    const decodedUrl = decodeURIComponent(videoUrl);
    const range = req.headers.get('range');

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Connection': 'keep-alive',
    };

    if (range) {
      headers['Range'] = range;
    }

    if (decodedUrl.includes('melolo') || decodedUrl.includes('mll')) {
      headers['Referer'] = 'https://www.melolo.com/';
      headers['Origin'] = 'https://www.melolo.com';
    } else if (decodedUrl.includes('dramabox') || decodedUrl.includes('dramaboxdb')) {
      headers['Referer'] = 'https://www.dramaboxdb.com/';
    } else if (decodedUrl.includes('reelshort')) {
      headers['Referer'] = 'https://www.reelshort.com/';
    }

    const response = await fetch(decodedUrl, { 
      headers,
      cache: 'no-store'
    });

    if (!response.ok && response.status !== 206) {
      return new Response(`Platform Error: ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get('Content-Type') || 'video/mp4';
    const contentRange = response.headers.get('Content-Range');
    const contentLength = response.headers.get('Content-Length');

    const resHeaders = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
    });

    if (contentRange) resHeaders.set('Content-Range', contentRange);
    if (contentLength) resHeaders.set('Content-Length', contentLength);

    return new Response(response.body, {
      status: range ? 206 : 200,
      headers: resHeaders,
    });

  } catch (err: unknown) {
    console.error('[PROXY_ERROR]', err);
    return new Response('Proxy Failed', { status: 500 });
  }
}