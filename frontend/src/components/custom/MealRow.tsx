import { Trash2, Utensils } from 'lucide-react';
import type { Meal } from '@shared/types/nutrition';
import { MEAL_LABEL } from '@/lib/nutrition';

interface Props {
  meal: Meal;
  detailed?: boolean;
  onDelete?: (meal: Meal) => void;
}

function tag(meal: Meal): { label: string; className: string } | null {
  if (meal.protein >= 25 || (meal.calories > 0 && (meal.protein * 4) / meal.calories > 0.3)) {
    return { label: '高蛋白', className: 'bg-blue-100 text-blue-700' };
  }
  if (meal.fiber >= 6) return { label: '高纤维', className: 'bg-emerald-100 text-emerald-700' };
  return null;
}

const MealRow = ({ meal, detailed = false, onDelete }: Props) => {
  const t = tag(meal);
  return (
    <div className="rounded-xl border border-transparent p-3 transition-colors hover:border-slate-200 hover:bg-slate-50">
      <div className="flex items-center gap-3 sm:gap-4">
        {meal.photoUrl ? (
          <img
            src={meal.photoUrl}
            alt={meal.name}
            className="h-16 w-16 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
            <Utensils className="h-6 w-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-semibold">{meal.name}</h4>
          <p className="text-xs text-slate-500">
            {MEAL_LABEL[meal.mealType]} · {meal.eatTime} · {Math.round(meal.calories)} kcal
          </p>
        </div>
        {t && (
          <span className={`hidden rounded px-2 py-1 text-[10px] font-bold uppercase sm:inline ${t.className}`}>
            {t.label}
          </span>
        )}
        {onDelete && (
          <button
            type="button"
            aria-label="删除记录"
            onClick={() => onDelete(meal)}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      {detailed && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
            <div className="rounded-lg bg-blue-50 py-2">
              <div className="font-bold text-blue-700">{meal.protein}g</div>
              <div className="text-slate-500">蛋白质</div>
            </div>
            <div className="rounded-lg bg-sky-50 py-2">
              <div className="font-bold text-sky-700">{meal.carbs}g</div>
              <div className="text-slate-500">碳水</div>
            </div>
            <div className="rounded-lg bg-amber-50 py-2">
              <div className="font-bold text-amber-700">{meal.fat}g</div>
              <div className="text-slate-500">脂肪</div>
            </div>
            <div className="rounded-lg bg-emerald-50 py-2">
              <div className="font-bold text-emerald-700">{meal.fiber}g</div>
              <div className="text-slate-500">膳食纤维</div>
            </div>
          </div>
          <ul className="divide-y divide-slate-100 text-sm">
            {meal.foods.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex justify-between gap-3 py-1.5">
                <span className="min-w-0 truncate">
                  {f.name} <span className="text-slate-400">{f.grams}g</span>
                </span>
                <span className="shrink-0 text-slate-500">{f.calories} kcal</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MealRow;
