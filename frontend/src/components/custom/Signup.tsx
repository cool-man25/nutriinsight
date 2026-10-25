import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/config/constants';

interface SignupResponse {
  success: boolean;
  data?: { token: string };
  error?: string | { message?: string };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Signup = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    if (!name.trim()) return setError('请填写昵称');
    if (!EMAIL_PATTERN.test(email.trim())) return setError('请输入有效的邮箱地址');
    if (password.length < 6) return setError('密码至少 6 位');
    if (password !== confirmPassword) return setError('两次输入的密码不一致');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          confirmPassword,
        }),
      });
      const body = (await res.json()) as SignupResponse;
      if (res.ok && body.success && body.data?.token) {
        login(body.data.token);
        toast.success('注册成功，请完善个人信息');
        navigate('/', { replace: true });
        return;
      }
      const err = body.error;
      const message = typeof err === 'string' ? err : err?.message;
      setError(
        res.status === 400 && message && /exist|already/i.test(message)
          ? '该邮箱已被注册，请直接登录'
          : '注册失败，请检查填写内容后重试',
      );
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
          <h2 className="text-4xl font-bold leading-tight">创建账号<br />开启个性化营养管理</h2>
          <p className="max-w-md leading-relaxed text-emerald-50">
            注册后填写身高、体重、年龄等基本信息，系统会为你生成专属的每日营养目标。
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
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">创建账号</h1>
            <p className="mt-1 text-sm text-slate-500">几秒钟完成注册，然后设置你的个人信息</p>
          </div>
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] sm:p-6"
          >
            <div className="space-y-2">
              <Label htmlFor="name">昵称</Label>
              <Input id="name" autoComplete="name" maxLength={30} placeholder="怎么称呼你" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" type="password" autoComplete="new-password" placeholder="至少 6 位" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input id="confirmPassword" type="password" autoComplete="new-password" placeholder="再次输入密码" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
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
              注册
            </button>
          </form>
          <p className="text-center text-sm text-slate-500">
            已有账号？{' '}
            <Link to="/login" className="cursor-pointer font-semibold text-emerald-600 hover:underline">
              去登录
            </Link>
          </p>
        </div>
      </div>
      <Toaster />
    </div>
  );
};

export default Signup;
