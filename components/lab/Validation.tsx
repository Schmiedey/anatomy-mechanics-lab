'use client';
import { useMemo, useState } from 'react';
import { murrayCurves } from '@/biomechanics/reference';
import { validateCurve } from '@/biomechanics/validation';
import { Mark } from './Provenance';

const fmt = (v: number, d = 1) => v.toFixed(d);

export function ValidationPanel() {
  const [curveId, setCurveId] = useState(murrayCurves[0].id);
  const report = useMemo(() => validateCurve(curveId), [curveId]);
  const width = 640,
    height = 220,
    left = 48,
    right = 18,
    top = 16,
    bottom = 32;
  const values = report.series.flatMap((s) => [s.value, s.reference]);
  const minV = Math.min(0, ...values) * 100;
  const maxV = Math.max(0.01, ...values) * 100;
  const pad = Math.max(0.4, (maxV - minV) * 0.12);
  const y0 = minV - (minV < 0 ? pad : 0);
  const y1 = maxV + pad;
  const plotW = width - left - right,
    plotH = height - top - bottom;
  const x = (q: number) => Number((left + (q / 140) * plotW).toFixed(2));
  const y = (v: number) =>
    Number((top + plotH - ((v - y0) / (y1 - y0)) * plotH).toFixed(2));
  const { error, curve } = report;
  return (
    <section className="validation">
      <div className="validation-intro">
        <h2>Simulated curve versus literature</h2>
        <p>
          Compare this model’s estimated moment arms with characteristic curves
          reconstructed from Murray, Delp and Buchanan. The reference is not a
          specimen-specific digitization, and a low error does not make the
          model clinically validated.
        </p>
      </div>
      <div className="validation-toolbar">
        <label>
          Reference curve
          <select
            aria-label="Reference curve"
            value={curveId}
            onChange={(e) => setCurveId(e.target.value)}
          >
            {murrayCurves.map((c) => (
              <option key={c.id} value={c.id}>
                {c.muscle} · {c.forearm}
              </option>
            ))}
          </select>
        </label>
        <p className="small-note">{curve.notes}</p>
      </div>
      <svg
        className="validation-plot"
        viewBox={`0 0 ${width} ${height}`}
        aria-label="Simulated and reference moment arms versus elbow angle"
      >
        {[y0, 0, y1].filter((v, i, a) => a.indexOf(v) === i).map((v) => (
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
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        {[0, 45, 90, 140].map((q) => (
          <text key={q} x={x(q)} y={height - 8} textAnchor="middle">
            {q}°
          </text>
        ))}
        <path
          d={report.series
            .map(
              (s, i) =>
                `${i ? 'L' : 'M'}${x(s.angle).toFixed(2)},${y(s.reference * 100).toFixed(2)}`,
            )
            .join(' ')}
          fill="none"
          stroke="#8a7e6e"
          strokeWidth="1.75"
          strokeDasharray="5 4"
        />
        <path
          d={report.series
            .map(
              (s, i) =>
                `${i ? 'L' : 'M'}${x(s.angle).toFixed(2)},${y(s.value * 100).toFixed(2)}`,
            )
            .join(' ')}
          fill="none"
          stroke="#b23a28"
          strokeWidth="1.9"
        />
      </svg>
      <div className="validation-legend">
        <span>
          <i className="sim" /> Simulated <Mark kind="estimated" compact />
        </span>
        <span>
          <i className="ref" /> Murray et al. characteristic curve
        </span>
        <span>cm</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              RMSE <Mark kind="estimated" compact />
            </td>
            <td>{fmt(error.rmse * 100, 2)} cm</td>
          </tr>
          <tr>
            <td>
              Mean absolute error <Mark kind="estimated" compact />
            </td>
            <td>{fmt(error.mae * 100, 2)} cm</td>
          </tr>
          <tr>
            <td>
              Peak error <Mark kind="estimated" compact />
            </td>
            <td>{fmt(error.peakError * 100, 2)} cm</td>
          </tr>
          <tr>
            <td>
              Peak-angle error <Mark kind="estimated" compact />
            </td>
            <td>
              {error.peakAngleError > 0 ? '+' : ''}
              {fmt(error.peakAngleError, 0)}°
            </td>
          </tr>
          <tr>
            <td>Simulated peak</td>
            <td>
              {fmt(error.simulatedPeak.value * 100, 2)} cm at{' '}
              {fmt(error.simulatedPeak.angle, 0)}°
            </td>
          </tr>
          <tr>
            <td>Reference peak</td>
            <td>
              {fmt(error.referencePeak.value * 100, 2)} cm at{' '}
              {fmt(error.referencePeak.angle, 0)}°
            </td>
          </tr>
        </tbody>
      </table>
      <p className="small-note">{curve.citation}</p>
    </section>
  );
}
