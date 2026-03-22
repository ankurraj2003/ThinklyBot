"use client";

import { useEffect, useRef, useState, useId } from "react";

interface MermaidDiagramProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const uniqueId = useId().replace(/:/g, "-");

  useEffect(() => {
    let cancelled = false;

    async function renderChart() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: {
            primaryColor: "#f8fafc",      // slate-50 node background
            primaryTextColor: "#334155",  // slate-700 text
            primaryBorderColor: "#cbd5e1", // slate-300 border
            lineColor: "#94a3b8",         // slate-400 arrows
            secondaryColor: "#f1f5f9",    // slate-100 alt nodes
            tertiaryColor: "#ffffff",     // white
            background: "transparent",
            mainBkg: "#f8fafc",
            nodeBorder: "#cbd5e1",
            clusterBkg: "#f1f5f9",
            edgeLabelBackground: "#18181b",
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
          },
          flowchart: {
            htmlLabels: true,
            curve: "basis",
          },
        });

        // Fix common Llama syntax errors and forcibly strip ugly inline styles
        let sanitizedChart = chart.trim().replace(/\|>/g, '-->');
        sanitizedChart = sanitizedChart.replace(/style\s+.*$/gm, '');
        sanitizedChart = sanitizedChart.replace(/classDef\s+.*$/gm, '');

        // Auto-prepend diagram type if missing (LLM sometimes omits it)
        const diagramTypes = /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph|journey|mindmap|timeline|quadrantChart|sankey|xychart|block)/m;
        if (!diagramTypes.test(sanitizedChart)) {
          sanitizedChart = `graph TD\n${sanitizedChart}`;
        }
        
        const { svg: renderedSvg } = await mermaid.render(
          `mermaid-${uniqueId}`,
          sanitizedChart
        );

        // Mermaid 10+ sometimes returns an SVG containing an error image instead of throwing
        if (renderedSvg.includes("Syntax error in text")) {
          throw new Error("Mermaid syntax error");
        }

        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("Mermaid render error:", err);
          setError("Unable to render diagram");
        }
      }
    }

    renderChart();

    return () => {
      cancelled = true;
    };
  }, [chart, uniqueId]);

  if (error) {
    return (
      <div className="my-4 rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600 font-medium">{error}</p>
        <pre className="mt-2 text-xs text-red-500 overflow-x-auto p-2 bg-red-100/50 rounded">
          <code>{chart}</code>
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-4 flex items-center justify-center rounded-xl border border-gray-100 bg-white p-12 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-500" />
          <span className="text-sm font-medium">Drawing diagram...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-5 overflow-x-auto rounded-xl border border-gray-100 bg-white p-6 shadow-sm [&_svg]:max-w-none"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
