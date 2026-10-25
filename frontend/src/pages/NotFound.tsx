import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center">
    <h1 className="text-2xl font-bold">页面不存在</h1>
    <p className="mt-2 text-sm text-slate-500">你访问的页面找不到了，返回今日概览继续记录吧。</p>
    <Link
      to="/"
      className="mt-6 inline-block rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white"
    >
      返回首页
    </Link>
  </div>
);

export default NotFound;
