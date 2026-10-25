import { useNavigate } from 'react-router-dom';
import ProfileForm from '@/components/custom/ProfileForm';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';

const Onboarding = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 text-slate-900 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
              <span className="font-bold text-white">N</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-emerald-900">
              NutriInsight <span className="text-emerald-500">Pro</span>
            </span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="min-h-[44px] cursor-pointer px-2 text-sm text-slate-500 hover:text-slate-900"
          >
            退出登录
          </button>
        </div>
        <div>
          <p className="text-sm font-medium text-emerald-600">最后一步</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">完善你的个人信息</h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            我们会根据你的身高、体重、年龄、活动水平和健康目标，计算专属的每日营养基准。
          </p>
        </div>
        <ProfileForm mode="onboarding" onSaved={() => navigate('/', { replace: true })} />
      </div>
      <Toaster />
    </div>
  );
};

export default Onboarding;
