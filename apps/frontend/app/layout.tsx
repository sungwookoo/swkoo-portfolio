import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

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
      <body className="flex min-h-screen flex-col bg-slate-950 text-slate-100 antialiased">
        <Header />
        <div className="flex-1 pt-16">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
