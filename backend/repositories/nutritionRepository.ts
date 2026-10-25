import { randomUUID } from 'crypto';
import { and, asc, eq, gte, lte } from 'drizzle-orm';
import { db } from '../db';
import { nutriMeals, nutriProfiles } from '../db/schema';
import type {
  ActivityLevel,
  FoodItem,
  Gender,
  Goal,
  Meal,
  MealInput,
  MealType,
  Profile,
  ProfileInput,
} from '../../shared/types/nutrition';

// A profile row shares its id with the owning user id (one profile per user).
const DEFAULT_PROFILE: ProfileInput = {
  name: '',
  heightCm: 170,
  weightKg: 65,
  age: 28,
  gender: 'male',
  activityLevel: 'moderate',
  goal: 'maintain',
  allergies: '',
  preferences: '',
};

function toProfile(row: typeof nutriProfiles.$inferSelect): Profile {
  return {
    id: row.id,
    name: row.name,
    heightCm: row.heightCm,
    weightKg: row.weightKg,
    age: row.age,
    gender: row.gender as Gender,
    activityLevel: row.activityLevel as ActivityLevel,
    goal: row.goal as Goal,
    allergies: row.allergies,
    preferences: row.preferences,
    onboarded: row.onboarded,
  };
}

function toMeal(row: typeof nutriMeals.$inferSelect): Meal {
  return {
    id: row.id,
    mealType: row.mealType as MealType,
    name: row.name,
    eatDate: row.eatDate,
    eatTime: row.eatTime,
    photoUrl: row.photoUrl,
    foods: (row.foods as FoodItem[]) ?? [],
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    fiber: row.fiber,
  };
}

export async function getOrCreateProfile(userId: string, userName = ''): Promise<Profile> {
  const rows = await db
    .select()
    .from(nutriProfiles)
    .where(eq(nutriProfiles.id, userId))
    .limit(1);
  if (rows[0]) return toProfile(rows[0]);
  const inserted = await db
    .insert(nutriProfiles)
    .values({
      id: userId,
      ...DEFAULT_PROFILE,
      name: userName.trim().slice(0, 30) || '新用户',
      onboarded: false,
    })
    .onConflictDoNothing()
    .returning();
  if (inserted[0]) return toProfile(inserted[0]);
  const again = await db
    .select()
    .from(nutriProfiles)
    .where(eq(nutriProfiles.id, userId))
    .limit(1);
  return toProfile(again[0]);
}

export async function updateProfile(
  userId: string,
  userName: string,
  input: ProfileInput,
): Promise<Profile> {
  await getOrCreateProfile(userId, userName);
  const rows = await db
    .update(nutriProfiles)
    .set({ ...input, onboarded: true, updatedAt: new Date() })
    .where(eq(nutriProfiles.id, userId))
    .returning();
  return toProfile(rows[0]);
}

export async function listMealsInRange(
  userId: string,
  start: string,
  end: string,
): Promise<Meal[]> {
  const rows = await db
    .select()
    .from(nutriMeals)
    .where(
      and(
        eq(nutriMeals.profileId, userId),
        gte(nutriMeals.eatDate, start),
        lte(nutriMeals.eatDate, end),
      ),
    )
    .orderBy(asc(nutriMeals.eatDate), asc(nutriMeals.eatTime));
  return rows.map(toMeal);
}

export async function insertMeal(
  userId: string,
  userName: string,
  input: MealInput,
): Promise<Meal> {
  await getOrCreateProfile(userId, userName);
  const sum = (key: keyof FoodItem) =>
    Math.round(input.foods.reduce((acc, f) => acc + Number(f[key] || 0), 0) * 10) / 10;
  const rows = await db
    .insert(nutriMeals)
    .values({
      id: randomUUID(),
      profileId: userId,
      mealType: input.mealType,
      name: input.name,
      eatDate: input.eatDate,
      eatTime: input.eatTime,
      photoUrl: input.photoUrl ?? null,
      foods: input.foods,
      calories: sum('calories'),
      protein: sum('protein'),
      carbs: sum('carbs'),
      fat: sum('fat'),
      fiber: sum('fiber'),
    })
    .returning();
  return toMeal(rows[0]);
}

export async function deleteMeal(userId: string, id: string): Promise<boolean> {
  const rows = await db
    .delete(nutriMeals)
    .where(and(eq(nutriMeals.id, id), eq(nutriMeals.profileId, userId)))
    .returning({ id: nutriMeals.id });
  return rows.length > 0;
}
