import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'swkoo.kr — GitHub repo 하나로 앱을 라이브로',
  description:
    'GitHub repo 하나만 있으면 Dockerfile부터 k8s 매니페스트까지 자동 생성, ArgoCD로 배포합니다. 그 인프라는 운영 콘솔(Observatory)에서 모두 공개. 친구·테스터 한정 베타.'
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
