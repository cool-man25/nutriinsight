import type {
  ActivityLevel,
  GapItem,
  Meal,
  NutrientTotals,
  Profile,
  ScoreBreakdown,
  Suggestion,
  TrendPoint,
} from '../../shared/types/nutrition';

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const round = (n: number, digits = 0) => {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
};

export function computeTargets(profile: Profile): NutrientTotals {
  const bmr =
    10 * profile.weightKg +
    6.25 * profile.heightCm -
    5 * profile.age +
    (profile.gender === 'male' ? 5 : -161);
  const tdee = bmr * ACTIVITY_FACTOR[profile.activityLevel];
  const goalFactor = profile.goal === 'lose' ? 0.85 : profile.goal === 'gain' ? 1.1 : 1;
  const calories = Math.max(1200, round(tdee * goalFactor));
  const proteinPerKg = profile.goal === 'gain' ? 2.0 : profile.goal === 'lose' ? 1.8 : 1.4;
  const protein = round(profile.weightKg * proteinPerKg);
  const fat = round((calories * 0.27) / 9);
  const carbs = Math.max(50, round((calories - protein * 4 - fat * 9) / 4));
  const fiber = Math.max(20, round((calories / 1000) * 14));
  return { calories, protein, carbs, fat, fiber };
}

export function sumMeals(meals: Meal[]): NutrientTotals {
  const t = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
      fiber: acc.fiber + m.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );
  return {
    calories: round(t.calories),
    protein: round(t.protein, 1),
    carbs: round(t.carbs, 1),
    fat: round(t.fat, 1),
    fiber: round(t.fiber, 1),
  };
}

const closeness = (ratio: number) => (ratio <= 1 ? ratio : Math.max(0, 1 - (ratio - 1) * 1.5));

export function computeScore(
  totals: NutrientTotals,
  targets: NutrientTotals,
  meals: Meal[],
): ScoreBreakdown {
  if (meals.length === 0 || totals.calories <= 0) {
    return { total: 0, macro: 0, micro: 0, balance: 0, diversity: 0 };
  }
  const ratios = [
    totals.calories / targets.calories,
    totals.protein / targets.protein,
    totals.carbs / targets.carbs,
    totals.fat / targets.fat,
  ];
  const macro = (ratios.reduce((a, r) => a + closeness(r), 0) / ratios.length) * 40;
  const micro = Math.min(1, totals.fiber / targets.fiber) * 35;
  const pct = (t: NutrientTotals) => ({
    p: (t.protein * 4) / Math.max(1, t.calories),
    c: (t.carbs * 4) / Math.max(1, t.calories),
    f: (t.fat * 9) / Math.max(1, t.calories),
  });
  const a = pct(totals);
  const b = pct(targets);
  const diff = Math.abs(a.p - b.p) + Math.abs(a.c - b.c) + Math.abs(a.f - b.f);
  const balance = Math.max(0, 1 - diff / 0.6) * 15;
  const names = new Set<string>();
  meals.forEach((m) => m.foods.forEach((f) => names.add(f.name.trim().toLowerCase())));
  const diversity = Math.min(1, names.size / 8) * 10;
  const parts = {
    macro: round(macro),
    micro: round(micro),
    balance: round(balance),
    diversity: round(diversity),
  };
  return { total: parts.macro + parts.micro + parts.balance + parts.diversity, ...parts };
}

export function buildGaps(totals: NutrientTotals, targets: NutrientTotals): GapItem[] {
  const defs: Array<Pick<GapItem, 'key' | 'label' | 'unit'>> = [
    { key: 'protein', label: '蛋白质', unit: 'g' },
    { key: 'carbs', label: '碳水化合物', unit: 'g' },
    { key: 'fat', label: '脂肪', unit: 'g' },
    { key: 'fiber', label: '膳食纤维', unit: 'g' },
  ];
  return defs
    .map((d) => {
      const intake = round(totals[d.key]);
      const target = targets[d.key];
      const ratio = target > 0 ? intake / target : 0;
      const status: GapItem['status'] = ratio < 0.9 ? 'low' : ratio > 1.1 ? 'high' : 'ok';
      return {
        ...d,
        intake,
        target,
        percent: round(ratio * 100),
        status,
        severity: status === 'low' ? round(1 - ratio, 3) : 0,
      };
    })
    .sort((a, b) => b.severity - a.severity);
}

export function buildSuggestions(
  profile: Profile,
  totals: NutrientTotals,
  targets: NutrientTotals,
  gaps: GapItem[],
  mealCount: number,
): Suggestion[] {
  const out: Suggestion[] = [];
  if (mealCount === 0) {
    out.push({
      id: 'start',
      level: 'info',
      text: '今天还没有餐食记录，点击「拍照识餐」记录第一餐，即可生成个性化建议。',
    });
  }
  gaps
    .filter((g) => g.status === 'low' && mealCount > 0)
    .forEach((g) => {
      const missing = Math.max(1, round(g.target - g.intake));
      if (g.key === 'protein') {
        const grams = Math.min(300, Math.max(100, Math.ceil(missing / 0.23 / 50) * 50));
        out.push({
          id: 'protein',
          level: 'info',
          text: `蛋白质还差 ${missing}g，今晚建议补充 ${grams}g 鸡胸肉（约 ${round(grams * 0.23)}g 蛋白质）。`,
        });
      } else if (g.key === 'fiber') {
        out.push({
          id: 'fiber',
          level: 'warn',
          text: `膳食纤维还差 ${missing}g，建议晚餐增加 200g 绿叶蔬菜或一份粗粮（燕麦、糙米）。`,
        });
      } else if (g.key === 'carbs') {
        const grams = Math.min(300, Math.max(100, Math.ceil(missing / 0.26 / 50) * 50));
        out.push({
          id: 'carbs',
          level: 'info',
          text: `碳水还差 ${missing}g，可加 ${grams}g 糙米饭或红薯作为优质主食。`,
        });
      } else {
        out.push({
          id: 'fat',
          level: 'info',
          text: `脂肪还差 ${missing}g，可加一小把坚果（约 30g）或半个牛油果。`,
        });
      }
    });
  if (totals.calories > targets.calories * 1.1) {
    out.push({
      id: 'calories-high',
      level: 'warn',
      text: `今日热量已超出目标 ${round(totals.calories - targets.calories)} kcal，晚间建议选择清淡、低脂的食物。`,
    });
  }
  gaps
    .filter((g) => g.status === 'high')
    .forEach((g) =>
      out.push({
        id: `${g.key}-high`,
        level: 'warn',
        text: `${g.label}摄入已达目标的 ${g.percent}%，接下来请适当控制。`,
      }),
    );
  const water = round((profile.weightKg * 35) / 100) * 100;
  out.push({
    id: 'water',
    level: 'info',
    text: `按体重估算，全天建议饮水约 ${water}ml，记得分次补水。`,
  });
  return out;
}

function addDays(date: string, delta: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return dt.toISOString().slice(0, 10);
}

export function dateRange(endDate: string, days: number): string[] {
  return Array.from({ length: days }, (_, i) => addDays(endDate, i - (days - 1)));
}

export function buildTrend(
  endDate: string,
  days: number,
  meals: Meal[],
  targets: NutrientTotals,
): TrendPoint[] {
  const byDate = new Map<string, Meal[]>();
  meals.forEach((m) => {
    const list = byDate.get(m.eatDate) ?? [];
    list.push(m);
    byDate.set(m.eatDate, list);
  });
  return dateRange(endDate, days).map((date) => {
    const list = byDate.get(date) ?? [];
    const totals = sumMeals(list);
    return {
      date,
      score: computeScore(totals, targets, list).total,
      calories: totals.calories,
      protein: totals.protein,
      mealCount: list.length,
    };
  });
}
