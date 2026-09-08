import type { Metadata } from 'next';
import { Alegreya, Alegreya_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const display = Alegreya({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-alegree',
});
const ui = Alegreya_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '700'],
  variable: '--font-ui',
});
const numerals = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500'],
  variable: '--font-num',
});

export const metadata: Metadata = {
  title: 'Anatomy Mechanics Lab · Elbow Flexion',
  description: 'An interactive, deterministic elbow biomechanics laboratory.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${ui.variable} ${numerals.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
