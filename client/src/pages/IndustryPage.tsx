import { useState } from 'react';
import { industries, IndustryData } from '../data/industries';
import { useAppStore } from '../store';

export default function IndustryPage() {
  const [activeIndustry, setActiveIndustry] = useState<string>('ai-computing');
  const [activeSegment, setActiveSegment] = useState<string>('');
  const openKline = useAppStore((s) => s.openKline);

  const industry = industries.find((i) => i.key === activeIndustry) || industries[0];

  // 设置默认 segment
  if (!activeSegment && industry.segments.length > 0) {
    setActiveSegment(industry.segments[0].name);
  }

  return (
    <div className="flex h-full animate-fade-in">
      {/* 行业标签栏 */}
      <div className="w-40 flex-shrink-0 p-3 space-y-1" style={{ borderRight: '1px solid var(--border-light)', backgroundColor: 'var(--bg-surface)' }}>
        {industries.map((ind) => (
          <button
            key={ind.key}
            onClick={() => {
              setActiveIndustry(ind.key);
              setActiveSegment(ind.segments[0]?.name || '');
            }}
            className={`nav-item text-sm ${activeIndustry === ind.key ? 'active' : ''}`}
          >
            <span className="mr-2">{ind.icon}</span>
            {ind.name}
          </button>
        ))}
      </div>

      {/* 详情 */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">
          {industry.icon} {industry.name}
        </h2>

        {/* 核心驱动 + 催化剂 + 风险 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <CardList title="核心驱动" items={industry.drivers} color="blue" />
          <CardList title="近期催化剂" items={industry.catalysts} color="yellow" />
          <CardList title="主要风险" items={industry.risks} color="red" />
        </div>

        {/* 产业链 */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">产业链结构</h3>
          <div className="grid grid-cols-3 gap-4">
            <ChainColumn title="上游" items={industry.chain.upstream} color="blue" />
            <ChainColumn title="中游" items={industry.chain.midstream} color="purple" />
            <ChainColumn title="下游" items={industry.chain.downstream} color="green" />
          </div>
        </div>

        {/* 细分板块 */}
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">细分板块</h3>
          <div className="flex gap-2 mb-4 flex-wrap">
            {industry.segments.map((seg) => (
              <button
                key={seg.name}
                onClick={() => setActiveSegment(seg.name)}
                className={`tag-btn ${activeSegment === seg.name ? 'active' : ''}`}
              >
                {seg.name}
              </button>
            ))}
          </div>

          {industry.segments
            .filter((s) => s.name === activeSegment)
            .map((seg) => (
              <div key={seg.name} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {seg.leaders.map((leader) => (
                  <button
                    key={leader.code}
                    onClick={() => openKline(leader.code, leader.name)}
                    className="card card-clickable p-4 text-left"
                  >
                    <div className="text-sm font-medium text-[var(--text-primary)]">{leader.name}</div>
                    <div className="text-xs data-number text-[var(--text-tertiary)] mt-1">{leader.code}</div>
                  </button>
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function CardList({
  title,
  items,
  color,
}: {
  title: string;
  items: string[];
  color: 'blue' | 'yellow' | 'red';
}) {
  const borderMap = {
    blue: 'var(--color-info)',
    yellow: 'var(--color-warning)',
    red: 'var(--color-down)',
  };
  return (
    <div className="card-static p-4" style={{ borderLeft: `3px solid ${borderMap[color]}` }}>
      <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{title}</h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-[var(--text-secondary)] leading-relaxed flex gap-1.5">
            <span className="text-[var(--text-tertiary)] flex-shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChainColumn({
  title,
  items,
  color,
}: {
  title: string;
  items: { name: string; description: string }[];
  color: string;
}) {
  const colorMap: Record<string, { bg: string; border: string }> = {
    blue: { bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.25)' },
    purple: { bg: 'rgba(168,85,247,0.06)', border: 'rgba(168,85,247,0.25)' },
    green: { bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.25)' },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div>
      <h4 className="text-sm font-medium text-[var(--text-tertiary)] mb-2">{title}</h4>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-lg p-3 group relative transition-all duration-200 hover:shadow-sm cursor-default"
            style={{ backgroundColor: c.bg, border: `1px solid ${c.border}` }}
            title={item.description}
          >
            <div className="text-sm font-medium text-[var(--text-primary)]">{item.name}</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {item.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
