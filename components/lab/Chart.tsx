'use client';
import type { Solution } from '@/biomechanics/inverseDynamics';
import { muscles } from '@/anatomy/model';
import { Mark, type ProvenanceKind } from './Provenance';
export type Sample = Solution & { angle: number };
export function Chart({
  kind,
  samples,
  angle,
  onAngle,
  result,
}: {
  kind: 'torque' | 'arm' | 'force' | 'length';
  samples: Sample[];
  angle: number;
  onAngle: (v: number) => void;
  result: Solution;
}) {
  const width = 340,
    height = 150,
    left = 40,
    right = 12,
    top = 14,
    bottom = 27;
  const values = (s: Sample) =>
    kind === 'torque'
      ? [s.external.loadTorque]
      : s.muscles.map((m) =>
          kind === 'arm'
            ? m.momentArm * 100
            : kind === 'force'
              ? m.force
              : m.length * 100,
        );
  const all = samples.flatMap(values);
  const minV = Math.min(0, ...all);
  const maxV = Math.max(0.01, ...all);
  const pad = Math.max(0.08, (maxV - minV) * 0.12);
  const y0 = minV - (minV < 0 ? pad : 0);
  const y1 = maxV + pad;
  const plotW = width - left - right,
    plotH = height - top - bottom;
  const x = (q: number) => Number((left + (q / 140) * plotW).toFixed(2)),
    y = (v: number) =>
      Number((top + plotH - ((v - y0) / (y1 - y0)) * plotH).toFixed(2));
  const titles: Record<typeof kind, string> = {
      torque: 'External torque',
      arm: 'Muscle moment arm',
      force: 'Muscle force',
      length: 'Musculotendon length',
    },
    units = { torque: 'N·m', arm: 'cm', force: 'N', length: 'cm' },
    provenance: Record<typeof kind, ProvenanceKind> = {
      torque: 'calculated',
      arm: 'estimated',
      force: 'estimated',
      length: 'estimated',
    };
  const current = { ...result, angle };
  const ticks = minV < -1e-6 ? [y0, 0, y1] : [0, 0.5 * y1, y1];
  const scrub = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onAngle(
      Math.round(
        Math.max(
          0,
          Math.min(
            140,
            ((((e.clientX - rect.left) / rect.width) * width - left) / plotW) *
              140,
          ),
        ),
      ),
    );
  };
  return (
    <div className="plot">
      <div className="plot-heading">
        <h3>
          {titles[kind]} <Mark kind={provenance[kind]} compact />
        </h3>
        <span>{units[kind]}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        aria-label={`${titles[kind]} versus elbow angle. Drag to scrub.`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          scrub(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) scrub(e);
        }}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line
              x1={left}
              x2={width - right}
              y1={y(v)}
              y2={y(v)}
              stroke="#e4d8c4"
              strokeDasharray="2 5"
            />
            <text x={left - 8} y={y(v) + 4} textAnchor="end">
              {v.toFixed(Math.abs(v) < 10 ? 1 : 0)}
            </text>
          </g>
        ))}
        {[0, 45, 90, 140].map((q) => (
          <text key={q} x={x(q)} y={height - 7} textAnchor="middle">
            {q}°
          </text>
        ))}
        {values(samples[0]).map((_, i) => (
          <path
            key={i}
            d={samples
              .map(
                (s, j) =>
                  `${j ? 'L' : 'M'}${x(s.angle).toFixed(2)},${y(values(s)[i]).toFixed(2)}`,
              )
              .join(' ')}
            fill="none"
            stroke={kind === 'torque' ? '#b23a28' : muscles[i].color}
            strokeWidth={kind === 'torque' ? 1.75 : 1.25}
            opacity={kind === 'torque' ? 1 : 0.9}
          />
        ))}
        <line
          x1={x(angle)}
          x2={x(angle)}
          y1={top}
          y2={height - bottom}
          stroke="#b8955a"
          strokeDasharray="2 4"
        />
        {current &&
          values(current).map((v, i) => (
            <circle
              key={i}
              cx={x(angle)}
              cy={y(v)}
              r={2.8}
              fill={kind === 'torque' ? '#b23a28' : muscles[i].color}
              stroke="#f7f1e4"
              strokeWidth={1.2}
            />
          ))}
      </svg>
    </div>
  );
}
