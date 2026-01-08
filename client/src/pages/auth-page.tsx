import { useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { Loader2, Lock, User, UserPlus, AtSign, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import lorettaLogo from '@assets/logos/loretta_logo.png';

function GlassCard({ 
  children, 
  className = '',
  glow = false 
}: { 
  children: ReactNode; 
  className?: string;
  glow?: boolean;
}) {
  return (
    <div className={`
      backdrop-blur-xl bg-white/70 dark:bg-gray-900/70
      border border-white/50 dark:border-white/10
      rounded-3xl shadow-xl
      ${glow ? 'shadow-[#013DC4]/20' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const { isOnboardingComplete, isLoading: onboardingLoading } = useOnboardingProgress();
  const { t } = useTranslation('auth');
  
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    username: '', 
    password: '', 
    confirmPassword: '',
    firstName: '',
    lastName: '',
    email: ''
  });
  const [registerError, setRegisterError] = useState('');

  useEffect(() => {
    if (user && !onboardingLoading) {
      const pendingInvite = localStorage.getItem('loretta_pending_invite');
      
      if (pendingInvite && isOnboardingComplete) {
        localStorage.removeItem('loretta_pending_invite');
        setLocation(`/team-invite?code=${pendingInvite}`);
      } else {
        setLocation('/welcome');
      }
    }
  }, [user, isOnboardingComplete, onboardingLoading, setLocation]);

  if (user) {
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginForm);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError(t('errors.passwordMismatch'));
      return;
    }
    
    if (registerForm.password.length < 6) {
      setRegisterError(t('errors.passwordTooShort'));
      return;
    }
    
    registerMutation.mutate({
      username: registerForm.username,
      password: registerForm.password,
      firstName: registerForm.firstName || undefined,
      lastName: registerForm.lastName || undefined,
      email: registerForm.email || undefined,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <GlassCard className="overflow-hidden" glow>
          <div className="relative overflow-hidden bg-gradient-to-br from-[#013DC4] via-[#0150FF] to-[#4B7BE5] p-6 sm:p-8 text-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#CDB6EF]/30 to-transparent rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
                  <img src={lorettaLogo} alt="Loretta" className="h-10 object-contain brightness-0 invert" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">{t('welcome')}</h1>
              <p className="text-white/80 text-sm font-medium">{t('tagline')}</p>
            </div>
          </div>
          
          <div className="p-5 sm:p-6">
            <div className="flex gap-2 p-1 bg-white/50 dark:bg-gray-800/50 rounded-2xl mb-6">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'login'
                    ? 'bg-gradient-to-r from-[#013DC4] to-[#0150FF] text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/50'
                }`}
              >
                {t('signIn')}
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'register'
                    ? 'bg-gradient-to-r from-[#013DC4] to-[#0150FF] text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/50'
                }`}
              >
                {t('signUp')}
              </button>
            </div>
            
            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">{t('usernameOrEmail')}</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center">
                      <AtSign className="w-4 h-4 text-white" />
                    </div>
                    <input
                      id="login-identifier"
                      type="text"
                      autoComplete="username"
                      placeholder={t('placeholders.usernameOrEmail')}
                      value={loginForm.identifier}
                      onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                      required
                      className="w-full pl-16 pr-4 py-4 bg-white/50 dark:bg-gray-800/50 border border-white/50 dark:border-white/10 rounded-2xl font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#013DC4]/30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">{t('password')}</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-br from-[#CDB6EF] to-purple-400 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-white" />
                    </div>
                    <input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      placeholder={t('placeholders.password')}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                      className="w-full pl-16 pr-4 py-4 bg-white/50 dark:bg-gray-800/50 border border-white/50 dark:border-white/10 rounded-2xl font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#013DC4]/30"
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="w-full py-4 bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] hover:opacity-90 text-white font-bold rounded-2xl shadow-lg shadow-[#013DC4]/20 transition-all disabled:opacity-50 min-h-[56px]"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {t('signingIn')}
                    </span>
                  ) : (
                    t('signIn')
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider">{t('firstName')}</label>
                    <input
                      id="register-firstname"
                      type="text"
                      placeholder={t('placeholders.firstName')}
                      value={registerForm.firstName}
                      onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                      className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-white/50 dark:border-white/10 rounded-2xl font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#013DC4]/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider">{t('lastName')}</label>
                    <input
                      id="register-lastname"
                      type="text"
                      placeholder={t('placeholders.lastName')}
                      value={registerForm.lastName}
                      onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                      className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-white/50 dark:border-white/10 rounded-2xl font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#013DC4]/30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">{t('email')}</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center">
                      <Mail className="w-4 h-4 text-white" />
                    </div>
                    <input
                      id="register-email"
                      type="email"
                      placeholder={t('placeholders.email')}
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      required
                      className="w-full pl-16 pr-4 py-4 bg-white/50 dark:bg-gray-800/50 border border-white/50 dark:border-white/10 rounded-2xl font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#013DC4]/30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">{t('username')}</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-br from-[#CDB6EF] to-purple-400 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <input
                      id="register-username"
                      type="text"
                      autoComplete="username"
                      placeholder={t('placeholders.chooseUsername')}
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                      required
                      className="w-full pl-16 pr-4 py-4 bg-white/50 dark:bg-gray-800/50 border border-white/50 dark:border-white/10 rounded-2xl font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#013DC4]/30"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider">{t('password')}</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center">
                        <Lock className="w-3 h-3 text-white" />
                      </div>
                      <input
                        id="register-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        required
                        className="w-full pl-12 pr-3 py-3 bg-white/50 dark:bg-gray-800/50 border border-white/50 dark:border-white/10 rounded-2xl font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#013DC4]/30 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider">{t('confirmPassword')}</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-gradient-to-br from-[#CDB6EF] to-purple-400 flex items-center justify-center">
                        <Lock className="w-3 h-3 text-white" />
                      </div>
                      <input
                        id="register-confirm"
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        required
                        className="w-full pl-12 pr-3 py-3 bg-white/50 dark:bg-gray-800/50 border border-white/50 dark:border-white/10 rounded-2xl font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#013DC4]/30 text-sm"
                      />
                    </div>
                  </div>
                </div>
                {registerError && (
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{registerError}</p>
                  </div>
                )}
                <button 
                  type="submit" 
                  className="w-full py-4 bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] hover:opacity-90 text-white font-bold rounded-2xl shadow-lg shadow-[#013DC4]/20 transition-all disabled:opacity-50 min-h-[56px]"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {t('creatingAccount')}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      {t('createAccount')}
                    </span>
                  )}
                </button>
              </form>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
