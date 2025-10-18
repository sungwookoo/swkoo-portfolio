import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'swkoo.kr — Sungwoo Koo Infrastructure Portfolio',
  description:
    'Personal infrastructure portfolio for Sungwoo Koo, showcasing GitOps-driven workloads on a self-managed K3s cluster.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
