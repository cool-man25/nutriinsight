import ProfileForm from '@/components/custom/ProfileForm';
import { useLayout } from '@/hooks/use-layout';

const Profile = () => {
  const { bumpRefresh } = useLayout();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">个人中心</h1>
        <p className="text-sm text-slate-500">身体数据与健康目标决定你的每日营养基准</p>
      </div>
      <ProfileForm mode="edit" onSaved={bumpRefresh} />
    </div>
  );
};

export default Profile;
