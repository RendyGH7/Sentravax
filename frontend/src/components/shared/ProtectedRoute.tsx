import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../app/context/useAuth';
import { type UserRole } from '../../types/auth';
import { PATHS } from '../../app/router/paths';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#047857] border-t-transparent animate-spin"></div>
          <span className="text-xs font-mono text-[#6B7280]">Memverifikasi otorisasi akses...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={PATHS.PUBLIC.LOGIN} state={{ from: location }} replace />;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0C0C0C] text-white">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#161616] border border-[#2C2C2C] text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#F59E0B] mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white">Akses Area Dibatasi</h2>
          <p className="text-xs text-[#D4D4D4] leading-relaxed">
            Akun Anda terdaftar dengan peran <span className="font-mono text-[#F59E0B] font-bold">[{user.role}]</span>. Area ini memerlukan salah satu hak akses berikut: <span className="font-mono text-emerald-400 font-bold">[{requiredRoles.join(', ')}]</span>.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to={PATHS.USER.DASHBOARD}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#212121] border border-[#2C2C2C] text-xs font-bold text-white hover:bg-[#2B2B2B] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Ke Portal Warga
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
