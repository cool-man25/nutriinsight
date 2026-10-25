import { useEffect, useState } from 'react';
import type { TrendPoint } from '@shared/types/nutrition';
import { api } from '@/lib/api';
import { todayStr } from '@/lib/nutrition';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  refreshKey: number;
  showTable?: boolean;
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function shade(i: number, total: number): string {
  const palette = [
    'bg-emerald-100',
    'bg-emerald-200',
    'bg-emerald-300',
    'bg-emerald-400',
    'bg-emerald-500',
    'bg-emerald-600',
    'bg-emerald-500',
  ];
  if (i === total - 1) return 'bg-emerald-500';
  return palette[i % palette.length];
}

function axisLabel(p: TrendPoint, i: number, total: number, days: 7 | 30): string {
  if (i === total - 1) return '今日';
  const [y, m, d] = p.date.split('-').map(Number);
  if (days === 7) return WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return i % 5 === 0 ? `${m}/${d}` : '';
}

const TrendCard = ({ refreshKey, showTable = false }: Props) => {
  const [days, setDays] = useState<7 | 30>(7);
  const [data, setData] = useState<TrendPoint[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getTrend(todayStr(), days)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [days, refreshKey]);

  const recorded = data?.filter((p) => p.mealCount > 0) ?? [];
  const avg = recorded.length
    ? Math.round(recorded.reduce((a, p) => a + p.score, 0) / recorded.length)
    : 0;

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] sm:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold">营养趋势</h2>
          <p className="text-sm text-slate-500">
            过去 {days} 天的健康数据表现{recorded.length > 0 ? ` · 平均 ${avg} 分` : ''}
          </p>
        </div>
        <div className="flex self-start rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setDays(7)}
            className={`cursor-pointer rounded-md px-4 py-1.5 text-xs font-bold ${days === 7 ? 'bg-white shadow-sm' : 'text-slate-500'}`}
          >
            周视图
          </button>
          <button
            type="button"
            onClick={() => setDays(30)}
            className={`cursor-pointer rounded-md px-4 py-1.5 text-xs font-bold ${days === 30 ? 'bg-white shadow-sm' : 'text-slate-500'}`}
          >
            月视图
          </button>
        </div>
      </div>

      {error ? (
        <p className="py-16 text-center text-sm text-red-500">趋势数据加载失败，请稍后重试。</p>
      ) : !data ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <>
          <div className={`flex h-64 w-full items-end justify-between px-1 ${days === 7 ? 'gap-2' : 'gap-0.5'}`}>
            {data.map((p, i) => (
              <div
                key={p.date}
                title={`${p.date}：${p.score} 分`}
                className={`group relative flex-1 cursor-pointer rounded-t-lg ${p.mealCount > 0 ? shade(i, data.length) : 'bg-slate-100'}`}
                style={{ height: `${Math.max(4, p.score)}%` }}
              >
                <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {p.mealCount > 0 ? `${p.score}分` : '无记录'}
                </div>
              </div>
            ))}
          </div>
          <div className={`mt-4 flex justify-between px-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 ${days === 7 ? 'gap-2' : 'gap-0.5'}`}>
            {data.map((p, i) => (
              <span key={p.date} className="flex-1 overflow-visible whitespace-nowrap text-center">
                {axisLabel(p, i, data.length, days)}
              </span>
            ))}
          </div>
          {recorded.length === 0 && (
            <p className="mt-4 text-center text-sm text-slate-500">还没有趋势数据，记录餐食后这里会显示每日营养评分。</p>
          )}
          {showTable && (
            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="py-2 font-medium">日期</th>
                    <th className="py-2 font-medium">评分</th>
                    <th className="py-2 font-medium">热量 (kcal)</th>
                    <th className="py-2 font-medium">蛋白质 (g)</th>
                    <th className="py-2 font-medium">餐数</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data].reverse().map((p) => (
                    <tr key={p.date} className="border-b border-slate-100">
                      <td className="py-2">{p.date}</td>
                      <td className="py-2 font-semibold">{p.mealCount > 0 ? p.score : '—'}</td>
                      <td className="py-2">{p.mealCount > 0 ? p.calories : '—'}</td>
                      <td className="py-2">{p.mealCount > 0 ? p.protein : '—'}</td>
                      <td className="py-2">{p.mealCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default TrendCard;
