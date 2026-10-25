import { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import type { Meal } from '@shared/types/nutrition';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import MealRow from '@/components/custom/MealRow';
import { api } from '@/lib/api';
import { todayStr } from '@/lib/nutrition';
import { useLayout } from '@/hooks/use-layout';

type Range = 1 | 7 | 30;

const RANGES: Array<{ days: Range; label: string }> = [
  { days: 1, label: '今天' },
  { days: 7, label: '近 7 天' },
  { days: 30, label: '近 30 天' },
];

const Meals = () => {
  const { openLogMeal, refreshKey, bumpRefresh } = useLayout();
  const [days, setDays] = useState<Range>(1);
  const [meals, setMeals] = useState<Meal[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Meal | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getMeals(todayStr(), days)
      .then((list) => {
        if (cancelled) return;
        setMeals(list);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '加载失败');
      });
    return () => {
      cancelled = true;
    };
  }, [days, refreshKey]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await api.deleteMeal(target.id);
      toast.success('已删除记录');
      bumpRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '删除失败');
    }
  };

  const dates = meals ? Array.from(new Set(meals.map((m) => m.eatDate))).sort().reverse() : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">饮食记录</h1>
          <p className="text-sm text-slate-500">查看每餐的食物明细与营养构成</p>
        </div>
        <button
          type="button"
          onClick={() => openLogMeal()}
          className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 self-start rounded-full bg-emerald-500 px-6 text-sm font-semibold text-white shadow-md hover:opacity-90"
        >
          <Camera className="h-4 w-4" />
          记录一餐
        </button>
      </div>

      <div className="flex self-start rounded-lg bg-slate-100 p-1 sm:inline-flex">
        {RANGES.map((r) => (
          <button
            key={r.days}
            type="button"
            aria-pressed={days === r.days}
            onClick={() => setDays(r.days)}
            className={`min-h-[36px] flex-1 cursor-pointer rounded-md px-4 text-xs font-bold sm:flex-none ${days === r.days ? 'bg-white shadow-sm' : 'text-slate-500'}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {error && !meals ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-red-500">{error}</p>
      ) : !meals ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : meals.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">这段时间还没有餐食记录。</p>
          <button
            type="button"
            onClick={() => openLogMeal()}
            className="mt-4 min-h-[44px] cursor-pointer rounded-full bg-emerald-500 px-6 text-sm font-semibold text-white hover:opacity-90"
          >
            记录第一餐
          </button>
        </div>
      ) : (
        dates.map((date) => (
          <section
            key={date}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] sm:p-5"
          >
            <h2 className="mb-3 text-sm font-bold text-slate-500">{date === todayStr() ? `今天 · ${date}` : date}</h2>
            <div className="space-y-2">
              {meals
                .filter((m) => m.eatDate === date)
                .map((m) => (
                  <MealRow key={m.id} meal={m} detailed onDelete={setPendingDelete} />
                ))}
            </div>
          </section>
        ))
      )}

      <AlertDialog open={pendingDelete !== null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除这条记录？</AlertDialogTitle>
            <AlertDialogDescription>
              「{pendingDelete?.name}」将被永久删除，今日营养数据会同步更新。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">取消</AlertDialogCancel>
            <AlertDialogAction className="cursor-pointer" onClick={() => void confirmDelete()}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Meals;
