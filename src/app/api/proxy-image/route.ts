import { NextRequest } from "next/server";
import https from "https";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) return new Response("Missing URL", { status: 400 });

  let targetUrl = decodeURIComponent(rawUrl).trim();
  
  if (targetUrl.includes('~')) {
    targetUrl = targetUrl.split('~')[0];
  }

  if (targetUrl.startsWith('//')) targetUrl = `https:${targetUrl}`;

  try {
    const uint8Array = await new Promise<Uint8Array>((resolve, reject) => {
      const parsedUrl = new URL(targetUrl);
      
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'Referer': 'https://www.netshort.com/',
        },
        timeout: 8000
      };

      const req = https.request(options, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Status ${res.statusCode}`));
          return;
        }

        const chunks: Uint8Array[] = [];
        res.on('data', (chunk: Uint8Array) => chunks.push(chunk));
        res.on('end', () => {
          const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
          const result = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
          }
          resolve(result);
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
      req.end();
    });

    return new Response(uint8Array as unknown as BodyInit, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch {
    const absoluteCleanUrl = targetUrl.split('~')[0].split('?')[0];
    const fallbackUrl = `https://wsrv.nl/?url=${encodeURIComponent(absoluteCleanUrl)}&output=jpg&n=-1`;
    
    return Response.redirect(fallbackUrl, 302);
  }
}