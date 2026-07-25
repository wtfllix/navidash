import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'NaviDash Access',
  robots: { index: false, follow: false },
};

export default function AccessLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="font-sans">{children}</body>
    </html>
  );
}
