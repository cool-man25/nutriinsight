import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, PenLine, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { FoodItem, MealAdvice, MealType } from '@shared/types/nutrition';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import MealAdvicePanel from '@/components/custom/MealAdvicePanel';
import { api } from '@/lib/api';
import {
  MEAL_EMOJI,
  MEAL_LABEL,
  MEAL_TYPES,
  nowTime,
  resizeImage,
  todayStr,
} from '@/lib/nutrition';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialType: MealType;
  onSaved: () => void;
}

interface Row {
  key: string;
  base: FoodItem;
  food: FoodItem;
}

type InputMode = 'text' | 'photo';

const FOOD_CHIPS = ['米饭 1碗', '鸡蛋 1个', '青菜 1份', '面包 2片', '苹果 1个', '鸡胸肉 100g'];
const DRINK_CHIPS = ['温水 250ml', '牛奶 250ml', '豆浆 300ml', '咖啡 1杯', '橙汁 200ml', '奶茶 500ml'];

const r1 = (n: number) => Math.round(n * 10) / 10;

let rowCounter = 0;

function scaleFood(base: FoodItem, grams: number): FoodItem {
  if (base.grams <= 0) return { ...base, grams };
  const k = grams / base.grams;
  return {
    name: base.name,
    grams,
    calories: Math.round(base.calories * k),
    protein: r1(base.protein * k),
    carbs: r1(base.carbs * k),
    fat: r1(base.fat * k),
    fiber: r1(base.fiber * k),
  };
}

const appendChip = (current: string, chip: string) =>
  current.trim() ? `${current.trim()}、${chip}` : chip;

interface ChipRowProps {
  chips: string[];
  onPick: (chip: string) => void;
}

const ChipRow = ({ chips, onPick }: ChipRowProps) => (
  <div className="flex flex-wrap gap-2">
    {chips.map((chip) => (
      <button
        key={chip}
        type="button"
        onClick={() => onPick(chip)}
        className="min-h-[36px] cursor-pointer rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700"
      >
        + {chip}
      </button>
    ))}
  </div>
);

const LogMealInner = ({ open, onOpenChange, initialType, onSaved }: Props) => {
  const [mealType, setMealType] = useState<MealType>(initialType);
  const [mode, setMode] = useState<InputMode>('text');
  const [foodText, setFoodText] = useState('');
  const [drinkText, setDrinkText] = useState('');
  const [photoDesc, setPhotoDesc] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [mealName, setMealName] = useState('');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advice, setAdvice] = useState<MealAdvice | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const description =
    mode === 'text'
      ? [
          foodText.trim() ? `食物：${foodText.trim()}` : '',
          drinkText.trim() ? `饮品：${drinkText.trim()}` : '',
        ]
          .filter(Boolean)
          .join('；')
      : photoDesc.trim();
  const canAnalyze = description.length >= 2;

  useEffect(() => {
    if (!rows || rows.length === 0) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setAdviceLoading(true);
      api
        .getMealAdvice({
          mealType,
          foods: rows.map((r) => ({ ...r.food, name: r.food.name.trim() || '未命名食物' })),
        })
        .then((a) => {
          if (!cancelled) setAdvice(a);
        })
        .catch(() => {
          if (!cancelled) setAdvice(null);
        })
        .finally(() => {
          if (!cancelled) setAdviceLoading(false);
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [rows, mealType]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPhoto(await resizeImage(file));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '图片处理失败');
    }
  };

  const analyze = async () => {
    setError(null);
    setAnalyzing(true);
    try {
      const result = await api.analyzeMeal({ description, mealType });
      setMealName(result.mealName);
      setAdvice(null);
      setRows(result.foods.map((food) => ({ key: `food-${++rowCounter}`, base: food, food })));
    } catch (e) {
      setError(e instanceof Error ? e.message : '识别失败');
    } finally {
      setAnalyzing(false);
    }
  };

  const updateGrams = (key: string, value: string) => {
    const grams = Math.max(0, Math.min(5000, Number(value) || 0));
    setRows((prev) =>
      prev ? prev.map((r) => (r.key === key ? { ...r, food: scaleFood(r.base, grams) } : r)) : prev,
    );
  };

  const updateName = (key: string, name: string) => {
    setRows((prev) =>
      prev ? prev.map((r) => (r.key === key ? { ...r, food: { ...r.food, name } } : r)) : prev,
    );
  };

  const removeRow = (key: string) => {
    setRows((prev) => (prev ? prev.filter((r) => r.key !== key) : prev));
  };

  const foods = rows?.map((r) => r.food) ?? [];
  const total = foods.reduce(
    (acc, f) => ({
      calories: acc.calories + f.calories,
      protein: acc.protein + f.protein,
      carbs: acc.carbs + f.carbs,
      fat: acc.fat + f.fat,
      fiber: acc.fiber + f.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );

  const save = async () => {
    if (!rows || rows.length === 0) return;
    const cleaned = foods.map((f) => ({ ...f, name: f.name.trim() || '未命名食物' }));
    setSaving(true);
    try {
      await api.createMeal({
        mealType,
        name: mealName.trim() || cleaned[0].name,
        eatDate: todayStr(),
        eatTime: nowTime(),
        photoUrl: mode === 'photo' ? photo : null,
        foods: cleaned,
      });
      toast.success(`已保存${MEAL_LABEL[mealType]}记录`);
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-xl overflow-y-auto rounded-2xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle>{rows ? '确认识别结果' : '记录一餐'}</DialogTitle>
          <DialogDescription>
            {rows
              ? '可以修正食物名称或份量，营养数值会按比例自动重算，下方会告诉你这一餐还差什么。'
              : '拍照上传，或直接写下吃了什么、喝了什么，AI 会估算营养并告诉你这一餐还差什么。'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-2">
          {MEAL_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={mealType === t}
              onClick={() => setMealType(t)}
              className={`min-h-[44px] cursor-pointer rounded-lg border py-2 text-sm font-medium transition-colors ${
                mealType === t
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              <span aria-hidden="true">{MEAL_EMOJI[t]} </span>
              {MEAL_LABEL[t]}
            </button>
          ))}
        </div>

        {!rows ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                aria-pressed={mode === 'text'}
                onClick={() => setMode('text')}
                className={`flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors ${
                  mode === 'text' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                <PenLine className="h-4 w-4" />
                文字输入
              </button>
              <button
                type="button"
                aria-pressed={mode === 'photo'}
                onClick={() => setMode('photo')}
                className={`flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors ${
                  mode === 'photo' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                <Camera className="h-4 w-4" />
                拍照上传
              </button>
            </div>

            {mode === 'text' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="meal-food" className="text-sm font-semibold">
                    🍚 吃了什么
                  </label>
                  <Textarea
                    id="meal-food"
                    value={foodText}
                    onChange={(e) => setFoodText(e.target.value)}
                    placeholder="例如：一碗米饭、一份番茄炒蛋、半份清炒西兰花"
                    rows={2}
                    maxLength={300}
                  />
                  <ChipRow chips={FOOD_CHIPS} onPick={(c) => setFoodText((v) => appendChip(v, c))} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="meal-drink" className="text-sm font-semibold">
                    🥤 喝了什么
                  </label>
                  <Textarea
                    id="meal-drink"
                    value={drinkText}
                    onChange={(e) => setDrinkText(e.target.value)}
                    placeholder="例如：一杯牛奶 250ml、一杯美式咖啡"
                    rows={2}
                    maxLength={200}
                  />
                  <ChipRow chips={DRINK_CHIPS} onPick={(c) => setDrinkText((v) => appendChip(v, c))} />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    void handleFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-40 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 text-slate-500 transition-colors hover:border-emerald-500 hover:text-emerald-600"
                >
                  {photo ? (
                    <img src={photo} alt="餐食照片" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex flex-col items-center gap-2 text-sm">
                      <ImagePlus className="h-7 w-7" />
                      拍摄或上传餐食照片
                    </span>
                  )}
                </button>
                <Textarea
                  value={photoDesc}
                  onChange={(e) => setPhotoDesc(e.target.value)}
                  placeholder="简单描述照片里的食物和饮品，例如：一碗牛肉面、一杯豆浆"
                  rows={3}
                  maxLength={500}
                />
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              onClick={() => void analyze()}
              disabled={analyzing || !canAnalyze}
              className="min-h-[48px] w-full cursor-pointer bg-emerald-500 hover:bg-emerald-600"
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> AI 正在分析…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" /> AI 识别营养并看看还差什么
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {mode === 'photo' && photo && (
                <img src={photo} alt="餐食照片" className="h-14 w-14 rounded-lg object-cover" />
              )}
              <Input
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                maxLength={60}
                aria-label="餐食名称"
              />
            </div>
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.key} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={r.food.name}
                      onChange={(e) => updateName(r.key, e.target.value)}
                      maxLength={60}
                      aria-label="食物名称"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={r.food.grams}
                      onChange={(e) => updateGrams(r.key, e.target.value)}
                      aria-label="份量（克或毫升）"
                      className="w-20"
                    />
                    <span className="text-xs text-slate-500">g/ml</span>
                    <button
                      type="button"
                      aria-label="删除"
                      onClick={() => removeRow(r.key)}
                      className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {r.food.calories} kcal · 蛋白质 {r.food.protein}g · 碳水 {r.food.carbs}g · 脂肪{' '}
                    {r.food.fat}g · 纤维 {r.food.fiber}g
                  </p>
                </div>
              ))}
              {rows.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-500">已删除全部内容，请返回重新输入。</p>
              )}
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
              <span className="font-bold">{Math.round(total.calories)} kcal</span>
              <span className="ml-2 text-xs">
                蛋白质 {r1(total.protein)}g · 碳水 {r1(total.carbs)}g · 脂肪 {r1(total.fat)}g · 纤维{' '}
                {r1(total.fiber)}g
              </span>
            </div>

            {rows.length > 0 && <MealAdvicePanel advice={advice} loading={adviceLoading} />}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="min-h-[48px] cursor-pointer"
                onClick={() => {
                  setRows(null);
                  setAdvice(null);
                }}
              >
                返回修改
              </Button>
              <Button
                onClick={() => void save()}
                disabled={saving || rows.length === 0}
                className="min-h-[48px] flex-1 cursor-pointer bg-emerald-500 hover:bg-emerald-600"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                保存记录
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Mount the form only while open so every opening starts from a clean state.
const LogMealDialog = (props: Props) => (props.open ? <LogMealInner {...props} /> : null);

export default LogMealDialog;
