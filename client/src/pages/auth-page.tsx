import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Loader2, Sparkles, Trophy, Target, Shield } from 'lucide-react';
import lorettaLogo from '@assets/logos/loretta_logo.png';

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [registerError, setRegisterError] = useState('');

  if (user) {
    setLocation('/');
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
      setRegisterError('Passwords do not match');
      return;
    }
    
    if (registerForm.password.length < 6) {
      setRegisterError('Password must be at least 6 characters');
      return;
    }
    
    registerMutation.mutate({
      username: registerForm.username,
      password: registerForm.password,
    });
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={lorettaLogo} alt="Loretta" className="h-12" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome to Loretta</CardTitle>
            <CardDescription>Your personal health companion</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Username</Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="Enter your username"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username">Username</Label>
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="Choose a username"
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Create a password (min 6 characters)"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm">Confirm Password</Label>
                    <Input
                      id="register-confirm"
                      type="password"
                      placeholder="Confirm your password"
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
                    className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-cyan-400 via-teal-400 to-emerald-500 p-12 items-center justify-center">
        <div className="max-w-md text-white">
          <div className="flex items-center gap-3 mb-6">
            <Heart className="h-10 w-10" />
            <h2 className="text-3xl font-bold">Your Health Journey Starts Here</h2>
          </div>
          
          <p className="text-white/90 text-lg mb-8">
            Loretta is your personal health companion that makes wellness fun and engaging through gamification.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-white/20 rounded-lg p-2">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Personalized Insights</h3>
                <p className="text-white/80 text-sm">Get health recommendations tailored to your unique profile</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-white/20 rounded-lg p-2">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Gamified Progress</h3>
                <p className="text-white/80 text-sm">Earn XP, maintain streaks, and unlock achievements</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-white/20 rounded-lg p-2">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Daily Missions</h3>
                <p className="text-white/80 text-sm">Complete fun health missions to build better habits</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-white/20 rounded-lg p-2">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Privacy First</h3>
                <p className="text-white/80 text-sm">Your health data is encrypted and you control what you share</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
