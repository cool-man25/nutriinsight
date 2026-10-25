import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Camera, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { MealType } from '@shared/types/nutrition';
import OmniflowBadge from '@/components/custom/OmniflowBadge';
import LogMealDialog from '@/components/custom/LogMealDialog';
import { Toaster } from '@/components/ui/sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ageGroupOf, defaultMealType, type AgeGroup } from '@/lib/nutrition';
import { api } from '@/lib/api';
import type { LayoutContext } from '@/hooks/use-layout';

const NAV_ITEMS = [
  { to: '/', label: '今日概览' },
  { to: '/meals', label: '饮食记录' },
  { to: '/trends', label: '趋势分析' },
  { to: '/profile', label: '个人中心' },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? 'text-emerald-500'
    : 'text-slate-500 hover:text-slate-900 transition-colors';

const FOOTER_LINKS = ['隐私政策', '服务条款', '联系我们'];
const IN_PREVIEW = typeof window !== 'undefined' && window.self !== window.top;

const AppLayout = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<MealType>(defaultMealType());
  const [refreshKey, setRefreshKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const { logout } = useAuth();

  const openLogMeal = useCallback((type?: MealType) => {
    setDialogType(type ?? defaultMealType());
    setDialogOpen(true);
  }, []);
  const bumpRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('adult');

  useEffect(() => {
    let cancelled = false;
    api
      .getProfile()
      .then((p) => {
        if (!cancelled) setAgeGroup(ageGroupOf(p.age));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // The age group drives the theme (colors, radius, font size) through CSS variables on <html>.
  useEffect(() => {
    document.documentElement.dataset.ageGroup = ageGroup;
    return () => {
      delete document.documentElement.dataset.ageGroup;
    };
  }, [ageGroup]);

  const context: LayoutContext = { openLogMeal, refreshKey, bumpRefresh };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/70 backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
              <span className="font-bold text-white">N</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-emerald-900 sm:text-xl">
              NutriInsight <span className="text-emerald-500">Pro</span>
            </span>
          </div>
          <div className="hidden items-center gap-8 text-sm font-medium md:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openLogMeal()}
              className="cursor-pointer rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 sm:px-5"
            >
              记录一餐
            </button>
            <button
              type="button"
              aria-label="退出登录"
              title="退出登录"
              onClick={logout}
              className="hidden h-10 w-10 cursor-pointer items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:flex"
            >
              <LogOut className="h-5 w-5" />
            </button>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="打开菜单"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <SheetHeader>
                  <SheetTitle>导航</SheetTitle>
                </SheetHeader>
                <div className="mt-4 flex flex-col gap-1 px-4">
                  {NAV_ITEMS.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `rounded-lg px-3 py-3 text-sm font-medium ${isActive ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600'}`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Outlet context={context} />
      </main>

      <button
        type="button"
        aria-label="记录一餐"
        onClick={() => openLogMeal()}
        className="fixed bottom-6 left-6 z-30 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-emerald-500 text-white shadow-2xl md:hidden print:hidden"
      >
        <Camera className="h-6 w-6" />
      </button>

      <footer className="mx-auto mt-8 max-w-screen-xl border-t border-slate-200 px-4 py-10 print:hidden">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2 opacity-50 grayscale">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-800">
              <span className="text-[10px] font-bold text-white">N</span>
            </div>
            <span className="text-sm font-bold tracking-tight">NutriInsight Pro</span>
          </div>
          <p className="text-center text-xs text-slate-500">
            © 2026 NutriInsight Pro. 基于 AI 的精准营养管理专家。
          </p>
          {IN_PREVIEW && (
            <div className="flex gap-6 text-xs font-medium text-slate-500">
              {FOOTER_LINKS.map((label) => (
                <a
                  key={label}
                  href="#/"
                  data-omniflow-feature-status="unbuilt"
                  data-omniflow-feature={label}
                  onClick={(e) => {
                    e.preventDefault();
                    window.parent.postMessage(
                      {
                        type: 'OMNIFLOW_BUILD_FEATURE',
                        feature: label,
                        prompt: `添加「${label}」页面`,
                      },
                      '*',
                    );
                  }}
                  className="cursor-pointer hover:text-emerald-500"
                >
                  {label}
                </a>
              ))}
            </div>
          )}
        </div>
      </footer>

      <LogMealDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialType={dialogType}
        onSaved={bumpRefresh}
      />
      <OmniflowBadge />
      <Toaster />
    </div>
  );
};

export default AppLayout;
