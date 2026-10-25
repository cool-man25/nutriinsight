import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/config/constants';

interface LoginResponse {
  success: boolean;
  data?: { token: string };
  error?: string | { message?: string };
}

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated === true) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('请输入邮箱和密码');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const body = (await res.json()) as LoginResponse;
      if (res.ok && body.success && body.data?.token) {
        login(body.data.token);
        toast.success('登录成功');
        navigate('/', { replace: true });
        return;
      }
      setError(res.status === 401 ? '邮箱或密码不正确' : '登录失败，请稍后重试');
    } catch {
      setError('网络异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-[#F8FAFC] text-slate-900 lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-emerald-600 p-12 text-white lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
            <span className="font-bold text-emerald-600">N</span>
          </div>
          <span className="text-xl font-bold tracking-tight">NutriInsight Pro</span>
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-bold leading-tight">拍照记录饮食<br />获得专属营养建议</h2>
          <p className="max-w-md leading-relaxed text-emerald-50">
            每个人拥有独立账号与个人档案，营养目标、评分与趋势完全基于你自己的身体数据。
          </p>
        </div>
        <p className="text-xs text-emerald-100">© 2026 NutriInsight Pro</p>
      </div>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
              <span className="font-bold text-white">N</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-emerald-900">
              NutriInsight <span className="text-emerald-500">Pro</span>
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">欢迎回来</h1>
            <p className="mt-1 text-sm text-slate-500">登录你的账号，继续管理今天的饮食</p>
          </div>
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] sm:p-6"
          >
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-full bg-emerald-500 py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-60"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              登录
            </button>
          </form>
          <p className="text-center text-sm text-slate-500">
            还没有账号？{' '}
            <Link to="/signup" className="cursor-pointer font-semibold text-emerald-600 hover:underline">
              立即注册
            </Link>
          </p>
        </div>
      </div>
      <Toaster />
    </div>
  );
};

export default Login;
