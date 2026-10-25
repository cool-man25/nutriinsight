import { z } from 'zod';
import { createAIService } from './aiService';
import type { AnalyzeMealResult, MealType } from '../../shared/types/nutrition';

const num = z.coerce.number().finite().min(0);

const resultSchema = z.object({
  mealName: z.string().min(1).max(60),
  foods: z
    .array(
      z.object({
        name: z.string().min(1).max(60),
        grams: num,
        calories: num,
        protein: num,
        carbs: num,
        fat: num,
        fiber: num,
      }),
    )
    .min(1)
    .max(20),
});

const MEAL_LABEL: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
};

const SYSTEM_PROMPT = `你是专业的注册营养师。用户会描述一餐吃了什么、喝了什么（食物和饮品都要识别）。请识别每种食物或饮品、估算份量并计算营养。
饮品按毫升约等于克来填写 grams（例如 250ml 牛奶 grams=250）；白开水、矿泉水、无糖茶的各项营养都为 0；含糖饮料、奶茶、果汁要计入热量与碳水。
只输出一个 JSON 对象，不要任何解释或 Markdown，格式如下：
{"mealName":"餐食简短名称","foods":[{"name":"食物或饮品名","grams":份量克数,"calories":千卡,"protein":蛋白质克,"carbs":碳水克,"fat":脂肪克,"fiber":膳食纤维克}]}
所有数值必须是数字，按该份量的总量计算（不是每100g），名称使用中文。`;

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('AI response did not contain JSON');
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function analyzeMealDescription(
  description: string,
  mealType: MealType,
  allergies: string,
): Promise<AnalyzeMealResult> {
  const ai = createAIService();
  const message = `餐次：${MEAL_LABEL[mealType]}\n描述：${description}${allergies ? `\n（用户过敏原：${allergies}）` : ''}`;
  const raw = await ai.chat(message, SYSTEM_PROMPT, { jsonMode: true });
  let parsedJson: unknown;
  try {
    parsedJson = extractJson(raw);
  } catch {
    throw new Error('AI 返回的内容不包含有效的食物清单，请重试或换一种描述');
  }
  let parsed: z.infer<typeof resultSchema>;
  try {
    parsed = resultSchema.parse(parsedJson);
  } catch {
    throw new Error('AI 返回的食物清单格式异常，请重试或换一种描述');
  }
  const r1 = (n: number) => Math.round(n * 10) / 10;
  return {
    mealName: parsed.mealName,
    foods: parsed.foods.map((f) => ({
      name: f.name,
      grams: Math.round(f.grams),
      calories: Math.round(f.calories),
      protein: r1(f.protein),
      carbs: r1(f.carbs),
      fat: r1(f.fat),
      fiber: r1(f.fiber),
    })),
  };
}
