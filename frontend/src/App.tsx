import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/custom/AppLayout';
import Login from './components/custom/Login';
import Signup from './components/custom/Signup';
import RequireOnboarded from './components/custom/RequireOnboarded';
import Index from './pages/Index';
import Meals from './pages/Meals';
import Trends from './pages/Trends';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import NotFound from './pages/NotFound';

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] text-slate-500">
        加载中...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />}
      />
      <Route
        path="/onboarding"
        element={isAuthenticated ? <Onboarding /> : <Navigate to="/login" replace />}
      />
      <Route
        element={isAuthenticated ? <RequireOnboarded /> : <Navigate to="/login" replace />}
      >
        <Route element={<AppLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
};

const App = () => (
  <HashRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </HashRouter>
);

export default App;
