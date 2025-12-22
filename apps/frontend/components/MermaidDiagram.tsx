'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#10b981',
        primaryTextColor: '#f1f5f9',
        primaryBorderColor: '#334155',
        lineColor: '#64748b',
        secondaryColor: '#1e293b',
        tertiaryColor: '#0f172a',
        background: '#0f172a',
        mainBkg: '#1e293b',
        secondBkg: '#334155',
        border1: '#475569',
        border2: '#64748b',
        arrowheadColor: '#64748b',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: '14px',
        textColor: '#e2e8f0',
        nodeTextColor: '#f1f5f9',
      },
    });

    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        setSvg(renderedSvg);
        setError(null);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError('다이어그램을 렌더링하는 중 오류가 발생했습니다.');
      }
    };

    renderDiagram();
  }, [chart]);

  if (error) {
    return (
      <div className={`rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400 ${className}`}>
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`mermaid-diagram overflow-x-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

