import { Printer } from 'lucide-react';
import TrendCard from '@/components/custom/TrendCard';
import { useLayout } from '@/hooks/use-layout';

const Trends = () => {
  const { refreshKey } = useLayout();
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">趋势分析</h1>
          <p className="text-sm text-slate-500">发现长期饮食规律与改善空间</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 self-start rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 print:hidden"
        >
          <Printer className="h-4 w-4" />
          导出 PDF 周报
        </button>
      </div>
      <TrendCard refreshKey={refreshKey} showTable />
    </div>
  );
};

export default Trends;
