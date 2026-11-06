import React, { useState } from 'react';
import { TrendingUp, ChevronDown } from 'lucide-react';
import { AppState } from '../../services/storage';

interface CashFlowChartProps {
  state: AppState;
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({ state }) => {
  const [range, setRange] = useState<'6m' | '12m'>('6m');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const currency = state.settings?.currencySymbol || '₹';

  // Generate monthly buckets for past 6 or 12 months dynamically
  const numMonths = range === '6m' ? 6 : 12;
  const now = new Date();

  const months: { label: string; monthIndex: number; year: number }[] = [];
  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString('en-US', { month: 'short' }),
      monthIndex: d.getMonth(),
      year: d.getFullYear(),
    });
  }

  // Aggregate actual inflow from payments and outflow from invoices
  const chartData = months.map((m) => {
    const monthPayments = state.payments.filter((p) => {
      if (p.status !== 'success') return false;
      const pd = new Date(p.paymentDate);
      return !isNaN(pd.getTime()) && pd.getMonth() === m.monthIndex && pd.getFullYear() === m.year;
    });

    const monthInvoices = state.invoices.filter((inv) => {
      const id = new Date(inv.issueDate || inv.createdAt);
      return !isNaN(id.getTime()) && id.getMonth() === m.monthIndex && id.getFullYear() === m.year;
    });

    const inflowRaw = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    const outflowRaw = monthInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    return {
      month: m.label,
      inflow: inflowRaw,
      outflow: outflowRaw,
      inflowAmt: `${currency}${inflowRaw.toLocaleString('en-IN')}`,
      outflowAmt: `${currency}${outflowRaw.toLocaleString('en-IN')}`,
    };
  });

  const totalInflow = chartData.reduce((sum, d) => sum + d.inflow, 0);
  const totalOutflow = chartData.reduce((sum, d) => sum + d.outflow, 0);
  const maxVal = Math.max(10000, ...chartData.map((d) => Math.max(d.inflow, d.outflow)));

  // SVG dimensions
  const width = 480;
  const height = 190;
  const paddingX = 45;
  const paddingY = 25;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const pointsInflow = chartData.map((d, i) => {
    const x = paddingX + (i / Math.max(1, chartData.length - 1)) * chartWidth;
    const y = height - paddingY - (d.inflow / maxVal) * chartHeight;
    return { x, y, ...d };
  });

  const pointsOutflow = chartData.map((d, i) => {
    const x = paddingX + (i / Math.max(1, chartData.length - 1)) * chartWidth;
    const y = height - paddingY - (d.outflow / maxVal) * chartHeight;
    return { x, y, ...d };
  });

  const buildPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    return pts.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = pts[i - 1];
      const cx1 = prev.x + (p.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (p.x - prev.x) / 2;
      const cy2 = p.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`;
    }, '');
  };

  const lineInflow = buildPath(pointsInflow);
  const lineOutflow = buildPath(pointsOutflow);
  const areaInflow =
    pointsInflow.length > 0
      ? `${lineInflow} L ${pointsInflow[pointsInflow.length - 1].x} ${height - paddingY} L ${pointsInflow[0].x} ${height - paddingY} Z`
      : '';

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#e8e9f5] shadow-[0_4px_20px_rgba(79,70,229,0.03)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp size={18} className="stroke-[2.2]" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Cash Flow Overview</h3>
        </div>

        <div className="flex items-center gap-4">
          {/* Legends */}
          <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4338ca]" />
              <span>Inflow ({currency}{totalInflow.toLocaleString('en-IN')})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c7d2fe]" />
              <span>Billed ({currency}{totalOutflow.toLocaleString('en-IN')})</span>
            </div>
          </div>

          {/* Time Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              <span>{range === '6m' ? 'Last 6 Months' : 'Last 12 Months'}</span>
              <ChevronDown size={13} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20">
                <button
                  onClick={() => {
                    setRange('6m');
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 cursor-pointer"
                >
                  Last 6 Months
                </button>
                <button
                  onClick={() => {
                    setRange('12m');
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 cursor-pointer"
                >
                  Last 12 Months
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive SVG Chart or Empty State */}
      {totalInflow === 0 && totalOutflow === 0 ? (
        <div className="h-52 sm:h-56 mt-2 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <p className="text-xs font-semibold text-slate-500">No payment or billing records available yet.</p>
          <p className="text-[11px] text-slate-400 mt-1">Cash flow will automatically chart here as invoices and payments are recorded.</p>
        </div>
      ) : (
        <div className="relative w-full h-52 sm:h-56 mt-2">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="cashArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Y Grid Lines */}
            {[1, 0.66, 0.33, 0].map((ratio) => {
              const y = paddingY + (1 - ratio) * chartHeight;
              const label = `${currency}${Math.round((maxVal * ratio) / 1000)}k`;
              return (
                <g key={ratio}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#f1f2f9"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    fontSize="9"
                    className="fill-slate-400 font-semibold select-none"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Area fill */}
            {lineInflow && <path d={areaInflow} fill="url(#cashArea)" />}

            {/* Outflow line */}
            {lineOutflow && (
              <path
                d={lineOutflow}
                fill="none"
                stroke="#c7d2fe"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* Inflow line */}
            {lineInflow && (
              <path
                d={lineInflow}
                fill="none"
                stroke="#4338ca"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            )}

            {/* Inflow points */}
            {pointsInflow.map((p, i) => {
              const isHovered = hoveredIndex === i;
              return (
                <g
                  key={`in-${i}`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? '6' : '4.5'}
                    fill="#4338ca"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    className="transition-all duration-150"
                  />
                </g>
              );
            })}

            {/* X Axis month labels */}
            {pointsInflow.map((p) => (
              <text
                key={p.month}
                x={p.x}
                y={height - 6}
                textAnchor="middle"
                fontSize="10"
                className="fill-slate-500 font-medium select-none"
              >
                {p.month}
              </text>
            ))}
          </svg>

          {/* Hover Tooltip */}
          {hoveredIndex !== null && (
            <div
              className="absolute pointer-events-none bg-slate-900/90 text-white text-[11px] py-1.5 px-2.5 rounded-lg shadow-lg -translate-x-1/2 -translate-y-full -top-1 transition-all"
              style={{
                left: `${(pointsInflow[hoveredIndex].x / width) * 100}%`,
              }}
            >
              <p className="font-bold text-slate-200">{pointsInflow[hoveredIndex].month}</p>
              <p className="text-emerald-400">Inflow: {pointsInflow[hoveredIndex].inflowAmt}</p>
              <p className="text-indigo-300">Billed: {pointsInflow[hoveredIndex].outflowAmt}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
