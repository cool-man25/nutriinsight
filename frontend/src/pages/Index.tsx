import { useEffect, useState } from 'react';
import { Camera, Lightbulb, AlertTriangle } from 'lucide-react';
import type { DashboardData, GapItem } from '@shared/types/nutrition';
import { Skeleton } from '@/components/ui/skeleton';
import MealRow from '@/components/custom/MealRow';
import TrendCard from '@/components/custom/TrendCard';
import { api } from '@/lib/api';
import { AGE_COPY, ageGroupOf, todayStr } from '@/lib/nutrition';
import { useLayout } from '@/hooks/use-layout';
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
function formatDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${m}月${d}日 ${WEEKDAYS[new Date(y, m - 1, d).getDay()]}`;
}
interface RingProps {
  value: number;
  max: number;
  color: string;
  big: string;
  small: string;
}
const Ring = ({
  value,
  max,
  color,
  big,
  small
}: RingProps) => {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="10" />
        <circle cx="64" cy="64" r={radius} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - ratio)} className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold leading-tight">{big}</span>
        <span className="text-xs text-slate-500">{small}</span>
      </div>
    </div>;
};
const GAP_COLOR: Record<GapItem['status'], string> = {
  low: 'bg-amber-400',
  ok: 'bg-emerald-500',
  high: 'bg-red-400'
};
const GAP_TEXT: Record<GapItem['status'], string> = {
  low: '不足',
  ok: '达标',
  high: '超标'
};
const Index = () => {
  const {
    openLogMeal,
    refreshKey
  } = useLayout();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    api.getDashboard(todayStr()).then(d => {
      if (cancelled) return;
      setData(d);
      setError(null);
    }).catch((e: unknown) => {
      if (!cancelled) setError(e instanceof Error ? e.message : '加载失败');
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);
  if (error && !data) {
    return <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-red-500">
        {error}
      </p>;
  }
  if (!data) {
    return <div className="space-y-6">
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-56 rounded-3xl" />
        </div>
        <Skeleton className="h-64 rounded-3xl" />
      </div>;
  }
  const {
    score,
    totals,
    targets,
    gaps,
    suggestions,
    meals,
    profile
  } = data;
  const subScores = [{
    label: '宏量营养素',
    value: score.macro,
    max: 40
  }, {
    label: '微量营养素',
    value: score.micro,
    max: 35
  }, {
    label: '均衡性',
    value: score.balance,
    max: 15
  }, {
    label: '多样性',
    value: score.diversity,
    max: 10
  }];
  const proteinGap = gaps.find(g => g.key === 'protein');
  const copy = AGE_COPY[ageGroupOf(profile.age)];
  return <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-600">{formatDate(data.date)}</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{copy.greeting(profile.name)}</h1>
          {copy.tagline && <p className="mt-1 text-sm font-medium text-slate-700">{copy.tagline}</p>}
          <p className="mt-1 text-sm text-slate-500">
            今日目标 {targets.calories} kcal · 已摄入 {Math.round(totals.calories)} kcal（{data.completion}%）
          </p>
        </div>
        <button type="button" onClick={() => openLogMeal()} className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 self-start rounded-full bg-emerald-500 px-6 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90">
          <Camera className="h-4 w-4" />
          记录一餐
        </button>
      </header>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
        <section className="flex min-h-[120px] flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)]">
          <h2 className="self-start text-sm font-semibold text-slate-500">今日营养评分</h2>
          <Ring value={score.total} max={100} color="#10B981" big={meals.length > 0 ? String(score.total) : '--'} small="/ 100" />
          <div className="w-full space-y-2">
            {subScores.map(s => <div key={s.label} className="flex items-center gap-2 text-xs">
                <span className="w-16 shrink-0 text-slate-500">{s.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{
                width: `${s.value / s.max * 100}%`
              }} />
                </div>
                <span className="w-10 shrink-0 text-right font-medium">
                  {s.value}/{s.max}
                </span>
              </div>)}
          </div>
        </section>

        <section className="flex min-h-[120px] flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)]">
          <h2 className="self-start text-sm font-semibold text-slate-500">热量摄入</h2>
          <Ring value={totals.calories} max={targets.calories} color="#F59E0B" big={String(Math.round(totals.calories))} small={`/ ${targets.calories} kcal`} />
          <div className="grid w-full grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-sky-50 py-2">
              <div className="font-bold text-sky-700">{totals.carbs}g</div>
              <div className="text-slate-500">碳水</div>
            </div>
            <div className="rounded-lg bg-amber-50 py-2">
              <div className="font-bold text-amber-700">{totals.fat}g</div>
              <div className="text-slate-500">脂肪</div>
            </div>
            <div className="rounded-lg bg-emerald-50 py-2">
              <div className="font-bold text-emerald-700">{totals.fiber}g</div>
              <div className="text-slate-500">纤维</div>
            </div>
          </div>
        </section>

        <section className="flex min-h-[120px] flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)]">
          <h2 className="self-start text-sm font-semibold text-slate-500">蛋白质</h2>
          <Ring value={totals.protein} max={targets.protein} color="#3B82F6" big={`${totals.protein}g`} small={`/ ${targets.protein}g`} />
          <p className="text-center text-sm text-slate-500">
            {proteinGap && proteinGap.status === 'low' && meals.length > 0 ? `还差 ${Math.max(0, Math.round(targets.protein - totals.protein))}g 达到今日目标` : meals.length === 0 ? '记录第一餐后开始统计' : '蛋白质摄入已达标'}
          </p>
        </section>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] sm:p-6">
          <h2 className="mb-4 text-lg font-bold">营养缺口分析</h2>
          <div className="space-y-4">
            {gaps.map(g => <div key={g.key}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{g.label}</span>
                  <span className="text-xs text-slate-500">
                    {g.intake} / {g.target} {g.unit} ·{' '}
                    <span className={g.status === 'ok' ? 'text-emerald-600' : g.status === 'low' ? 'text-amber-600' : 'text-red-500'}>
                      {meals.length === 0 ? '待记录' : GAP_TEXT[g.status]}
                    </span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full transition-all duration-700 ${GAP_COLOR[g.status]}`} style={{
                width: `${Math.min(100, g.percent)}%`
              }} />
                </div>
              </div>)}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] sm:p-6">
          <h2 className="mb-4 text-lg font-bold">AI 个性化建议</h2>
          <ul className="space-y-3">
            {suggestions.map(s => <li key={s.id} className={`flex gap-3 rounded-xl p-3 text-sm leading-relaxed ${s.level === 'warn' ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900'}`}>
                {s.level === 'warn' ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />}
                <span>{s.text}</span>
              </li>)}
          </ul>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] sm:p-6">
        <h2 className="mb-4 text-lg font-bold">今日餐食</h2>
        {meals.length === 0 ? <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-slate-500">今天还没有记录，拍张照片或输入吃了什么、喝了什么开始吧。</p>
            <button type="button" onClick={() => openLogMeal()} className="min-h-[44px] cursor-pointer rounded-full bg-emerald-500 px-6 text-sm font-semibold text-white hover:opacity-90">
              记录一餐
            </button>
          </div> : <div className="space-y-1">
            {meals.map(m => <MealRow key={m.id} meal={m} />)}
          </div>}
      </section>

      <TrendCard refreshKey={refreshKey} />
    </div>;
};
export default Index;