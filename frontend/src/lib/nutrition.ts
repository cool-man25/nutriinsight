import type { ActivityLevel, Goal, MealType } from '@shared/types/nutrition';

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const MEAL_LABEL: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
};

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentary: '久坐（几乎不运动）',
  light: '轻度（每周 1-3 次）',
  moderate: '中度（每周 3-5 次）',
  active: '高度（每周 6-7 次）',
  very_active: '极高（体力劳动/两练）',
};

export const GOAL_LABEL: Record<Goal, string> = {
  lose: '减脂（热量 -15%）',
  maintain: '保持体重',
  gain: '增肌（热量 +10%）',
};

export const MEAL_EMOJI: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '🍱',
  dinner: '🍜',
  snack: '🍎',
};

export type AgeGroup = 'teen' | 'adult' | 'senior';

export function ageGroupOf(age: number): AgeGroup {
  if (age < 18) return 'teen';
  if (age >= 60) return 'senior';
  return 'adult';
}

export const AGE_COPY: Record<AgeGroup, { greeting: (name: string) => string; tagline: string | null }> = {
  teen: {
    greeting: (name) => `嗨，${name} 👋`,
    tagline: '今天吃得怎么样？一起把营养拿满分吧！',
  },
  adult: {
    greeting: (name) => `你好，${name}`,
    tagline: null,
  },
  senior: {
    greeting: (name) => `您好，${name}`,
    tagline: '按时吃饭，多喝温水，身体才硬朗。',
  },
};

const pad = (n: number) => String(n).padStart(2, '0');

export function todayStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function nowTime(d: Date = new Date()): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function defaultMealType(d: Date = new Date()): MealType {
  const h = d.getHours();
  if (h < 10) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
}

export function resizeImage(file: File, maxSize = 240): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('无法处理图片'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片读取失败'));
    };
    img.src = url;
  });
}
