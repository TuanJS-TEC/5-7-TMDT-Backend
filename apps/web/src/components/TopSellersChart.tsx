import { useState } from 'react';

interface TopSeller {
  id: string;
  name: string;
  count: number;
}

type Range = '7d' | '30d' | '90d';

const DEMO_DATA: Record<Range, TopSeller[]> = {
  '7d': [
    { id: 's1',  name: 'Showroom Hà Nội Auto',  count: 12 },
    { id: 's2',  name: 'Xe Tốt Sài Gòn',        count: 9  },
    { id: 's3',  name: 'Auto Center HCM',         count: 8  },
    { id: 's4',  name: 'Minh Tuấn Motors',        count: 7  },
    { id: 's5',  name: 'CarPlus Đà Nẵng',         count: 6  },
    { id: 's6',  name: 'VinAuto Hải Phòng',       count: 5  },
    { id: 's7',  name: 'Phúc Long Cars',           count: 4  },
    { id: 's8',  name: 'Thanh Bình Auto',          count: 4  },
    { id: 's9',  name: 'Green Motors',             count: 3  },
    { id: 's10', name: 'Đức Mạnh Cars',            count: 2  },
  ],
  '30d': [
    { id: 's1',  name: 'Showroom Hà Nội Auto',  count: 47 },
    { id: 's3',  name: 'Auto Center HCM',         count: 39 },
    { id: 's2',  name: 'Xe Tốt Sài Gòn',        count: 35 },
    { id: 's5',  name: 'CarPlus Đà Nẵng',         count: 28 },
    { id: 's4',  name: 'Minh Tuấn Motors',        count: 24 },
    { id: 's11', name: 'Bảo Châu Auto',            count: 21 },
    { id: 's6',  name: 'VinAuto Hải Phòng',       count: 18 },
    { id: 's12', name: 'Nam Phát Motors',          count: 16 },
    { id: 's7',  name: 'Phúc Long Cars',           count: 14 },
    { id: 's8',  name: 'Thanh Bình Auto',          count: 11 },
  ],
  '90d': [
    { id: 's3',  name: 'Auto Center HCM',         count: 134 },
    { id: 's1',  name: 'Showroom Hà Nội Auto',  count: 128 },
    { id: 's5',  name: 'CarPlus Đà Nẵng',         count: 97  },
    { id: 's2',  name: 'Xe Tốt Sài Gòn',        count: 91  },
    { id: 's11', name: 'Bảo Châu Auto',            count: 76  },
    { id: 's4',  name: 'Minh Tuấn Motors',        count: 68  },
    { id: 's12', name: 'Nam Phát Motors',          count: 59  },
    { id: 's13', name: 'Đông Anh Car Center',      count: 52  },
    { id: 's6',  name: 'VinAuto Hải Phòng',       count: 47  },
    { id: 's8',  name: 'Thanh Bình Auto',          count: 41  },
  ],
};

const RANGE_LABELS: Record<Range, string> = {
  '7d':  '7 ngày',
  '30d': '30 ngày',
  '90d': '90 ngày',
};

const BAR_COLORS = [
  'from-amber-500 to-amber-600',
  'from-amber-400 to-amber-500',
  'from-amber-300 to-amber-400',
  'from-orange-400 to-amber-400',
  'from-orange-300 to-orange-400',
  'from-yellow-400 to-amber-400',
  'from-yellow-300 to-yellow-400',
  'from-amber-200 to-amber-300',
  'from-orange-200 to-orange-300',
  'from-yellow-200 to-yellow-300',
];

export function TopSellersChart() {
  const [range, setRange] = useState<Range>('30d');

  const sellers = DEMO_DATA[range];
  const max = sellers[0]?.count ?? 1;

  return (
    <div className="card p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Top 10 Người Bán</h2>
          <p className="text-xs text-muted mt-0.5">Số lượng xe bán được theo khoảng thời gian</p>
        </div>
        <div className="flex gap-1 rounded-full border border-amber-100 bg-amber-50 p-1">
          {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${
                range === r
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-800 hover:bg-amber-100'
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {sellers.map((seller, i) => {
          const pct = Math.round((seller.count / max) * 100);
          return (
            <div key={seller.id} className="grid items-center gap-2" style={{ gridTemplateColumns: '1.25rem 10rem 1fr 3.5rem' }}>
              <span className="text-right text-xs font-medium text-muted">{i + 1}</span>
              <span className="truncate text-xs text-ink" title={seller.name}>
                {seller.name}
              </span>
              <div className="relative h-5 overflow-hidden rounded-full bg-amber-50">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${BAR_COLORS[i]} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-right text-xs font-semibold text-amber-900">
                {seller.count} xe
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-right text-xs text-muted/70">* Dữ liệu demo — chưa kết nối API thực</p>
    </div>
  );
}
