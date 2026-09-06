export interface TrendChartProps {
  /** Conteo de comidas por día, en orden cronológico. */
  dailyCounts: { date: string; count: number }[];
}

// Gráfico simple de tendencias (Flujo de App §7.3, vista "Últimos 30
// días"): barras SVG propias, sin librería de gráficos — coherente con el
// resto del sprite de íconos lineales de la app.
export function TrendChart({ dailyCounts }: TrendChartProps) {
  const max = Math.max(1, ...dailyCounts.map((d) => d.count));
  const width = Math.max(dailyCounts.length * 8, 100);
  const height = 60;
  const barWidth = 6;

  return (
    <svg
      className="diario-trend-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Comidas registradas por día en los últimos 30 días"
    >
      {dailyCounts.map((d, i) => {
        const barHeight = (d.count / max) * (height - 4);
        return (
          <rect
            key={d.date}
            x={i * 8}
            y={height - barHeight}
            width={barWidth}
            height={barHeight}
            fill="var(--color-terracota-app, #b5654a)"
          />
        );
      })}
    </svg>
  );
}
