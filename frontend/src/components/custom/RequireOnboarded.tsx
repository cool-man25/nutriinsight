import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

type GateStatus = 'loading' | 'ready' | 'needs-onboarding' | 'error';

const RequireOnboarded = () => {
  const [status, setStatus] = useState<GateStatus>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .getProfile()
      .then((p) => {
        if (!cancelled) setStatus(p.onboarded ? 'ready' : 'needs-onboarding');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    );
  }
  if (status === 'needs-onboarding') return <Navigate to="/onboarding" replace />;
  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8FAFC] px-4 text-center">
        <p className="text-sm text-slate-500">加载个人信息失败，请检查网络后重试</p>
        <button
          type="button"
          onClick={() => {
            setStatus('loading');
            setAttempt((n) => n + 1);
          }}
          className="min-h-[44px] cursor-pointer rounded-full bg-emerald-500 px-6 text-sm font-semibold text-white hover:opacity-90"
        >
          重试
        </button>
      </div>
    );
  }
  return <Outlet />;
};

export default RequireOnboarded;
