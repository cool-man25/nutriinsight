import { AlertTriangle, CheckCircle2, Lightbulb, Loader2, XCircle } from 'lucide-react';
import type { MealAdvice, MealNutrientStatus } from '@shared/types/nutrition';

interface Props {
  advice: MealAdvice | null;
  loading: boolean;
}

const BAR_COLOR: Record<MealNutrientStatus['status'], string> = {
  low: 'bg-amber-400',
  ok: 'bg-emerald-500',
  high: 'bg-red-400',
};

const STATUS_TEXT: Record<MealNutrientStatus['status'], string> = {
  low: '偏少',
  ok: '刚好',
  high: '偏多',
};

const STATUS_CLASS: Record<MealNutrientStatus['status'], string> = {
  low: 'text-amber-600',
  ok: 'text-emerald-600',
  high: 'text-red-500',
};

const MealAdvicePanel = ({ advice, loading }: Props) => {
  if (!advice) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> 正在分析这一餐还差什么…
          </>
        ) : (
          '暂时无法生成本餐建议'
        )}
      </div>
    );
  }
  const recommendedGroups = advice.groups.filter((g) => g.recommended);
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 p-4" aria-live="polite">
      <div className="flex items-start gap-2">
        {advice.balanced ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
        ) : (
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-tight">这一餐还差什么？</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{advice.summary}</p>
        </div>
        {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />}
      </div>

      <div className="space-y-3">
        <p className="text-xs text-slate-500">
          对照本餐建议量（约占全天 {Math.round(advice.mealShare * 100)}%）
        </p>
        {advice.nutrients.map((n) => (
          <div key={n.key}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">{n.label}</span>
              <span className="text-xs text-slate-500">
                {n.intake} / {n.target} {n.unit} ·{' '}
                <span className={STATUS_CLASS[n.status]}>{STATUS_TEXT[n.status]}</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${BAR_COLOR[n.status]}`}
                style={{ width: `${Math.min(100, n.percent)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 text-xs text-slate-500">这一餐的食物搭配</p>
        <div className="flex flex-wrap gap-2">
          {recommendedGroups.map((g) => (
            <span
              key={g.id}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                g.present ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              {g.present ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {g.label}
              {g.present ? '' : ' 缺'}
            </span>
          ))}
        </div>
      </div>

      {advice.suggestions.length > 0 && (
        <ul className="space-y-2">
          {advice.suggestions.map((s) => (
            <li
              key={s.id}
              className={`flex gap-2 rounded-lg p-3 text-sm leading-relaxed ${
                s.level === 'warn' ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900'
              }`}
            >
              {s.level === 'warn' ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{s.text}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default MealAdvicePanel;
