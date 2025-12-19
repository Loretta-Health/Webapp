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
      bg-white/90 backdrop-blur-sm rounded-3xl shadow-sm
      border ${accent ? 'border-emerald-200' : 'border-stone-100'}
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
  color = 'emerald'
}: { 
  icon: any;
  label: string;
  value: string | number;
  color?: 'emerald' | 'sky' | 'amber' | 'violet';
}) {
  const colors = {
    emerald: 'bg-emerald-100 text-emerald-600',
    sky: 'bg-sky-100 text-sky-600',
    amber: 'bg-amber-100 text-amber-600',
    violet: 'bg-violet-100 text-violet-600',
  };
  
  return (
    <div className="flex items-center gap-3 bg-white/80 rounded-2xl p-3 border border-stone-100">
      <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-lg font-bold text-stone-800">{value}</p>
        <p className="text-xs text-stone-500">{label}</p>
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
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-stone-50 to-sky-50">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-stone-900/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-72 lg:w-80
        bg-gradient-to-b from-white via-white to-emerald-50/50
        border-r border-emerald-100
        flex flex-col overflow-y-auto
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-5 lg:p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <img src={logoHorizontalBlue} alt="Loretta" className="h-9 object-contain" />
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-emerald-100 rounded-xl">
              <X className="w-5 h-5 text-stone-500" />
            </button>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 mb-5 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">sarah_health</h3>
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
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center text-amber-600 mb-1">
                <Flame className="w-4 h-4 mr-1" />
                <span className="font-bold">{streak}</span>
              </div>
              <span className="text-xs text-stone-500">Streak</span>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <div className="text-emerald-600 font-bold mb-1">2/5</div>
              <span className="text-xs text-stone-500">Quests</span>
            </div>
            <div className="bg-violet-50 rounded-xl p-3 text-center">
              <div className="text-violet-600 font-bold mb-1">3</div>
              <span className="text-xs text-stone-500">Badges</span>
            </div>
          </div>
          
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2 px-1">Community</h4>
            <div className="space-y-1">
              {[
                { id: 'loretta', label: 'Loretta Community', icon: Users },
                { id: 'friends', label: 'My Friends', icon: Heart },
                { id: 'team', label: 'My Team', icon: Target },
              ].map((opt) => (
                <button 
                  key={opt.id}
                  onClick={() => setCommunityType(opt.id as any)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    communityType === opt.id 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'hover:bg-stone-100 text-stone-600'
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
                    ? 'bg-[#013DC4] text-white' 
                    : 'hover:bg-stone-100 text-stone-600'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="pt-4 border-t border-stone-200 mt-4 space-y-1">
            <button className="w-full flex items-center gap-3 p-3 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 text-left">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Privacy Policy</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 text-left">
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/70 backdrop-blur-sm border-b border-emerald-100 px-4 lg:px-6 py-3 flex items-center justify-between">
          <button 
            className="lg:hidden p-2 hover:bg-emerald-100 rounded-xl"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 text-stone-600" />
          </button>
          
          <div className="hidden lg:flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-500" />
            <span className="text-sm text-stone-500">A beautiful day for wellness</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-stone-100 rounded-lg text-sm">
              <span className="font-medium text-stone-700">EN</span>
              <span className="text-stone-400">/</span>
              <span className="text-stone-400">DE</span>
            </div>
            
            <button className="p-2 hover:bg-emerald-100 rounded-lg text-stone-500">
              <MapPin className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg">
              <CloudRain className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 hidden sm:inline">22°C</span>
              <div className="w-8 h-4 bg-emerald-200 rounded-full relative">
                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow" />
              </div>
            </div>
            
            <button 
              className="p-2 hover:bg-stone-100 rounded-lg text-stone-500"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-5xl mx-auto space-y-5">
            <div className="relative overflow-hidden rounded-3xl p-6 lg:p-8 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-300 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4" />
              </div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm text-white font-medium">
                      Level {level}
                    </span>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm text-white font-medium flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> {streak} day streak
                    </span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                    Good morning, Sarah!
                  </h1>
                  <p className="text-white/80">Take a deep breath. You're doing great.</p>
                </div>
                <div className="hidden sm:flex w-16 h-16 bg-white/20 rounded-2xl items-center justify-center">
                  <img src={logomarkViolet} alt="" className="w-10 h-10 brightness-0 invert" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatBubble icon={Zap} label="Total XP" value={xp.toLocaleString()} color="emerald" />
              <StatBubble icon={Flame} label="Streak" value={`${streak} days`} color="amber" />
              <StatBubble icon={Target} label="Quests" value="2/5" color="sky" />
              <StatBubble icon={Trophy} label="Badges" value="12" color="violet" />
            </div>
            
            <NatureCard className="p-5" accent>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-stone-800">Speak to Loretta</h2>
                <ChevronRight className="w-5 h-5 text-stone-400" />
              </div>
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#CDB6EF]/30 to-emerald-100/50 rounded-2xl cursor-pointer hover:from-[#CDB6EF]/40 hover:to-emerald-100/70 transition-colors">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#CDB6EF] to-[#013DC4] flex items-center justify-center">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-800 mb-0.5">Your AI Health Companion</h3>
                  <p className="text-sm text-stone-500">Personalized guidance for your wellness journey</p>
                </div>
              </div>
            </NatureCard>
            
            <NatureCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-stone-800">Complete Your Setup</h2>
                <span className="text-sm text-emerald-600 font-medium">3/4</span>
              </div>
              <div className="h-2 bg-emerald-100 rounded-full overflow-hidden mb-4">
                <div className="h-full w-3/4 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full" />
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
                        ? 'bg-emerald-50 border border-emerald-200' 
                        : 'bg-white border-2 border-dashed border-[#CDB6EF] hover:bg-[#CDB6EF]/10 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {step.complete ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-[#CDB6EF]" />
                      )}
                      <span className={`text-sm font-medium ${step.complete ? 'text-stone-400' : 'text-stone-700'}`}>
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
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <NatureCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                      <Heart className="w-4 h-4 text-rose-500" />
                    </div>
                    <h2 className="font-bold text-stone-800">Risk Score</h2>
                  </div>
                  <button className="text-sm text-[#013DC4] font-medium hover:underline">Details</button>
                </div>
                <div className="flex items-center gap-5">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#E7E5E4" strokeWidth="10" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#22C55E" strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={`${(100 - 23) * 2.51} 251`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-stone-800">23</span>
                      <span className="text-xs text-emerald-600">Low</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-stone-600 mb-2">Your health is on track!</p>
                    <div className="flex items-center gap-1 text-sm text-emerald-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-medium">Stable trend</span>
                    </div>
                  </div>
                </div>
              </NatureCard>
              
              <NatureCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#CDB6EF]/30 flex items-center justify-center">
                      <Smile className="w-4 h-4 text-[#CDB6EF]" />
                    </div>
                    <h2 className="font-bold text-stone-800">Daily Check-In</h2>
                  </div>
                  <span className="px-2 py-1 bg-[#CDB6EF]/20 text-purple-700 text-xs font-semibold rounded-md">3 this week</span>
                </div>
                <button className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold mb-4 hover:shadow-lg hover:shadow-emerald-200 transition-all flex items-center justify-center gap-2">
                  <Smile className="w-5 h-5" />
                  Start Check-in
                  <span className="px-2 py-0.5 bg-white/20 rounded text-xs">+15 XP</span>
                </button>
                <div className="flex gap-2">
                  {['😊', '😌', '⚡'].map((e, i) => (
                    <div key={i} className="flex-1 text-center p-2 bg-stone-50 rounded-xl">
                      <span className="text-xl">{e}</span>
                    </div>
                  ))}
                </div>
              </NatureCard>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <NatureCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Flame className="w-4 h-4 text-amber-500" />
                    </div>
                    <h2 className="font-bold text-stone-800">Active Missions</h2>
                  </div>
                  <button className="text-sm text-[#013DC4] font-medium hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  {[
                    { title: 'Morning Walk', xp: 20, progress: 80, color: 'bg-emerald-400' },
                    { title: 'Drink Water', xp: 15, progress: 50, color: 'bg-sky-400' },
                    { title: 'Mindful Breathing', xp: 25, progress: 0, color: 'bg-[#CDB6EF]' },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                      <div className={`w-2 h-10 rounded-full ${m.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-stone-700">{m.title}</span>
                          <span className="text-xs text-[#013DC4] font-medium">+{m.xp} XP</span>
                        </div>
                        <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                          <div className={`h-full ${m.color} rounded-full`} style={{ width: `${m.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </NatureCard>
              
              <NatureCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-sky-500" />
                    </div>
                    <h2 className="font-bold text-stone-800">Leaderboard</h2>
                  </div>
                  <button className="text-sm text-[#013DC4] font-medium hover:underline">View All</button>
                </div>
                <div className="space-y-2">
                  {[
                    { rank: 1, name: 'Emma K.', xp: 3240 },
                    { rank: 2, name: 'Michael R.', xp: 2890 },
                    { rank: 3, name: 'Sarah (You)', xp: 2450, isYou: true },
                  ].map((u) => (
                    <div key={u.rank} className={`flex items-center gap-3 p-3 rounded-xl ${
                      u.isYou ? 'bg-[#013DC4]/5 ring-1 ring-[#013DC4]/20' : 'bg-stone-50'
                    }`}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                        u.rank === 1 ? 'bg-amber-100 text-amber-600' : 'bg-stone-200 text-stone-500'
                      }`}>
                        {u.rank === 1 ? '🏆' : u.rank}
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                        u.isYou ? 'bg-[#013DC4]' : 'bg-emerald-400'
                      }`}>
                        {u.name[0]}
                      </div>
                      <span className={`flex-1 font-medium ${u.isYou ? 'text-[#013DC4]' : 'text-stone-700'}`}>{u.name}</span>
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span className="font-semibold text-stone-600">{u.xp.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </NatureCard>
            </div>
            
            <NatureCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#013DC4]/10 flex items-center justify-center">
                    <Pill className="w-4 h-4 text-[#013DC4]" />
                  </div>
                  <h2 className="font-bold text-stone-800">Medications</h2>
                </div>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-md">2 tracked</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {[
                  { name: 'Vitamin D', dosage: '1000 IU', time: '8:00 AM', adherence: 95 },
                  { name: 'Omega-3', dosage: '500mg', time: '8:00 AM', adherence: 88 },
                ].map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center">
                        <Pill className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-medium text-stone-700">{m.name}</p>
                        <p className="text-xs text-stone-500">{m.dosage} • {m.time}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${m.adherence >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {m.adherence}%
                    </span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 py-3 border-2 border-dashed border-stone-300 text-stone-500 rounded-xl font-medium hover:border-emerald-400 hover:text-emerald-600 transition-colors">
                + Add Medication
              </button>
            </NatureCard>
            
            <NatureCard className="p-5">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-stone-800">Health Science</h3>
                  <p className="text-sm text-stone-500">Evidence-based tips for your wellness journey</p>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-400" />
              </div>
            </NatureCard>
            
            <p className="text-xs text-stone-400 text-center py-4">
              Loretta provides general wellness information only. Always consult with healthcare professionals for medical advice.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
