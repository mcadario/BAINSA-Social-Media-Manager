import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BAINSA Dashboard — Human-in-the-Loop',
  description:
    'BAINSA Instagram Story pipeline dashboard. Trigger agents, review real-time logs, and preview brand-compliant story content.',
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bainsa-black text-bainsa-white antialiased">
        {children}
      </body>
    </html>
  );
}
