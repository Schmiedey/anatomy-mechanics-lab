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
    left = 36,
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
  const max = Math.max(1, ...samples.flatMap(values)) * 1.12,
    plotW = width - left - right,
    plotH = height - top - bottom;
  const x = (q: number) => left + (q / 140) * plotW,
    y = (v: number) => top + plotH - (v / max) * plotH;
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
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line
              x1={left}
              x2={width - right}
              y1={y(max * f)}
              y2={y(max * f)}
              stroke="#e4d8c4"
              strokeDasharray="2 5"
            />
            <text x={left - 8} y={y(max * f) + 4} textAnchor="end">
              {(max * f).toFixed(max < 10 ? 1 : 0)}
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
            strokeWidth={1.75}
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
              r={3.2}
              fill={kind === 'torque' ? '#b23a28' : muscles[i].color}
              stroke="#f7f1e4"
              strokeWidth={1.5}
            />
          ))}
      </svg>
    </div>
  );
}
