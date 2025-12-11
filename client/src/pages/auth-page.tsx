import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import lorettaLogo from '@assets/logos/loretta_logo.png';

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const { t } = useTranslation('auth');
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
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
    if (user) {
      setLocation('/welcome');
    }
  }, [user, setLocation]);

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
    <div className="min-h-screen flex bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md overflow-hidden border-0 shadow-2xl">
          <div className="bg-gradient-to-r from-primary via-primary to-chart-2 p-6 text-center">
            <div className="flex justify-center mb-4">
              <img src={lorettaLogo} alt="Loretta" className="h-12 brightness-0 invert" />
            </div>
            <h1 className="text-2xl font-black text-white mb-1">{t('welcome')}</h1>
            <p className="text-primary-foreground/80 text-sm">{t('tagline')}</p>
          </div>
          <CardHeader className="text-center pt-6 pb-2">
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t('signIn')}</TabsTrigger>
                <TabsTrigger value="register">{t('signUp')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">{t('username')}</Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder={t('placeholders.username')}
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">{t('password')}</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder={t('placeholders.password')}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary via-primary to-chart-2 hover:opacity-90 text-white font-bold"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('signingIn')}
                      </>
                    ) : (
                      t('signIn')
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="register-firstname">{t('firstName')}</Label>
                      <Input
                        id="register-firstname"
                        type="text"
                        placeholder={t('placeholders.firstName')}
                        value={registerForm.firstName}
                        onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-lastname">{t('lastName')}</Label>
                      <Input
                        id="register-lastname"
                        type="text"
                        placeholder={t('placeholders.lastName')}
                        value={registerForm.lastName}
                        onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">{t('email')}</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder={t('placeholders.email')}
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-username">{t('username')}</Label>
                    <Input
                      id="register-username"
                      type="text"
                      placeholder={t('placeholders.chooseUsername')}
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">{t('password')}</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder={t('placeholders.createPassword')}
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm">{t('confirmPassword')}</Label>
                    <Input
                      id="register-confirm"
                      type="password"
                      placeholder={t('placeholders.confirmPassword')}
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  {registerError && (
                    <p className="text-sm text-red-500">{registerError}</p>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary via-primary to-chart-2 hover:opacity-90 text-white font-bold"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('creatingAccount')}
                      </>
                    ) : (
                      t('createAccount')
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}
