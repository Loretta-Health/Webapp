import { useState } from 'react';
import { 
  Heart, Flame, Star, TrendingUp, Users, ChevronRight, Zap, Target, 
  Menu, X, User, MessageCircle, LogOut, Shield, Accessibility, Sun, Moon,
  MapPin, CloudRain, Smile, Pill, BookOpen, Check, Sparkles, ChevronDown, Trophy, Calendar
} from 'lucide-react';
import logomarkViolet from '@assets/Logomark_violet@2x_1766161339181.png';
import logoHorizontalBlue from '@assets/Logo_horizontal_blue@2x_(1)_1766161586795.png';

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  color = 'blue'
}: { 
  icon: any;
  label: string;
  value: string | number;
  trend?: string;
  color?: 'blue' | 'purple' | 'orange' | 'green' | 'rose';
}) {
  const colors = {
    blue: 'from-[#013DC4] to-[#0150FF]',
    purple: 'from-[#CDB6EF] to-[#A78BDA]',
    orange: 'from-orange-400 to-amber-500',
    green: 'from-emerald-400 to-green-500',
    rose: 'from-rose-400 to-pink-500',
  };
  
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {trend && <p className="text-xs text-emerald-600 mt-1">{trend}</p>}
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      {action}
    </div>
  );
}

export default function UIMockup3() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  const xp = 2450;
  const level = 8;
  const streak = 12;
  const nextLevelXP = 3000;
  const xpProgress = (xp / nextLevelXP) * 100;
  
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-[#F0EDFF]/30">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-72 lg:w-[280px]
        bg-gradient-to-b from-[#013DC4] via-[#0140D0] to-[#0150FF]
        flex flex-col overflow-y-auto
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-5 lg:p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <img src={logomarkViolet} alt="Loretta" className="h-8 w-8 brightness-0 invert" />
              <span className="text-xl font-bold text-white">loretta</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-white/10 rounded-xl text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">sarah_health</h3>
                <p className="text-sm text-white/70">Level {level} Explorer</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">XP Progress</span>
                <span className="text-white font-medium">{Math.round(xpProgress)}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${xpProgress}%` }} />
              </div>
            </div>
          </div>
          
          <nav className="space-y-1 flex-1">
            {[
              { icon: User, label: 'Dashboard', active: true },
              { icon: MessageCircle, label: 'Health Navigator' },
              { icon: Target, label: 'Missions' },
              { icon: Users, label: 'Leaderboard' },
              { icon: Calendar, label: 'Calendar' },
              { icon: Pill, label: 'Medications' },
            ].map((item) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                  item.active 
                    ? 'bg-white text-[#013DC4] font-semibold shadow-lg' 
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="pt-4 border-t border-white/20 mt-4 space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/10 text-left">
              <Shield className="w-5 h-5" />
              <span className="text-sm">Privacy Policy</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/10 text-left">
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-100 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <button 
            className="lg:hidden p-2 hover:bg-slate-100 rounded-xl"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          
          <div className="hidden lg:flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-800">Welcome back, Sarah!</h1>
            <div className="flex items-center gap-1 px-3 py-1 bg-[#CDB6EF]/20 rounded-full">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold text-slate-700">{streak} day streak</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
              <span className="font-medium text-slate-800">EN</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-400">DE</span>
            </div>
            
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <MapPin className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
              <CloudRain className="w-4 h-4 text-slate-500" />
              <div className="w-8 h-4 bg-slate-300 rounded-full relative">
                <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow" />
              </div>
            </div>
            
            <button 
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="lg:hidden mb-4">
              <h1 className="text-2xl font-bold text-slate-800 mb-1">Welcome back, Sarah!</h1>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-slate-600">{streak} day streak</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <StatCard icon={Zap} label="Total XP" value={xp.toLocaleString()} trend="+120 today" color="blue" />
              <StatCard icon={Flame} label="Streak" value={`${streak} days`} color="orange" />
              <StatCard icon={Target} label="Quests" value="2/5" color="purple" />
              <StatCard icon={Trophy} label="Badges" value="12" color="green" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <SectionHeader 
                  title="Speak to Loretta" 
                  action={<ChevronRight className="w-5 h-5 text-slate-400" />}
                />
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#CDB6EF]/20 to-[#D2EDFF]/20 rounded-xl cursor-pointer hover:from-[#CDB6EF]/30 hover:to-[#D2EDFF]/30 transition-colors">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#CDB6EF] to-[#A78BDA] flex items-center justify-center">
                    <MessageCircle className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 mb-1">Your AI Health Companion</h3>
                    <p className="text-sm text-slate-500">Get personalized guidance and support for your health journey</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <SectionHeader title="Risk Score" />
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#E2E8F0" strokeWidth="10" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#22C55E" strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={`${(100 - 23) * 2.51} 251`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-slate-800">23</span>
                    </div>
                  </div>
                  <div>
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-md mb-1">Low Risk</span>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                      <span>Stable</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <SectionHeader 
                title="Setup Progress" 
                action={<span className="text-sm text-[#013DC4] font-medium">3/4 complete</span>}
              />
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                <div className="h-full w-3/4 bg-gradient-to-r from-[#013DC4] to-[#CDB6EF] rounded-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Data Consent', complete: true, xp: 10 },
                  { label: 'Complete Profile', complete: true, xp: 25 },
                  { label: 'Health Questionnaire', complete: true, xp: 50 },
                  { label: 'First Check-In', complete: false, xp: 15 },
                ].map((step, i) => (
                  <div 
                    key={i}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      step.complete 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-white border-slate-200 hover:border-[#CDB6EF] cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {step.complete ? (
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-[#CDB6EF]" />
                      )}
                      <span className={`text-sm font-medium ${step.complete ? 'text-slate-400' : 'text-slate-700'}`}>
                        {step.label}
                      </span>
                    </div>
                    {!step.complete && (
                      <span className="text-xs text-[#CDB6EF] font-medium ml-7">+{step.xp} XP</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <SectionHeader 
                  title="Daily Check-In" 
                  action={<span className="px-2 py-1 bg-[#CDB6EF]/20 text-purple-700 text-xs font-semibold rounded-md">3 this week</span>}
                />
                <button className="w-full py-4 bg-gradient-to-r from-[#013DC4] to-[#0150FF] text-white rounded-xl font-semibold mb-4 hover:shadow-lg hover:shadow-[#013DC4]/20 transition-all">
                  <div className="flex items-center justify-center gap-2">
                    <Smile className="w-5 h-5" />
                    <span>Start Check-in</span>
                    <span className="px-2 py-0.5 bg-white/20 rounded text-xs">+15 XP</span>
                  </div>
                </button>
                <div className="space-y-2">
                  {[
                    { emoji: '😊', emotion: 'Happy', time: 'Today, 9:15am' },
                    { emoji: '😌', emotion: 'Calm', time: 'Yesterday' },
                  ].map((c, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <span className="text-2xl">{c.emoji}</span>
                      <div>
                        <p className="font-medium text-slate-800">{c.emotion}</p>
                        <p className="text-xs text-slate-500">{c.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <SectionHeader 
                  title="Active Missions" 
                  action={<button className="text-sm text-[#013DC4] font-medium hover:underline">View All</button>}
                />
                <div className="space-y-3">
                  {[
                    { title: 'Morning Stretch', xp: 20, progress: 80, color: 'bg-blue-500' },
                    { title: 'Hydration Hero', xp: 15, progress: 50, color: 'bg-[#CDB6EF]' },
                    { title: 'Mindful Moment', xp: 25, progress: 0, color: 'bg-orange-400' },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-1.5 h-12 rounded-full ${m.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-slate-800">{m.title}</span>
                          <span className="text-xs text-[#013DC4] font-medium">+{m.xp} XP</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${m.color} rounded-full`} style={{ width: `${m.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <SectionHeader 
                  title="Leaderboard" 
                  action={<button className="text-sm text-[#013DC4] font-medium hover:underline">View All</button>}
                />
                <div className="space-y-2">
                  {[
                    { rank: 1, name: 'Emma K.', xp: 3240, isTop: true },
                    { rank: 2, name: 'Michael R.', xp: 2890 },
                    { rank: 3, name: 'Sarah (You)', xp: 2450, isYou: true },
                  ].map((u) => (
                    <div key={u.rank} className={`flex items-center gap-3 p-3 rounded-xl ${
                      u.isYou ? 'bg-[#013DC4]/5 ring-1 ring-[#013DC4]/20' : 'hover:bg-slate-50'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        u.rank === 1 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {u.rank === 1 ? '🏆' : u.rank}
                      </div>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold ${
                        u.isYou ? 'bg-[#013DC4]' : 'bg-[#CDB6EF]'
                      }`}>
                        {u.name[0]}
                      </div>
                      <span className={`flex-1 font-medium ${u.isYou ? 'text-[#013DC4]' : 'text-slate-800'}`}>{u.name}</span>
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4 text-[#013DC4]" />
                        <span className="font-semibold text-slate-700">{u.xp.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <SectionHeader 
                  title="Medications" 
                  action={<span className="px-2 py-1 bg-[#013DC4]/10 text-[#013DC4] text-xs font-semibold rounded-md">2 tracked</span>}
                />
                <div className="space-y-3">
                  {[
                    { name: 'Vitamin D', dosage: '1000 IU', time: '8:00 AM', adherence: 95 },
                    { name: 'Omega-3', dosage: '500mg', time: '8:00 AM', adherence: 88 },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#013DC4]/10 flex items-center justify-center">
                          <Pill className="w-5 h-5 text-[#013DC4]" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{m.name}</p>
                          <p className="text-xs text-slate-500">{m.dosage} • {m.time}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold ${m.adherence >= 90 ? 'text-green-600' : 'text-amber-600'}`}>
                        {m.adherence}%
                      </span>
                    </div>
                  ))}
                  <button className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-500 rounded-xl font-medium hover:border-[#013DC4] hover:text-[#013DC4] transition-colors">
                    + Add Medication
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <SectionHeader title="Health Science" />
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Evidence-based health tips</h3>
                  <p className="text-sm text-slate-500">Educational content to support your wellness journey</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
              </div>
            </div>
            
            <p className="text-xs text-slate-400 text-center py-4">
              Loretta provides general wellness information only. Always consult with healthcare professionals for medical advice.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
