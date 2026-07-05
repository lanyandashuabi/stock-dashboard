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
    <div className="flex h-full">
      {/* 行业标签栏 */}
      <div className="w-40 border-r border-red-100 p-3 space-y-1">
        {industries.map((ind) => (
          <button
            key={ind.key}
            onClick={() => {
              setActiveIndustry(ind.key);
              setActiveSegment(ind.segments[0]?.name || '');
            }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
              activeIndustry === ind.key
                ? 'bg-red-50 text-red-600 font-medium'
                : '3 hover: hover:bg-white'
            }`}
          >
            {ind.icon} {ind.name}
          </button>
        ))}
      </div>

      {/* 详情 */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-xl font-bold  mb-6">
          {industry.icon} {industry.name}
        </h2>

        {/* 核心驱动 + 催化剂 + 风险 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <CardList title="📈 核心驱动" items={industry.drivers} color="blue" />
          <CardList title="⚡ 近期催化剂" items={industry.catalysts} color="yellow" />
          <CardList title="⚠ 主要风险" items={industry.risks} color="red" />
        </div>

        {/* 产业链 */}
        <div className="mb-6">
          <h3 className="text-base font-semibold  mb-3">🔗 产业链结构</h3>
          <div className="grid grid-cols-3 gap-4">
            <ChainColumn title="上游" items={industry.chain.upstream} color="blue" />
            <ChainColumn title="中游" items={industry.chain.midstream} color="purple" />
            <ChainColumn title="下游" items={industry.chain.downstream} color="green" />
          </div>
        </div>

        {/* 细分板块 */}
        <div>
          <h3 className="text-base font-semibold  mb-3">📊 细分板块</h3>
          <div className="flex gap-2 mb-4">
            {industry.segments.map((seg) => (
              <button
                key={seg.name}
                onClick={() => setActiveSegment(seg.name)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  activeSegment === seg.name
                    ? 'bg-gradient-red '
                    : 'bg-white 3 hover:'
                }`}
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
                    className="bg-white card-shadow border border-red-100 hover:border-blue-500 rounded-lg p-3 text-left transition-colors"
                  >
                    <div className="text-sm text-gray-200">{leader.name}</div>
                    <div className="text-xs 4 font-mono mt-1">{leader.code}</div>
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
    blue: 'border-l-blue-500',
    yellow: 'border-l-yellow-500',
    red: 'border-l-red-500',
  };
  return (
    <div className={`bg-white card-shadow border border-red-100 border-l-4 ${borderMap[color]} rounded-lg p-4`}>
      <h4 className="text-sm font-medium 2 mb-3">{title}</h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-xs 3 leading-relaxed">
            • {item}
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
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/30',
    purple: 'bg-purple-500/10 border-purple-500/30',
    green: 'bg-green-500/10 border-green-300',
  };
  return (
    <div>
      <h4 className="text-sm font-medium 3 mb-2">{title}</h4>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className={`${colorMap[color] || ''} border rounded-lg p-3 group relative`}
            title={item.description}
          >
            <div className="text-sm text-gray-200">{item.name}</div>
            <div className="text-xs 4 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
