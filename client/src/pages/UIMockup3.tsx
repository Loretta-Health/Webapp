import { useState } from 'react';
import { 
  Heart, Flame, Star, TrendingUp, Users, ChevronRight, Zap, Target, 
  Menu, X, User, MessageCircle, LogOut, Shield, Accessibility, Sun, Moon,
  MapPin, CloudRain, Smile, Pill, BookOpen, Check, Sparkles, ChevronDown, Trophy, Leaf
} from 'lucide-react';
import logomarkViolet from '@assets/Logomark_violet@2x_1766161339181.png';
import logoHorizontalBlue from '@assets/Logo_horizontal_blue@2x_(1)_1766161586795.png';

function NatureCard({ 
  children, 
  className = '',
  accent = false
}: { 
  children: React.ReactNode; 
  className?: string;
  accent?: boolean;
}) {
  return (
    <div className={`
      bg-white/95 backdrop-blur-sm rounded-3xl shadow-sm
      border ${accent ? 'border-[#013DC4]/20' : 'border-[#D2EDFF]'}
      ${className}
    `}>
      {children}
    </div>
  );
}

function StatBubble({ 
  icon: Icon, 
  label, 
  value, 
  color = 'blue'
}: { 
  icon: any;
  label: string;
  value: string | number;
  color?: 'blue' | 'lightblue' | 'amber' | 'purple';
}) {
  const colors = {
    blue: 'bg-[#013DC4] text-white',
    lightblue: 'bg-[#D2EDFF] text-[#013DC4]',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-[#CDB6EF]/30 text-purple-600',
  };
  
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl p-3 sm:p-4 border border-[#D2EDFF] shadow-sm">
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${colors[color]} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-lg sm:text-xl font-bold text-slate-800 truncate">{value}</p>
        <p className="text-xs sm:text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function UIMockup3() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [communityType, setCommunityType] = useState<'loretta' | 'friends' | 'team'>('loretta');
  
  const xp = 2450;
  const level = 8;
  const streak = 12;
  const nextLevelXP = 3000;
  const xpProgress = (xp / nextLevelXP) * 100;
  
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#D2EDFF]/40 via-white to-[#CDB6EF]/10">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-[280px] lg:w-80
        bg-gradient-to-b from-white via-white to-[#D2EDFF]/30
        border-r border-[#D2EDFF]
        flex flex-col overflow-y-auto
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 lg:p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <img src={logoHorizontalBlue} alt="Loretta" className="h-8 lg:h-9 object-contain" />
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-[#D2EDFF] rounded-xl">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          
          <div className="bg-gradient-to-br from-[#013DC4] to-[#0150FF] rounded-2xl p-4 mb-5 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold truncate">sarah_health</h3>
                <p className="text-sm text-white/80">Level {level} Explorer</p>
              </div>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/80">Next level</span>
                <span className="font-medium">{xp.toLocaleString()} / {nextLevelXP.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${xpProgress}%` }} />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="bg-amber-50 rounded-xl p-2.5 text-center">
              <div className="flex items-center justify-center text-amber-600 mb-0.5">
                <Flame className="w-3.5 h-3.5 mr-1" />
                <span className="font-bold text-sm">{streak}</span>
              </div>
              <span className="text-[10px] text-slate-500">Streak</span>
            </div>
            <div className="bg-[#D2EDFF] rounded-xl p-2.5 text-center">
              <div className="text-[#013DC4] font-bold text-sm mb-0.5">2/5</div>
              <span className="text-[10px] text-slate-500">Quests</span>
            </div>
            <div className="bg-[#CDB6EF]/30 rounded-xl p-2.5 text-center">
              <div className="text-purple-600 font-bold text-sm mb-0.5">3</div>
              <span className="text-[10px] text-slate-500">Badges</span>
            </div>
          </div>
          
          <div className="mb-5">
            <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">Community</h4>
            <div className="space-y-1">
              {[
                { id: 'loretta', label: 'Loretta Community', icon: Users },
                { id: 'friends', label: 'My Friends', icon: Heart },
                { id: 'team', label: 'My Team', icon: Target },
              ].map((opt) => (
                <button 
                  key={opt.id}
                  onClick={() => setCommunityType(opt.id as any)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                    communityType === opt.id 
                      ? 'bg-[#D2EDFF] text-[#013DC4]' 
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <opt.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <nav className="space-y-1 flex-1">
            {[
              { icon: User, label: 'My Profile', active: true },
              { icon: MessageCircle, label: 'Health Navigator' },
              { icon: Users, label: 'Leaderboard' },
            ].map((item) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                  item.active 
                    ? 'bg-[#013DC4] text-white shadow-lg shadow-[#013DC4]/20' 
                    : 'hover:bg-[#D2EDFF]/50 text-slate-600'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="pt-4 border-t border-[#D2EDFF] mt-4 space-y-1">
            <button className="w-full flex items-center gap-3 p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 text-left">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Privacy Policy</span>
            </button>
            <button className="w-full flex items-center gap-3 p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 text-left">
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/80 backdrop-blur-sm border-b border-[#D2EDFF] px-3 sm:px-6 py-2.5 flex items-center justify-between">
          <button 
            className="lg:hidden p-2 hover:bg-[#D2EDFF] rounded-xl"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          
          <div className="hidden lg:flex items-center gap-2">
            <Leaf className="w-5 h-5 text-[#013DC4]" />
            <span className="text-sm text-slate-500">A beautiful day for wellness</span>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-[#D2EDFF]/50 rounded-lg text-sm">
              <span className="font-medium text-[#013DC4]">EN</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-400">DE</span>
            </div>
            
            <button className="p-2 hover:bg-[#D2EDFF] rounded-lg text-slate-500">
              <MapPin className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-[#D2EDFF]/50 rounded-lg">
              <CloudRain className="w-4 h-4 text-[#013DC4]" />
              <span className="text-sm text-[#013DC4] font-medium hidden sm:inline">22°C</span>
              <div className="w-8 h-4 bg-[#D2EDFF] rounded-full relative">
                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-[#013DC4] rounded-full shadow" />
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
        
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5">
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#3B7BF7]">
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-[#D2EDFF] rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
                <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-[#CDB6EF] rounded-full blur-3xl -translate-x-1/4 translate-y-1/4" />
              </div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs sm:text-sm text-white font-medium">
                      Level {level}
                    </span>
                    <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs sm:text-sm text-white font-medium flex items-center gap-1">
                      <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {streak} day streak
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">
                    Good morning, Sarah!
                  </h1>
                  <p className="text-sm sm:text-base text-white/80">Take a deep breath. You're doing great.</p>
                </div>
                <div className="hidden sm:flex w-14 h-14 lg:w-16 lg:h-16 bg-white/20 rounded-2xl items-center justify-center flex-shrink-0">
                  <img src={logomarkViolet} alt="" className="w-8 h-8 lg:w-10 lg:h-10 brightness-0 invert" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <StatBubble icon={Zap} label="Total XP" value={xp.toLocaleString()} color="blue" />
              <StatBubble icon={Flame} label="Streak" value={`${streak} days`} color="amber" />
              <StatBubble icon={Target} label="Quests" value="2/5" color="lightblue" />
              <StatBubble icon={Trophy} label="Badges" value="12" color="purple" />
            </div>
            
            <NatureCard className="p-4 sm:p-5" accent>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-800">Speak to Loretta</h2>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-[#CDB6EF]/30 to-[#D2EDFF]/50 rounded-xl sm:rounded-2xl cursor-pointer hover:from-[#CDB6EF]/40 hover:to-[#D2EDFF]/70 transition-colors">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#CDB6EF] to-[#013DC4] flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-800 mb-0.5 text-sm sm:text-base">Your AI Health Companion</h3>
                  <p className="text-xs sm:text-sm text-slate-500 truncate">Personalized guidance for your wellness journey</p>
                </div>
              </div>
            </NatureCard>
            
            <NatureCard className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-800">Complete Your Setup</h2>
                <span className="text-sm text-[#013DC4] font-medium">3/4</span>
              </div>
              <div className="h-2 bg-[#D2EDFF] rounded-full overflow-hidden mb-3 sm:mb-4">
                <div className="h-full w-3/4 bg-gradient-to-r from-[#013DC4] to-[#3B7BF7] rounded-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {[
                  { label: 'Data Consent', complete: true, xp: 10 },
                  { label: 'Complete Profile', complete: true, xp: 25 },
                  { label: 'Health Questionnaire', complete: true, xp: 50 },
                  { label: 'First Check-In', complete: false, xp: 15 },
                ].map((step, i) => (
                  <div 
                    key={i}
                    className={`p-3 rounded-xl transition-all ${
                      step.complete 
                        ? 'bg-[#D2EDFF]/50 border border-[#D2EDFF]' 
                        : 'bg-white border-2 border-dashed border-[#CDB6EF] hover:bg-[#CDB6EF]/10 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {step.complete ? (
                        <div className="w-5 h-5 rounded-full bg-[#013DC4] flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-[#CDB6EF] flex-shrink-0" />
                      )}
                      <span className={`text-xs sm:text-sm font-medium truncate ${step.complete ? 'text-slate-400' : 'text-slate-700'}`}>
                        {step.label}
                      </span>
                    </div>
                    {!step.complete && (
                      <span className="text-xs text-[#CDB6EF] font-medium ml-7">+{step.xp} XP</span>
                    )}
                  </div>
                ))}
              </div>
            </NatureCard>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <NatureCard className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-4 h-4 text-rose-500" />
                    </div>
                    <h2 className="font-bold text-slate-800 text-sm sm:text-base">Risk Score</h2>
                  </div>
                  <button className="text-xs sm:text-sm text-[#013DC4] font-medium hover:underline">Details</button>
                </div>
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#D2EDFF" strokeWidth="10" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#013DC4" strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={`${(100 - 23) * 2.51} 251`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl sm:text-2xl font-bold text-slate-800">23</span>
                      <span className="text-xs text-[#013DC4]">Low</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm sm:text-base text-slate-600 mb-2">Your health is on track!</p>
                    <div className="flex items-center gap-1 text-sm text-[#013DC4]">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-medium">Stable trend</span>
                    </div>
                  </div>
                </div>
              </NatureCard>
              
              <NatureCard className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#CDB6EF]/30 flex items-center justify-center flex-shrink-0">
                      <Smile className="w-4 h-4 text-[#CDB6EF]" />
                    </div>
                    <h2 className="font-bold text-slate-800 text-sm sm:text-base">Daily Check-In</h2>
                  </div>
                  <span className="px-2 py-1 bg-[#CDB6EF]/20 text-purple-700 text-[10px] sm:text-xs font-semibold rounded-md">3 this week</span>
                </div>
                <button className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-[#013DC4] to-[#3B7BF7] text-white rounded-xl font-semibold mb-3 sm:mb-4 hover:shadow-lg hover:shadow-[#013DC4]/20 transition-all flex items-center justify-center gap-2 text-sm sm:text-base">
                  <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
                  Start Check-in
                  <span className="px-2 py-0.5 bg-white/20 rounded text-xs">+15 XP</span>
                </button>
                <div className="flex gap-2">
                  {['😊', '😌', '⚡'].map((e, i) => (
                    <div key={i} className="flex-1 text-center p-2 bg-[#D2EDFF]/30 rounded-xl">
                      <span className="text-lg sm:text-xl">{e}</span>
                    </div>
                  ))}
                </div>
              </NatureCard>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <NatureCard className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#D2EDFF] flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-[#013DC4]" />
                    </div>
                    <h2 className="font-bold text-slate-800 text-sm sm:text-base">Active Missions</h2>
                  </div>
                  <button className="text-xs sm:text-sm text-[#013DC4] font-medium hover:underline">View All</button>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {[
                    { title: 'Morning Walk', xp: 20, progress: 80, color: 'bg-[#013DC4]' },
                    { title: 'Drink Water', xp: 15, progress: 50, color: 'bg-[#3B7BF7]' },
                    { title: 'Mindful Breathing', xp: 25, progress: 0, color: 'bg-[#CDB6EF]' },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 sm:p-3 bg-[#D2EDFF]/20 rounded-xl">
                      <div className={`w-1.5 sm:w-2 h-8 sm:h-10 rounded-full ${m.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-slate-700 text-sm truncate">{m.title}</span>
                          <span className="text-xs text-[#013DC4] font-medium flex-shrink-0 ml-2">+{m.xp} XP</span>
                        </div>
                        <div className="h-1.5 bg-[#D2EDFF] rounded-full overflow-hidden">
                          <div className={`h-full ${m.color} rounded-full`} style={{ width: `${m.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </NatureCard>
              
              <NatureCard className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#D2EDFF] flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-[#013DC4]" />
                    </div>
                    <h2 className="font-bold text-slate-800 text-sm sm:text-base">Leaderboard</h2>
                  </div>
                  <button className="text-xs sm:text-sm text-[#013DC4] font-medium hover:underline">View All</button>
                </div>
                <div className="space-y-2">
                  {[
                    { rank: 1, name: 'Emma K.', xp: 3240 },
                    { rank: 2, name: 'Michael R.', xp: 2890 },
                    { rank: 3, name: 'Sarah (You)', xp: 2450, isYou: true },
                  ].map((u) => (
                    <div key={u.rank} className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl ${
                      u.isYou ? 'bg-[#013DC4]/5 ring-1 ring-[#013DC4]/20' : 'bg-[#D2EDFF]/20'
                    }`}>
                      <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 ${
                        u.rank === 1 ? 'bg-amber-100 text-amber-600' : 'bg-[#D2EDFF] text-[#013DC4]'
                      }`}>
                        {u.rank === 1 ? '🏆' : u.rank}
                      </div>
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0 ${
                        u.isYou ? 'bg-[#013DC4]' : 'bg-[#3B7BF7]'
                      }`}>
                        {u.name[0]}
                      </div>
                      <span className={`flex-1 font-medium text-sm truncate ${u.isYou ? 'text-[#013DC4]' : 'text-slate-700'}`}>{u.name}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                        <span className="font-semibold text-slate-600 text-sm">{u.xp.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </NatureCard>
            </div>
            
            <NatureCard className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#013DC4]/10 flex items-center justify-center flex-shrink-0">
                    <Pill className="w-4 h-4 text-[#013DC4]" />
                  </div>
                  <h2 className="font-bold text-slate-800 text-sm sm:text-base">Medications</h2>
                </div>
                <span className="px-2 py-1 bg-[#D2EDFF] text-[#013DC4] text-[10px] sm:text-xs font-semibold rounded-md">2 tracked</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
                {[
                  { name: 'Vitamin D', dosage: '1000 IU', time: '8:00 AM', adherence: 95 },
                  { name: 'Omega-3', dosage: '500mg', time: '8:00 AM', adherence: 88 },
                ].map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-3 sm:p-4 bg-[#D2EDFF]/20 rounded-xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-[#D2EDFF] flex items-center justify-center flex-shrink-0">
                        <Pill className="w-4 h-4 sm:w-5 sm:h-5 text-[#013DC4]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-700 text-sm truncate">{m.name}</p>
                        <p className="text-xs text-slate-500">{m.dosage} • {m.time}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold flex-shrink-0 ml-2 ${m.adherence >= 90 ? 'text-[#013DC4]' : 'text-amber-600'}`}>
                      {m.adherence}%
                    </span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 py-2.5 sm:py-3 border-2 border-dashed border-[#D2EDFF] text-slate-500 rounded-xl font-medium hover:border-[#013DC4] hover:text-[#013DC4] transition-colors text-sm">
                + Add Medication
              </button>
            </NatureCard>
            
            <NatureCard className="p-4 sm:p-5">
              <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-[#D2EDFF]/50 to-[#CDB6EF]/20 rounded-xl cursor-pointer hover:from-[#D2EDFF]/70 hover:to-[#CDB6EF]/30 transition-colors">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#013DC4] flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Health Science</h3>
                  <p className="text-xs sm:text-sm text-slate-500 truncate">Evidence-based tips for your wellness journey</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
              </div>
            </NatureCard>
            
            <p className="text-[10px] sm:text-xs text-slate-400 text-center py-3 sm:py-4">
              Loretta provides general wellness information only. Always consult with healthcare professionals for medical advice.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
