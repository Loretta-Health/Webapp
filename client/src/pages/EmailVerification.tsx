import { useState, useEffect, useRef, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Mail, RefreshCw, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authenticatedFetch } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';
import lorettaLogoHorizontal from '@assets/logos/loretta_logo_horizontal.png';

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

export default function EmailVerification() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation('auth');
  const queryClient = useQueryClient();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!user) {
      setLocation('/auth');
      return;
    }
    if (user.emailVerified) {
      setLocation('/welcome');
    }
  }, [user, setLocation]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (lockedUntil && new Date() >= lockedUntil) {
      setLockedUntil(null);
      setRemainingAttempts(null);
    }
  }, [lockedUntil]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(digit => digit) && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (verificationCode: string) => {
    if (isVerifying) return;
    
    setIsVerifying(true);
    setError('');

    try {
      const response = await authenticatedFetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          if (data.lockedUntil) {
            setLockedUntil(new Date(data.lockedUntil));
          }
        }
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
        setError(data.message || t('verification.invalidCode'));
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      setSuccess(true);
      await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      setTimeout(() => {
        setLocation('/welcome');
      }, 2000);
    } catch (err) {
      setError(t('verification.error'));
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (isResending || resendCooldown > 0) return;
    
    setIsResending(true);
    setError('');

    try {
      const response = await authenticatedFetch('/api/resend-verification', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.retryAfterSeconds) {
          setResendCooldown(data.retryAfterSeconds);
        } else if (data.retryAfterMinutes) {
          setResendCooldown(data.retryAfterMinutes * 60);
        }
        setError(data.message);
        return;
      }

      setResendCooldown(60);
      setRemainingAttempts(null);
      setLockedUntil(null);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(t('verification.resendError'));
    } finally {
      setIsResending(false);
    }
  };

  if (!user) {
    return null;
  }

  const isLocked = lockedUntil && new Date() < lockedUntil;
  const lockRemainingMinutes = lockedUntil 
    ? Math.ceil((lockedUntil.getTime() - Date.now()) / 60000) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4ff] via-[#f8f4ff] to-[#f0f4ff] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 safe-area-inset">
      <div className="w-full max-w-md">
        <GlassCard className="overflow-hidden" glow>
          <div className="bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] p-8 text-center">
            <img 
              src={lorettaLogoHorizontal} 
              alt="Loretta" 
              className="h-10 sm:h-12 mx-auto mb-4 object-contain brightness-0 invert drop-shadow-lg"
            />
            <p className="text-white/90 text-sm font-medium">
              {t('verification.subtitle')}
            </p>
          </div>

          <div className="p-8">
            {success ? (
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center animate-bounce">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('verification.success')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('verification.redirecting')}
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#013DC4] to-[#CDB6EF] flex items-center justify-center">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('verification.title')}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {t('verification.instructions', { email: user.email })}
                  </p>
                </div>

                {isLocked ? (
                  <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl mb-6">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <p className="text-red-600 dark:text-red-400 font-medium">
                      {t('verification.locked', { minutes: lockRemainingMinutes })}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center gap-2 sm:gap-3 mb-6" onPaste={handlePaste}>
                      {code.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (inputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          disabled={isVerifying}
                          className={`
                            w-12 h-14 sm:w-14 sm:h-16
                            text-center text-2xl font-bold
                            border-2 rounded-xl
                            bg-white dark:bg-gray-800
                            text-gray-900 dark:text-white
                            focus:border-[#013DC4] focus:ring-2 focus:ring-[#013DC4]/20
                            transition-all duration-200
                            disabled:opacity-50
                            ${error ? 'border-red-400 shake' : 'border-gray-200 dark:border-gray-600'}
                          `}
                          aria-label={`Digit ${index + 1}`}
                        />
                      ))}
                    </div>

                    {error && (
                      <div className="flex items-center justify-center gap-2 text-red-500 text-sm mb-4 text-center">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {remainingAttempts !== null && remainingAttempts > 0 && (
                      <p className="text-center text-amber-600 dark:text-amber-400 text-sm mb-4">
                        {t('verification.attemptsRemaining', { count: remainingAttempts })}
                      </p>
                    )}

                    {isVerifying && (
                      <div className="flex items-center justify-center gap-2 text-[#013DC4] mb-4">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="font-medium">{t('verification.verifying')}</span>
                      </div>
                    )}
                  </>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                  <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-4">
                    {t('verification.noCode')}
                  </p>
                  <button
                    onClick={handleResend}
                    disabled={isResending || resendCooldown > 0 || !!isLocked}
                    className={`
                      w-full py-3 px-4 rounded-xl font-semibold
                      flex items-center justify-center gap-2
                      transition-all duration-200
                      ${resendCooldown > 0 || isLocked
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#013DC4] to-[#CDB6EF] text-white hover:opacity-90 active:scale-[0.98]'
                      }
                    `}
                  >
                    {isResending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-5 h-5" />
                    )}
                    {resendCooldown > 0 
                      ? t('verification.resendCooldown', { seconds: resendCooldown })
                      : t('verification.resend')
                    }
                  </button>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-[#f8f9ff] to-[#f3f0ff] dark:from-gray-800 dark:to-gray-800 rounded-xl">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#013DC4] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t('verification.securityNote')}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
