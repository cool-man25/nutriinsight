export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'lose' | 'maintain' | 'gain';

export interface FoodItem {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface Profile {
  id: string;
  name: string;
  heightCm: number;
  weightKg: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: Goal;
  allergies: string;
  preferences: string;
  onboarded: boolean;
}

export type ProfileInput = Omit<Profile, 'id' | 'onboarded'>;

export interface NutrientTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface Meal extends NutrientTotals {
  id: string;
  mealType: MealType;
  name: string;
  eatDate: string;
  eatTime: string;
  photoUrl: string | null;
  foods: FoodItem[];
}

export interface MealInput {
  mealType: MealType;
  name: string;
  eatDate: string;
  eatTime: string;
  photoUrl?: string | null;
  foods: FoodItem[];
}

export interface AnalyzeMealRequest {
  description: string;
  mealType: MealType;
}

export interface AnalyzeMealResult {
  mealName: string;
  foods: FoodItem[];
}

export interface ScoreBreakdown {
  total: number;
  macro: number;
  micro: number;
  balance: number;
  diversity: number;
}

export interface GapItem {
  key: 'protein' | 'carbs' | 'fat' | 'fiber';
  label: string;
  unit: string;
  intake: number;
  target: number;
  percent: number;
  status: 'low' | 'ok' | 'high';
  severity: number;
}

export interface Suggestion {
  id: string;
  level: 'info' | 'warn';
  text: string;
}

export interface TrendPoint {
  date: string;
  score: number;
  calories: number;
  protein: number;
  mealCount: number;
}

export interface DashboardData {
  date: string;
  profile: Profile;
  targets: NutrientTotals;
  totals: NutrientTotals;
  completion: number;
  score: ScoreBreakdown;
  gaps: GapItem[];
  suggestions: Suggestion[];
  meals: Meal[];
  trend: TrendPoint[];
}

export interface MealAdviceRequest {
  mealType: MealType;
  foods: FoodItem[];
}

export interface MealNutrientStatus {
  key: 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber';
  label: string;
  unit: string;
  intake: number;
  target: number;
  percent: number;
  status: 'low' | 'ok' | 'high';
  missing: number;
}

export interface FoodGroupStatus {
  id: string;
  label: string;
  present: boolean;
  recommended: boolean;
}

export interface MealAdvice {
  summary: string;
  balanced: boolean;
  mealShare: number;
  nutrients: MealNutrientStatus[];
  groups: FoodGroupStatus[];
  suggestions: Suggestion[];
}
