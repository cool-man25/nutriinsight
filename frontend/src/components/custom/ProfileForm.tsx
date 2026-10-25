import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ActivityLevel, Gender, Goal, Profile, ProfileInput } from '@shared/types/nutrition';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { ACTIVITY_LABEL, GOAL_LABEL } from '@/lib/nutrition';

interface FormState {
  name: string;
  heightCm: string;
  weightKg: string;
  age: string;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: Goal;
  allergies: string;
  preferences: string;
}

interface ProfileFormProps {
  mode: 'onboarding' | 'edit';
  onSaved: (profile: Profile) => void;
}

const ProfileForm = ({ mode, onSaved }: ProfileFormProps) => {
  const [form, setForm] = useState<FormState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getProfile()
      .then((p) => {
        if (cancelled) return;
        setForm({
          name: p.name,
          heightCm: String(p.heightCm),
          weightKg: String(p.weightKg),
          age: String(p.age),
          gender: p.gender,
          activityLevel: p.activityLevel,
          goal: p.goal,
          allergies: p.allergies,
          preferences: p.preferences,
        });
      })
      .catch((e: unknown) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : '加载失败');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const payload: ProfileInput = {
      name: form.name.trim(),
      heightCm: Math.round(Number(form.heightCm)),
      weightKg: Number(form.weightKg),
      age: Math.round(Number(form.age)),
      gender: form.gender,
      activityLevel: form.activityLevel,
      goal: form.goal,
      allergies: form.allergies.trim(),
      preferences: form.preferences.trim(),
    };
    if (!payload.name) return void toast.error('请填写昵称');
    if (!(payload.heightCm >= 100 && payload.heightCm <= 250)) return void toast.error('身高范围为 100-250 cm');
    if (!(payload.weightKg >= 25 && payload.weightKg <= 300)) return void toast.error('体重范围为 25-300 kg');
    if (!(payload.age >= 10 && payload.age <= 100)) return void toast.error('年龄范围为 10-100 岁');
    setSaving(true);
    try {
      const saved = await api.updateProfile(payload);
      toast.success(mode === 'onboarding' ? '资料已保存，开始使用吧' : '个人资料已保存，营养目标已更新');
      onSaved(saved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loadError && !form) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-red-500">
        {loadError}
      </p>
    );
  }
  if (!form) return <Skeleton className="h-96 rounded-2xl" />;

  return (
    <form
      onSubmit={(e) => void save(e)}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] sm:p-6"
    >
      <div className="space-y-2">
        <Label htmlFor="name">昵称</Label>
        <Input id="name" value={form.name} maxLength={30} onChange={(e) => set('name', e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="height">身高 (cm)</Label>
          <Input id="height" type="number" inputMode="numeric" value={form.heightCm} onChange={(e) => set('heightCm', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">体重 (kg)</Label>
          <Input id="weight" type="number" inputMode="decimal" value={form.weightKg} onChange={(e) => set('weightKg', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age">年龄</Label>
          <Input id="age" type="number" inputMode="numeric" value={form.age} onChange={(e) => set('age', e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>性别</Label>
        <Select value={form.gender} onValueChange={(v) => set('gender', v as Gender)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">男</SelectItem>
            <SelectItem value="female">女</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>活动水平</Label>
        <Select value={form.activityLevel} onValueChange={(v) => set('activityLevel', v as ActivityLevel)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ACTIVITY_LABEL) as ActivityLevel[]).map((k) => (
              <SelectItem key={k} value={k}>{ACTIVITY_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>健康目标</Label>
        <Select value={form.goal} onValueChange={(v) => set('goal', v as Goal)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(GOAL_LABEL) as Goal[]).map((k) => (
              <SelectItem key={k} value={k}>{GOAL_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="allergies">过敏原（选填）</Label>
        <Input id="allergies" value={form.allergies} maxLength={200} placeholder="例如：花生、海鲜" onChange={(e) => set('allergies', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="prefs">饮食偏好（选填）</Label>
        <Input id="prefs" value={form.preferences} maxLength={200} placeholder="例如：少油、素食" onChange={(e) => set('preferences', e.target.value)} />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-full bg-emerald-500 py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-60"
      >
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {mode === 'onboarding' ? '完成设置，开始使用' : '保存资料'}
      </button>
    </form>
  );
};

export default ProfileForm;
