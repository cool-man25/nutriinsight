import type {
  FoodGroupStatus,
  FoodItem,
  MealAdvice,
  MealNutrientStatus,
  MealType,
  NutrientTotals,
  Profile,
  Suggestion,
} from '../../shared/types/nutrition';
import { computeTargets } from './nutritionService';

type NutrientKey = keyof NutrientTotals;
type FillKey = 'protein' | 'carbs' | 'fat' | 'fiber';

const MEAL_SHARE: Record<MealType, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1,
};

const NUTRIENT_DEFS: Array<{ key: NutrientKey; label: string; unit: string }> = [
  { key: 'calories', label: '热量', unit: 'kcal' },
  { key: 'protein', label: '蛋白质', unit: 'g' },
  { key: 'carbs', label: '碳水化合物', unit: 'g' },
  { key: 'fat', label: '脂肪', unit: 'g' },
  { key: 'fiber', label: '膳食纤维', unit: 'g' },
];

interface Candidate {
  name: string;
  tags: string[];
  density: number; // grams of the nutrient per 100g of food
}

const CANDIDATES: Record<FillKey, Candidate[]> = {
  protein: [
    { name: '鸡胸肉', tags: ['鸡', '肉'], density: 23 },
    { name: '豆腐', tags: ['豆', '大豆'], density: 8 },
    { name: '水煮蛋', tags: ['蛋'], density: 13 },
    { name: '清蒸鱼肉', tags: ['鱼', '海鲜'], density: 20 },
    { name: '无糖酸奶', tags: ['奶', '乳'], density: 5 },
  ],
  carbs: [
    { name: '糙米饭', tags: ['米'], density: 26 },
    { name: '红薯', tags: ['薯'], density: 20 },
    { name: '全麦面包', tags: ['麦', '面包', '麸质'], density: 45 },
  ],
  fat: [
    { name: '原味坚果', tags: ['坚果', '花生', '核桃', '杏仁', '腰果'], density: 50 },
    { name: '牛油果', tags: ['牛油果'], density: 15 },
    { name: '三文鱼', tags: ['鱼', '海鲜'], density: 13 },
  ],
  fiber: [
    { name: '西兰花', tags: [], density: 2.6 },
    { name: '燕麦片', tags: ['麦', '燕麦', '麸质'], density: 10 },
    { name: '苹果', tags: ['苹果'], density: 2.4 },
  ],
};

const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function avoidTokens(profile: Profile): string[] {
  const tokens = profile.allergies
    .split(/[,，、;；\s]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  if (/素食|吃素/.test(profile.preferences)) {
    tokens.push('鸡', '鱼', '肉', '海鲜', '虾');
  }
  return tokens;
}

function isBlocked(c: Candidate, tokens: string[]): boolean {
  return tokens.some(
    (t) =>
      c.name.includes(t) ||
      t.includes(c.name) ||
      c.tags.some((tag) => tag.includes(t) || t.includes(tag)),
  );
}

const has = (name: string, words: string[]) => words.some((w) => name.includes(w));

interface GroupDef {
  id: string;
  label: string;
  match: (name: string) => boolean;
}

const GROUPS: GroupDef[] = [
  {
    id: 'protein',
    label: '优质蛋白',
    match: (n) =>
      has(n, ['肉', '鸡', '鸭', '鱼', '虾', '蛋', '豆腐', '豆', '牛', '猪', '羊', '蟹', '贝', '火腿']),
  },
  {
    id: 'grain',
    label: '主食谷物',
    match: (n) =>
      has(n, ['饭', '面', '粥', '馒头', '饼', '米', '燕麦', '玉米', '薯', '土豆', '粉', '包子', '饺', '麦', '吐司']),
  },
  {
    id: 'veg',
    label: '蔬菜',
    match: (n) =>
      has(n, [
        '菜', '蔬', '西兰花', '番茄', '西红柿', '黄瓜', '胡萝卜', '菠菜', '生菜', '茄子', '青椒',
        '洋葱', '蘑菇', '菇', '芹菜', '冬瓜', '南瓜', '豆角', '沙拉', '萝卜', '韭', '笋', '藕',
        '西葫芦', '秋葵',
      ]),
  },
  {
    id: 'fruit',
    label: '水果',
    match: (n) =>
      has(n, [
        '水果', '苹果', '香蕉', '橙', '橘', '梨', '桃', '葡萄', '西瓜', '草莓', '蓝莓', '芒果',
        '猕猴桃', '柚', '莓', '荔枝', '樱桃', '菠萝', '柠檬', '哈密瓜',
      ]),
  },
  {
    id: 'dairy',
    label: '奶类豆浆',
    match: (n) => has(n, ['牛奶', '酸奶', '奶酪', '芝士', '乳', '豆浆', '奶粉']),
  },
  {
    id: 'drink',
    label: '饮品',
    match: (n) =>
      has(n, ['茶', '咖啡', '果汁', '饮料', '豆浆', '牛奶', '酸奶', '可乐', '汽水', '汤', '饮']) ||
      n.trim().endsWith('水'),
  },
];

const RECOMMENDED_GROUPS: Record<MealType, string[]> = {
  breakfast: ['protein', 'grain', 'dairy', 'fruit', 'drink'],
  lunch: ['protein', 'grain', 'veg', 'drink'],
  dinner: ['protein', 'veg', 'grain', 'drink'],
  snack: ['fruit', 'dairy', 'drink'],
};

function nutrientSuggestion(
  key: FillKey,
  label: string,
  unit: string,
  missing: number,
  tokens: string[],
): string | null {
  const candidate = CANDIDATES[key].find((c) => !isBlocked(c, tokens));
  if (!candidate) return null;
  const grams = clamp(Math.round(missing / (candidate.density / 100) / 10) * 10, 30, 300);
  const got = round1((grams * candidate.density) / 100);
  return `${label}还差约 ${missing}${unit}，可以再加 ${grams}g ${candidate.name}（约 ${got}g ${label}）。`;
}

function groupSuggestion(id: string, tokens: string[]): string | null {
  const milkBlocked = tokens.some((t) => t.includes('奶') || t.includes('乳') || '奶乳'.includes(t));
  const soyBlocked = tokens.some((t) => t.includes('豆') || t.includes('大豆'));
  switch (id) {
    case 'veg':
      return '这一餐还没有蔬菜，建议加 150g 绿叶蔬菜，补充维生素 C、叶酸、钾和膳食纤维。';
    case 'fruit':
      return '可以搭配一份水果（约 150g，如苹果、橙子或莓类），补充维生素 C 和抗氧化物。';
    case 'dairy':
      if (!milkBlocked) return '加一杯 250ml 牛奶或无糖酸奶，补充钙和优质蛋白。';
      if (!soyBlocked) return '加一杯 250ml 无糖豆浆，补充植物蛋白和钙。';
      return null;
    case 'drink':
      return '这一餐还没有饮品，可以配一杯 200-300ml 温水或无糖饮品，保持水分充足。';
    default:
      return null;
  }
}

export function buildMealAdvice(
  profile: Profile,
  mealType: MealType,
  foods: FoodItem[],
): MealAdvice {
  const daily = computeTargets(profile);
  const share = MEAL_SHARE[mealType];
  const tokens = avoidTokens(profile);

  const intake: NutrientTotals = foods.reduce(
    (acc, f) => ({
      calories: acc.calories + f.calories,
      protein: acc.protein + f.protein,
      carbs: acc.carbs + f.carbs,
      fat: acc.fat + f.fat,
      fiber: acc.fiber + f.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );

  const nutrients: MealNutrientStatus[] = NUTRIENT_DEFS.map((d) => {
    const target = d.key === 'calories' ? Math.round(daily.calories * share) : round1(daily[d.key] * share);
    const value = round1(intake[d.key]);
    const ratio = target > 0 ? value / target : 0;
    const highLimit = d.key === 'calories' ? 1.2 : 1.25;
    const status: MealNutrientStatus['status'] =
      ratio < 0.8 ? 'low' : ratio > highLimit ? 'high' : 'ok';
    return {
      key: d.key,
      label: d.label,
      unit: d.unit,
      intake: d.key === 'calories' ? Math.round(value) : value,
      target,
      percent: Math.round(ratio * 100),
      status,
      missing: status === 'low' ? Math.max(1, Math.round(target - value)) : 0,
    };
  });

  const recommended = RECOMMENDED_GROUPS[mealType];
  const groups: FoodGroupStatus[] = GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    present: foods.some((f) => g.match(f.name)),
    recommended: recommended.includes(g.id),
  }));

  const suggestions: Suggestion[] = [];
  const lowNutrients = nutrients
    .filter((n) => n.status === 'low' && n.key !== 'calories')
    .sort((a, b) => a.percent - b.percent);
  lowNutrients.forEach((n) => {
    const text = nutrientSuggestion(n.key as FillKey, n.label, n.unit, n.missing, tokens);
    if (text) suggestions.push({ id: `low-${n.key}`, level: 'info', text });
  });

  const calorie = nutrients[0];
  if (calorie.status === 'high') {
    suggestions.push({
      id: 'high-calories',
      level: 'warn',
      text: `这一餐热量约为本餐建议量的 ${calorie.percent}%，下一餐建议选择清淡、低脂的食物。`,
    });
  }
  nutrients
    .filter((n) => n.status === 'high' && (n.key === 'fat' || n.key === 'carbs'))
    .forEach((n) =>
      suggestions.push({
        id: `high-${n.key}`,
        level: 'warn',
        text: `${n.label}偏高（约为本餐建议量的 ${n.percent}%），可以少放油或减少主食份量。`,
      }),
    );

  groups
    .filter((g) => g.recommended && !g.present && ['veg', 'fruit', 'dairy', 'drink'].includes(g.id))
    .forEach((g) => {
      const text = groupSuggestion(g.id, tokens);
      if (text) suggestions.push({ id: `group-${g.id}`, level: 'info', text });
    });

  if (profile.age < 18) {
    suggestions.push({
      id: 'age-teen',
      level: 'info',
      text: '成长发育期需要充足的钙和蛋白质，每天保证 2 份奶制品，少喝含糖饮料哦。',
    });
  } else if (profile.age >= 60) {
    suggestions.push({
      id: 'age-senior',
      level: 'info',
      text: '用餐尽量软烂易消化、细嚼慢咽，并注意补充钙和优质蛋白（奶、豆制品、鱼）。',
    });
  }

  const lowLabels = lowNutrients.map((n) => n.label);
  const missingGroups = groups
    .filter((g) => g.recommended && !g.present && ['protein', 'veg', 'fruit', 'dairy'].includes(g.id))
    .map((g) => g.label);
  const needs = [...lowLabels, ...missingGroups.filter((l) => !lowLabels.includes(l))];
  const balanced = needs.length === 0 && calorie.status !== 'high';
  const summary = balanced
    ? '这一餐的营养搭配比较均衡，继续保持！'
    : needs.length > 0
      ? `这一餐还差：${needs.join('、')}。看看下面的补充建议吧。`
      : '这一餐营养基本够了，注意控制份量。';

  return {
    summary,
    balanced,
    mealShare: share,
    nutrients,
    groups,
    suggestions: suggestions.slice(0, 6),
  };
}
