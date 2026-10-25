import { useOutletContext } from 'react-router-dom';
import type { MealType } from '@shared/types/nutrition';

export interface LayoutContext {
  openLogMeal: (type?: MealType) => void;
  refreshKey: number;
  bumpRefresh: () => void;
}

export function useLayout(): LayoutContext {
  return useOutletContext<LayoutContext>();
}
