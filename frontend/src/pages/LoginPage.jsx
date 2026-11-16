import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { Eye, EyeOff, Lock, User, AlertCircle, Shield, Briefcase, UserCheck } from 'lucide-react';

export const LoginPage = () => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(loginId, password);
      // Route based on role
      if (user.role === 'senior_admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'branch_manager') {
        navigate('/manager/dashboard');
      } else {
        navigate('/employee/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 
                  err.response?.data?.errors?.login?.[0] || 
                  'Failed to sign in. Please verify your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoLoginId, demoPassword = 'Password123!') => {
    setLoginId(demoLoginId);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Subtle Legal Geometric Lines */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#C5A36B" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="flex justify-center mb-6">
          <Logo size="lg" light={true} showTagline={true} />
        </div>
        <h2 className="text-center text-xs tracking-widest uppercase font-semibold text-gold-400">
          Internal Enterprise Platform
        </h2>
        <p className="mt-1 text-center text-sm text-slate-300">
          Sign in to access your legal firm operational console
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-gold-400/20">
          
          {error && (
            <div className="mb-5 rounded-lg bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-3 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider">
                Email Address or Employee ID
              </label>
              <div className="mt-1.5 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. admin@aavpartners.com or AAV-TNV-001"
                  className="block w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-navy-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1.5 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-navy-900 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-navy-900"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-navy-900 focus:ring-navy-900 border-slate-300 rounded"
                />
                <span className="ml-2">Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => alert('For password resets, please contact the IT Administrator at admin@aavpartners.com')}
                className="font-medium text-navy-800 hover:text-gold-600 transition-colors text-[11px]"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-400 transition-all uppercase tracking-wider disabled:opacity-50 mt-4"
            >
              {loading ? 'Authenticating...' : 'Sign In to Firm Workspace'}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 text-center">
              Quick Demo Access
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@aavpartners.com')}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 hover:border-gold-400 hover:bg-gold-50/50 transition-colors text-center"
              >
                <Shield className="w-4 h-4 text-gold-600 mb-1" />
                <span className="text-[10px] font-bold text-navy-900">Senior Admin</span>
                <span className="text-[9px] text-slate-400">A. Venkatesh</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('manager.tnv@aavpartners.com')}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 hover:border-navy-800 hover:bg-navy-50/50 transition-colors text-center"
              >
                <Briefcase className="w-4 h-4 text-navy-800 mb-1" />
                <span className="text-[10px] font-bold text-navy-900">Branch Mgr</span>
                <span className="text-[9px] text-slate-400">R. Sundaram</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('meera.k@aavpartners.com')}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50 transition-colors text-center"
              >
                <UserCheck className="w-4 h-4 text-emerald-700 mb-1" />
                <span className="text-[10px] font-bold text-navy-900">Employee</span>
                <span className="text-[9px] text-slate-400">M. Krishnan</span>
              </button>
            </div>
          </div>

        </div>

        <div className="mt-4 text-center text-[11px] text-slate-400 font-serif">
          AAV PARTNERS &copy; {new Date().getFullYear()} &mdash; All Rights Reserved.
        </div>
      </div>
    </div>
  );
};
