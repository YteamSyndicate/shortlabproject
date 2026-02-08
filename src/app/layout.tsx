import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from 'next/font/google';
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: "SHORTLAB | Esensi Drama Mikro",
  description: "Drama tidak butuh durasi untuk menjadi besar. Kami mengemas seluruh emosi manusia ke dalam kapsul waktu yang singkat, padat, dan tak terlupakan.",
  referrer: 'no-referrer',
  icons: {
    icon: "/logo_SL.png",
    apple: "/logo_SL.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${jakarta.className} antialiased bg-black text-white`}
      >
        {children}
      </body>
    </html>
  );
}