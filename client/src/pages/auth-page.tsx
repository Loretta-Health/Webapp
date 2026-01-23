import { useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { Loader2, Lock, User, UserPlus, AtSign, Mail, ArrowLeft, KeyRound, X, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import lorettaLogoWhite from '/loretta_logo_white.png';
import { apiRequest } from '@/lib/queryClient';

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
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'code' | 'newPassword'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  
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
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [privacyLang, setPrivacyLang] = useState<'en' | 'de'>('en');

  useEffect(() => {
    if (user && !onboardingLoading) {
      if (!user.emailVerified) {
        setLocation('/verify-email');
        return;
      }
      
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
    
    if (!registerForm.email) {
      setRegisterError('Email is required');
      return;
    }
    
    registerMutation.mutate({
      username: registerForm.username,
      password: registerForm.password,
      firstName: registerForm.firstName || undefined,
      lastName: registerForm.lastName || undefined,
      email: registerForm.email,
    });
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetMessage('');
    
    try {
      const res = await apiRequest('POST', '/api/password-reset/request', { email: resetEmail });
      const data = await res.json();
      setResetMessage(data.message);
      setResetStep('code');
    } catch (error: any) {
      setResetError(error.message || 'Failed to request password reset');
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    
    try {
      const res = await apiRequest('POST', '/api/password-reset/verify', { token: resetCode });
      const data = await res.json();
      if (data.valid) {
        setResetStep('newPassword');
      }
    } catch (error: any) {
      setResetError(error.message || 'Invalid reset code');
    } finally {
      setResetLoading(false);
    }
  };

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    
    if (newPassword !== confirmNewPassword) {
      setResetError('Passwords do not match');
      setResetLoading(false);
      return;
    }
    
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters');
      setResetLoading(false);
      return;
    }
    
    try {
      const res = await apiRequest('POST', '/api/password-reset/complete', { 
        token: resetCode, 
        newPassword 
      });
      const data = await res.json();
      setResetMessage(data.message);
      setTimeout(() => {
        setShowPasswordReset(false);
        setResetStep('email');
        setResetEmail('');
        setResetCode('');
        setNewPassword('');
        setConfirmNewPassword('');
        setResetMessage('');
      }, 2000);
    } catch (error: any) {
      setResetError(error.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowPasswordReset(false);
    setResetStep('email');
    setResetEmail('');
    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setResetMessage('');
    setResetError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4 safe-area-top safe-area-bottom">
      <div className="w-full max-w-md">
        <GlassCard className="overflow-hidden" glow>
          <div className="relative overflow-hidden bg-gradient-to-br from-[#013DC4] via-[#0150FF] to-[#4B7BE5] p-6 sm:p-8 text-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#CDB6EF]/30 to-transparent rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex justify-center mb-3">
                <img src={lorettaLogoWhite} alt="Loretta" className="h-10 sm:h-12 object-contain drop-shadow-lg" />
              </div>
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
            
            {showPasswordReset ? (
              <div className="space-y-4">
                <button
                  onClick={handleBackToLogin}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-[#013DC4] transition-colors mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('backToLogin', 'Back to Sign In')}
                </button>
                
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center">
                    <KeyRound className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">
                    {resetStep === 'email' && t('resetPassword', 'Reset Password')}
                    {resetStep === 'code' && t('enterCode', 'Enter Reset Code')}
                    {resetStep === 'newPassword' && t('setNewPassword', 'Set New Password')}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {resetStep === 'email' && t('resetPasswordDesc', 'Enter your email to receive a reset code')}
                    {resetStep === 'code' && t('enterCodeDesc', 'Check your email for your 6-digit code')}
                    {resetStep === 'newPassword' && t('setNewPasswordDesc', 'Choose a strong password')}
                  </p>
                </div>

                {resetError && (
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{resetError}</p>
                  </div>
                )}

                {resetStep === 'email' && (
                  <form onSubmit={handleRequestReset} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-wider">{t('email')}</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center">
                          <Mail className="w-4 h-4 text-white" />
                        </div>
                        <input
                          type="email"
                          placeholder={t('placeholders.email')}
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                          className="w-full pl-16 pr-4 py-4 bg-white/50 dark:bg-gray-800/50 border border-white/50 dark:border-white/10 rounded-2xl font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#013DC4]/30"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      className="w-full py-4 bg-gradient-to-r from-[#013DC4] to-[#0150FF] hover:opacity-90 text-white font-bold rounded-2xl shadow-lg shadow-[#013DC4]/20 transition-all disabled:opacity-50 min-h-[56px]"
                      disabled={resetLoading}
                    >
                      {resetLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          {t('sending', 'Sending...')}
                        </span>
                      ) : (
                        t('sendResetCode', 'Send Reset Code')
                      )}
                    </button>
                  </form>
                )}

                {resetStep === 'code' && (
                  <form onSubmit={handleVerifyCode} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-wider">{t('resetCode', 'Reset Code')}</label>
                      <input
                        type="text"
                        placeholder="123456"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        required
                        maxLength={6}
                        className="w-full px-4 py-4 bg-white/50 dark:bg-gray-800/50 border border-white/50 dark:border-white/10 rounded-2xl font-bold text-2xl text-center text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#013DC4]/30 tracking-[0.5em]"
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-full py-4 bg-gradient-to-r from-[#013DC4] to-[#0150FF] hover:opacity-90 text-white font-bold rounded-2xl shadow-lg shadow-[#013DC4]/20 transition-all disabled:opacity-50 min-h-[56px]"
                      disabled={resetLoading || resetCode.length < 6}
                    >
                      {resetLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          {t('verifying', 'Verifying...')}
                        </span>
                      ) : (
                        t('verifyCode', 'Verify Code')
                      )}
                    </button>
                  </form>
                )}

                {resetStep === 'newPassword' && (
                  <form onSubmit={handleCompleteReset} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-wider">{t('newPassword', 'New Password')}</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center">
                          <Lock className="w-4 h-4 text-white" />
                        </div>
                        <input
                          type="password"
                          placeholder="••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="w-full pl-16 pr-4 py-4 bg-white/50 dark:bg-gray-800/50 border border-white/50 dark:border-white/10 rounded-2xl font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#013DC4]/30"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-wider">{t('confirmNewPassword', 'Confirm Password')}</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-br from-[#CDB6EF] to-purple-400 flex items-center justify-center">
                          <Lock className="w-4 h-4 text-white" />
                        </div>
                        <input
                          type="password"
                          placeholder="••••••"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          required
                          className="w-full pl-16 pr-4 py-4 bg-white/50 dark:bg-gray-800/50 border border-white/50 dark:border-white/10 rounded-2xl font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#013DC4]/30"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      className="w-full py-4 bg-gradient-to-r from-[#013DC4] to-[#0150FF] hover:opacity-90 text-white font-bold rounded-2xl shadow-lg shadow-[#013DC4]/20 transition-all disabled:opacity-50 min-h-[56px]"
                      disabled={resetLoading}
                    >
                      {resetLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          {t('resetting', 'Resetting...')}
                        </span>
                      ) : (
                        t('resetPassword', 'Reset Password')
                      )}
                    </button>
                  </form>
                )}
              </div>
            ) : activeTab === 'login' ? (
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
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  className="w-full text-center text-sm text-[#013DC4] hover:text-[#0150FF] font-medium mt-2 transition-colors"
                >
                  {t('forgotPassword', 'Forgot your password?')}
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
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {t('privacyAcknowledgment')}{' '}
                  <button 
                    type="button"
                    onClick={() => setShowPrivacyPolicy(true)}
                    className="text-[#013DC4] hover:underline font-medium"
                  >
                    {t('privacyPolicy')}
                  </button>
                  .
                </p>
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

      {/* Privacy Policy Modal */}
      <Dialog open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#013DC4]" />
              {privacyLang === 'en' ? 'Privacy Policy' : 'Datenschutzerklärung'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setPrivacyLang('en')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                privacyLang === 'en' 
                  ? 'bg-[#013DC4] text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setPrivacyLang('de')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                privacyLang === 'de' 
                  ? 'bg-[#013DC4] text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              Deutsch
            </button>
          </div>
          <div className="overflow-y-auto max-h-[60vh] pr-2">
            {privacyLang === 'en' ? (
              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-3">
                  <h3 className="font-black text-gray-900 dark:text-white text-sm">LORETTA HEALTH UG — PRIVACY POLICY</h3>
                  <p className="text-[10px] mt-1">Last Updated: January 21, 2026 | Effective Date: January 21, 2026</p>
                </div>
                
                <div className="space-y-2 p-3 bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 rounded-xl">
                  <h4 className="font-bold text-gray-900 dark:text-white">Privacy at a Glance</h4>
                  <ul className="space-y-1">
                    <li><strong className="text-gray-900 dark:text-white">We never sell your data.</strong> Your health information belongs to you.</li>
                    <li><strong className="text-gray-900 dark:text-white">You're in control.</strong> Access, update, or delete your data at support@loretta.care.</li>
                    <li><strong className="text-gray-900 dark:text-white">Anonymization first.</strong> Your name is anonymized in our database.</li>
                    <li><strong className="text-gray-900 dark:text-white">European data protection.</strong> We're based in Berlin and fully comply with GDPR.</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 dark:text-white">1. Data Controller</h4>
                  <p>Loretta Health UG<br/>c/o Scaling Spaces, Cuvrystr. 53<br/>10997 Berlin, Germany<br/>Email: support@loretta.care</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 dark:text-white">2. What Data We Collect</h4>
                  <p><strong className="text-gray-900 dark:text-white">Health Data:</strong> Medication information, health risk scores, emotional check-ins, wellbeing data.</p>
                  <p><strong className="text-gray-900 dark:text-white">Personal Information:</strong> Name (anonymized), email address, phone number.</p>
                  <p><strong className="text-gray-900 dark:text-white">Usage Data:</strong> App interactions, features accessed, performance data.</p>
                  <p><strong className="text-gray-900 dark:text-white">Analytics:</strong> Device information, usage patterns via Microsoft Clarity.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 dark:text-white">3. How We Use Your Data</h4>
                  <p><strong className="text-gray-900 dark:text-white">Health Services:</strong> Personalized recommendations, health insights, medication tracking, risk score monitoring.</p>
                  <p><strong className="text-gray-900 dark:text-white">Research:</strong> Advancing chronic disease prevention through health AI research, improving early detection strategies.</p>
                  <p><strong className="text-gray-900 dark:text-white">App Improvement:</strong> Analyzing usage patterns, monitoring performance.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 dark:text-white">4. Legal Basis (GDPR)</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Consent (Art. 6(1)(a), Art. 9(2)(a)) for health data</li>
                    <li>Legitimate Interest (Art. 6(1)(f)) for analytics</li>
                    <li>Contract Performance (Art. 6(1)(b)) for services</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 dark:text-white">5. Your Rights</h4>
                  <p>Access, rectification, erasure, restriction, data portability, objection, and withdrawal of consent. Contact support@loretta.care to exercise your rights.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 dark:text-white">6. Data Sharing</h4>
                  <p><strong className="text-gray-900 dark:text-white">We do not sell your personal data.</strong> We may share with service providers (Microsoft Clarity), when required by law, or anonymized data for research.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 dark:text-white">7. Contact & Complaints</h4>
                  <p>Questions: support@loretta.care<br/>Complaints: Berlin Commissioner for Data Protection, Friedrichstr. 219, 10969 Berlin</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-3">
                  <h3 className="font-black text-gray-900 dark:text-white text-sm">LORETTA HEALTH UG — DATENSCHUTZERKLÄRUNG</h3>
                  <p className="text-[10px] mt-1">Letzte Aktualisierung: 21. Januar 2026 | Gültig ab: 21. Januar 2026</p>
                </div>
                
                <div className="space-y-2 p-3 bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 rounded-xl">
                  <h4 className="font-bold text-gray-900 dark:text-white">Datenschutz auf einen Blick</h4>
                  <ul className="space-y-1">
                    <li><strong className="text-gray-900 dark:text-white">Wir verkaufen niemals Ihre Daten.</strong> Ihre Gesundheitsdaten gehören Ihnen.</li>
                    <li><strong className="text-gray-900 dark:text-white">Sie haben die Kontrolle.</strong> Zugriff, Aktualisierung oder Löschung unter support@loretta.care.</li>
                    <li><strong className="text-gray-900 dark:text-white">Anonymisierung zuerst.</strong> Ihr Name wird in unserer Datenbank anonymisiert.</li>
                    <li><strong className="text-gray-900 dark:text-white">Europäischer Datenschutz.</strong> Wir sind in Berlin ansässig und DSGVO-konform.</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 dark:text-white">1. Verantwortlicher</h4>
                  <p>Loretta Health UG<br/>c/o Scaling Spaces, Cuvrystr. 53<br/>10997 Berlin, Deutschland<br/>E-Mail: support@loretta.care</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 dark:text-white">2. Welche Daten wir erheben</h4>
                  <p><strong className="text-gray-900 dark:text-white">Gesundheitsdaten:</strong> Medikamenteninformationen, Gesundheitsrisikobewertungen, emotionale Check-ins, Wohlbefindensdaten.</p>
                  <p><strong className="text-gray-900 dark:text-white">Persönliche Daten:</strong> Name (anonymisiert), E-Mail-Adresse, Telefonnummer.</p>
                  <p><strong className="text-gray-900 dark:text-white">Nutzungsdaten:</strong> App-Interaktionen, genutzte Funktionen, Leistungsdaten.</p>
                  <p><strong className="text-gray-900 dark:text-white">Analytik:</strong> Geräteinformationen, Nutzungsmuster über Microsoft Clarity.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 dark:text-white">3. Wie wir Ihre Daten verwenden</h4>
                  <p><strong className="text-gray-900 dark:text-white">Gesundheitsdienste:</strong> Personalisierte Empfehlungen, Gesundheitseinblicke, Medikamentenverfolgung, Risikobewertung.</p>
                  <p><strong className="text-gray-900 dark:text-white">Forschung:</strong> Förderung der Prävention chronischer Krankheiten durch KI-Gesundheitsforschung.</p>
                  <p><strong className="text-gray-900 dark:text-white">App-Verbesserung:</strong> Analyse von Nutzungsmustern, Leistungsüberwachung.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 dark:text-white">4. Rechtsgrundlage (DSGVO)</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Einwilligung (Art. 6(1)(a), Art. 9(2)(a)) für Gesundheitsdaten</li>
                    <li>Berechtigtes Interesse (Art. 6(1)(f)) für Analytik</li>
                    <li>Vertragserfüllung (Art. 6(1)(b)) für Dienste</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 dark:text-white">5. Ihre Rechte</h4>
                  <p>Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch und Widerruf der Einwilligung. Kontakt: support@loretta.care</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 dark:text-white">6. Datenweitergabe</h4>
                  <p><strong className="text-gray-900 dark:text-white">Wir verkaufen Ihre Daten nicht.</strong> Weitergabe an Dienstleister (Microsoft Clarity), bei rechtlicher Verpflichtung oder anonymisierte Daten für Forschung.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 dark:text-white">7. Kontakt & Beschwerden</h4>
                  <p>Fragen: support@loretta.care<br/>Beschwerden: Berliner Beauftragte für Datenschutz, Friedrichstr. 219, 10969 Berlin</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
