import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  deleteMeal,
  getOrCreateProfile,
  insertMeal,
  listMealsInRange,
  updateProfile,
} from '../repositories/nutritionRepository';
import {
  buildGaps,
  buildSuggestions,
  buildTrend,
  computeScore,
  computeTargets,
  dateRange,
  sumMeals,
} from '../services/nutritionService';
import { analyzeMealDescription } from '../services/mealAnalysisService';
import { buildMealAdvice } from '../services/mealAdviceService';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import type {
  DashboardData,
  FoodItem,
  MealInput,
  ProfileInput,
} from '../../shared/types/nutrition';

const router = Router();

// Every nutrition endpoint is scoped to the signed-in user.
router.use(authenticateJWT);

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const mealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);

const profileSchema = z.object({
  name: z.string().trim().min(1).max(30),
  heightCm: z.number().int().min(100).max(250),
  weightKg: z.number().min(25).max(300),
  age: z.number().int().min(10).max(100),
  gender: z.enum(['male', 'female']),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  goal: z.enum(['lose', 'maintain', 'gain']),
  allergies: z.string().max(200).default(''),
  preferences: z.string().max(200).default(''),
});

const foodSchema = z.object({
  name: z.string().trim().min(1).max(60),
  grams: z.number().min(0).max(5000),
  calories: z.number().min(0).max(10000),
  protein: z.number().min(0).max(1000),
  carbs: z.number().min(0).max(1000),
  fat: z.number().min(0).max(1000),
  fiber: z.number().min(0).max(500),
});

const mealSchema = z.object({
  mealType: mealTypeSchema,
  name: z.string().trim().min(1).max(60),
  eatDate: dateSchema,
  eatTime: z.string().regex(/^\d{2}:\d{2}$/),
  photoUrl: z.string().max(200000).nullable().optional(),
  foods: z.array(foodSchema).min(1).max(30),
});

const analyzeSchema = z.object({
  description: z.string().trim().min(2).max(500),
  mealType: mealTypeSchema,
});

const adviceSchema = z.object({
  mealType: mealTypeSchema,
  foods: z.array(foodSchema).min(1).max(30),
});

const handler =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

const bad = (res: Response, message: string) =>
  res.status(400).json({ success: false, error: message });

const currentUser = (req: Request) => {
  const user = (req as AuthRequest).user!;
  return { id: user.id, name: user.name };
};

router.get(
  '/profile',
  handler(async (req, res) => {
    const user = currentUser(req);
    res.json({ success: true, data: await getOrCreateProfile(user.id, user.name) });
  }),
);

router.put(
  '/profile',
  handler(async (req, res) => {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) return bad(res, '个人资料格式不正确');
    const user = currentUser(req);
    res.json({
      success: true,
      data: await updateProfile(user.id, user.name, parsed.data as ProfileInput),
    });
  }),
);

router.get(
  '/meals',
  handler(async (req, res) => {
    const end = dateSchema.safeParse(req.query.end);
    const days = Math.min(60, Math.max(1, Number(req.query.days) || 1));
    if (!end.success) return bad(res, 'end date is required');
    const range = dateRange(end.data, days);
    const meals = await listMealsInRange(
      currentUser(req).id,
      range[0],
      range[range.length - 1],
    );
    res.json({ success: true, data: meals });
  }),
);

router.post(
  '/meals/analyze',
  handler(async (req, res) => {
    const parsed = analyzeSchema.safeParse(req.body);
    if (!parsed.success) return bad(res, '请描述你吃了什么（至少 2 个字）');
    const user = currentUser(req);
    const profile = await getOrCreateProfile(user.id, user.name);
    try {
      const result = await analyzeMealDescription(
        parsed.data.description,
        parsed.data.mealType,
        profile.allergies,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Meal analysis failed:', error);
      const message = error instanceof Error ? error.message : '未知错误';
      const configured = Boolean(process.env.DEEPSEEK_API_KEY);
      res.status(configured ? 502 : 500).json({
        success: false,
        error: configured
          ? `AI 识别失败：${message}`
          : 'AI 服务未配置：缺少 DEEPSEEK_API_KEY 环境变量，请在后端 .env 中设置后重启服务',
      });
    }
  }),
);

router.post(
  '/meals',
  handler(async (req, res) => {
    const parsed = mealSchema.safeParse(req.body);
    if (!parsed.success) return bad(res, '餐食记录格式不正确');
    const user = currentUser(req);
    const meal = await insertMeal(user.id, user.name, parsed.data as MealInput);
    res.status(201).json({ success: true, data: meal });
  }),
);

router.post(
  '/meals/advice',
  handler(async (req, res) => {
    const parsed = adviceSchema.safeParse(req.body);
    if (!parsed.success) return bad(res, '餐食内容格式不正确');
    const user = currentUser(req);
    const profile = await getOrCreateProfile(user.id, user.name);
    res.json({
      success: true,
      data: buildMealAdvice(profile, parsed.data.mealType, parsed.data.foods as FoodItem[]),
    });
  }),
);

router.delete(
  '/meals/:id',
  handler(async (req, res) => {
    const id = req.params.id as string;
    const ok = await deleteMeal(currentUser(req).id, id);
    if (!ok) return res.status(404).json({ success: false, error: '记录不存在' });
    res.json({ success: true, data: { id } });
  }),
);

router.get(
  '/trend',
  handler(async (req, res) => {
    const end = dateSchema.safeParse(req.query.end);
    const days = Number(req.query.days) === 30 ? 30 : 7;
    if (!end.success) return bad(res, 'end date is required');
    const user = currentUser(req);
    const profile = await getOrCreateProfile(user.id, user.name);
    const targets = computeTargets(profile);
    const range = dateRange(end.data, days);
    const meals = await listMealsInRange(user.id, range[0], range[range.length - 1]);
    res.json({ success: true, data: buildTrend(end.data, days, meals, targets) });
  }),
);

router.get(
  '/dashboard',
  handler(async (req, res) => {
    const date = dateSchema.safeParse(req.query.date);
    if (!date.success) return bad(res, 'date is required');
    const user = currentUser(req);
    const profile = await getOrCreateProfile(user.id, user.name);
    const targets = computeTargets(profile);
    const range = dateRange(date.data, 7);
    const weekMeals = await listMealsInRange(user.id, range[0], date.data);
    const meals = weekMeals.filter((m) => m.eatDate === date.data);
    const totals = sumMeals(meals);
    const gaps = buildGaps(totals, targets);
    const data: DashboardData = {
      date: date.data,
      profile,
      targets,
      totals,
      completion: Math.round((totals.calories / targets.calories) * 100),
      score: computeScore(totals, targets, meals),
      gaps,
      suggestions: buildSuggestions(profile, totals, targets, gaps, meals.length),
      meals,
      trend: buildTrend(date.data, 7, weekMeals, targets),
    };
    res.json({ success: true, data });
  }),
);

export default router;
