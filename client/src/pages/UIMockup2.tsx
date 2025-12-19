import { useState } from 'react';
import { 
  Heart, Flame, Star, TrendingUp, Users, ChevronRight, Zap, Target, 
  Menu, X, User, MessageCircle, LogOut, Shield, Accessibility, Sun, Moon,
  MapPin, CloudRain, Smile, Pill, BookOpen, Check, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';
import logomarkViolet from '@assets/Logomark_violet@2x_1766161339181.png';
import logoHorizontalBlue from '@assets/Logo_horizontal_blue@2x_(1)_1766161586795.png';

function GlassCard({ 
  children, 
  className = '',
  glow = false 
}: { 
  children: React.ReactNode; 
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

function CollapsibleSection({ 
  title, 
  icon, 
  badge, 
  children, 
  defaultOpen = true,
  gradient = false
}: { 
  title: string; 
  icon: React.ReactNode; 
  badge?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  gradient?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <GlassCard className="overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-5 flex items-center justify-between transition-colors ${
          gradient ? 'bg-gradient-to-r from-[#013DC4]/5 to-[#CDB6EF]/10' : 'hover:bg-white/50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#CDB6EF] flex items-center justify-center text-white shadow-lg">
            {icon}
          </div>
          <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
          {badge}
        </div>
        <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>
      </button>
      <div className={`overflow-hidden transition-all ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-5 pb-5">{children}</div>
      </div>
    </GlassCard>
  );
}

export default function UIMockup2() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [communityType, setCommunityType] = useState<'loretta' | 'friends' | 'team'>('loretta');
  
  const xp = 2450;
  const level = 8;
  const streak = 12;
  const nextLevelXP = 3000;
  const xpProgress = (xp / nextLevelXP) * 100;
  
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF]">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-80 lg:w-[340px]
        bg-gradient-to-b from-white/90 to-white/70 backdrop-blur-2xl
        border-r border-white/50
        flex flex-col overflow-y-auto
        transform transition-transform duration-500 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        shadow-2xl shadow-[#013DC4]/5
      `}>
        <div className="p-5 lg:p-7 space-y-5 lg:space-y-6">
          <div className="flex items-center justify-between lg:hidden">
            <img src={logoHorizontalBlue} alt="Loretta" className="h-9 object-contain" />
            <button onClick={() => setSidebarOpen(false)} className="p-2.5 hover:bg-white/50 rounded-2xl transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="hidden lg:flex justify-center py-2">
            <img src={logoHorizontalBlue} alt="Loretta" className="h-12 object-contain" />
          </div>
          
          <GlassCard className="p-5 text-center" glow>
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-3xl bg-gradient-to-br from-[#013DC4] via-[#0150FF] to-[#CDB6EF] flex items-center justify-center shadow-2xl shadow-[#013DC4]/30 rotate-3 hover:rotate-0 transition-transform">
                <User className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-gradient-to-br from-[#CDB6EF] to-purple-400 rounded-xl flex items-center justify-center border-3 border-white shadow-lg -rotate-6">
                <img src={logomarkViolet} alt="" className="w-5 h-5 brightness-0 invert" />
              </div>
            </div>
            <h2 className="text-xl lg:text-2xl font-black text-gray-900">sarah_health</h2>
            <p className="text-sm text-gray-500 font-medium">Level {level} Health Explorer</p>
            
            <div className="mt-4 p-3 bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 rounded-2xl">
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center">
                    <Star className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-bold text-gray-700">Level {level}</span>
                </div>
                <span className="text-gray-500 font-medium">{xp.toLocaleString()} / {nextLevelXP.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-white/50 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] rounded-full transition-all shadow-lg"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">Today's Progress</h3>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-400 to-red-400 rounded-full shadow-lg">
                <Flame className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">{streak}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'XP', value: `+${xp}`, color: 'from-[#013DC4] to-[#0150FF]' },
                { label: 'Quests', value: '2/5', color: 'from-[#CDB6EF] to-purple-400' },
                { label: 'Badges', value: '3', color: 'from-amber-400 to-orange-400' },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-3 rounded-2xl bg-white/50">
                  <div className={`text-lg font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">My Community</h3>
            <div className="space-y-2">
              {[
                { id: 'loretta', label: 'Loretta Community', icon: Users, gradient: 'from-[#013DC4] to-[#0150FF]' },
                { id: 'friends', label: 'My Friends', icon: Heart, gradient: 'from-[#CDB6EF] to-purple-400' },
                { id: 'team', label: 'My Team', icon: Target, gradient: 'from-amber-400 to-orange-400' },
              ].map((option) => (
                <button 
                  key={option.id}
                  onClick={() => setCommunityType(option.id as any)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                    communityType === option.id 
                      ? 'bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 shadow-lg' 
                      : 'hover:bg-white/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center shadow-lg`}>
                    <option.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`font-semibold ${communityType === option.id ? 'text-[#013DC4]' : 'text-gray-700'}`}>
                    {option.label}
                  </span>
                  {communityType === option.id && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-gradient-to-r from-[#013DC4] to-[#CDB6EF]" />
                  )}
                </button>
              ))}
            </div>
          </GlassCard>
          
          <div className="space-y-2">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider px-1">Navigation</h3>
            {[
              { label: 'My Profile', icon: User, gradient: 'from-[#013DC4] to-[#0150FF]', active: true },
              { label: 'Health Navigator', icon: MessageCircle, gradient: 'from-[#CDB6EF] to-purple-400' },
              { label: 'Leaderboard', icon: Users, gradient: 'from-amber-400 to-orange-400' },
              { label: 'Sign Out', icon: LogOut, gradient: 'from-gray-400 to-gray-500' },
            ].map((item) => (
              <button 
                key={item.label}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all ${
                  item.active ? 'bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10' : 'hover:bg-white/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg`}>
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <span className={`font-semibold ${item.active ? 'text-[#013DC4]' : 'text-gray-700'}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
          
          <div className="flex gap-4 px-1 pt-2">
            <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#013DC4] transition-colors font-medium">
              <Shield className="w-3.5 h-3.5" />
              Privacy
            </button>
            <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#013DC4] transition-colors font-medium">
              <Accessibility className="w-3.5 h-3.5" />
              Accessibility
            </button>
          </div>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#4B7BE5] text-white px-4 py-3 flex items-center justify-between shadow-2xl shadow-[#013DC4]/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
          
          <button 
            className="lg:hidden p-2.5 hover:bg-white/10 rounded-xl transition-colors relative z-10"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl flex items-center gap-2 shadow-lg">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center">
                <Star className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-bold">Level {level}</span>
            </div>
            
            <div className="flex items-center gap-1 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
              <span className="text-sm font-bold">EN</span>
              <span className="text-white/40">|</span>
              <span className="text-sm text-white/50">DE</span>
            </div>
            
            <button className="p-2.5 hover:bg-white/10 rounded-xl transition-colors">
              <MapPin className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
              <CloudRain className="w-5 h-5 text-white/70" />
              <span className="text-sm text-white/80 hidden sm:inline font-medium">Weather</span>
              <div className="w-10 h-5 bg-white/20 rounded-full relative cursor-pointer">
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-lg transition-transform" />
              </div>
            </div>
            
            <button 
              className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-5 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-5 lg:space-y-7">
            <div className="relative overflow-hidden rounded-[2rem] p-6 lg:p-8 bg-gradient-to-br from-[#013DC4] via-[#0150FF] to-[#4B7BE5] shadow-2xl shadow-[#013DC4]/30">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#CDB6EF]/30 to-transparent rounded-full blur-3xl" />
              
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-black text-white mb-2">
                    Welcome back, Sarah!
                  </h1>
                  <p className="text-white/80 text-lg font-medium">Ready to continue your health journey?</p>
                </div>
                <div className="hidden sm:flex w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl items-center justify-center shadow-2xl rotate-6 hover:rotate-0 transition-transform">
                  <img src={logomarkViolet} alt="Loretta mascot" className="w-12 h-12 object-contain brightness-0 invert" />
                </div>
              </div>
            </div>
            
            <button className="w-full group">
              <GlassCard className="p-5 hover:shadow-2xl hover:shadow-[#CDB6EF]/20 transition-all" glow>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#CDB6EF] via-purple-400 to-[#013DC4] flex items-center justify-center shadow-2xl shadow-[#CDB6EF]/30 group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-black text-xl text-gray-900 group-hover:text-[#013DC4] transition-colors">
                        Speak to Loretta
                      </h3>
                      <p className="text-gray-500 font-medium">Get personalized health guidance and support</p>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 flex items-center justify-center group-hover:bg-[#013DC4] transition-all">
                    <ChevronRight className="w-6 h-6 text-[#013DC4] group-hover:text-white transition-colors" />
                  </div>
                </div>
              </GlassCard>
            </button>
            
            <CollapsibleSection
              title="Complete Your Setup"
              icon={<Sparkles className="w-5 h-5" />}
              badge={<span className="ml-2 px-3 py-1 bg-gradient-to-r from-[#013DC4] to-[#0150FF] text-white text-xs font-bold rounded-full shadow-lg">3/4</span>}
              gradient
            >
              <div className="space-y-4">
                <div className="h-3 bg-white/50 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full w-3/4 bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] rounded-full shadow-lg" />
                </div>
                <p className="text-sm text-gray-500 font-medium">Complete all steps to unlock the leaderboard!</p>
                
                <div className="space-y-3">
                  {[
                    { label: 'Data Consent', complete: true, xp: 10 },
                    { label: 'Complete Profile', complete: true, xp: 25 },
                    { label: 'Health Questionnaire', complete: true, xp: 50 },
                    { label: 'First Emotional Check-In', complete: false, xp: 15 },
                  ].map((step, i) => (
                    <div 
                      key={i}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                        step.complete 
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50/50' 
                          : 'bg-white/50 hover:bg-white hover:shadow-lg cursor-pointer'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                        step.complete 
                          ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                          : 'bg-gradient-to-br from-[#CDB6EF] to-purple-400'
                      }`}>
                        {step.complete ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <Heart className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${step.complete ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {step.label}
                        </p>
                      </div>
                      {step.complete ? (
                        <span className="px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">Done</span>
                      ) : (
                        <span className="px-3 py-1 bg-gradient-to-r from-[#CDB6EF]/20 to-purple-100 text-purple-600 text-xs font-bold rounded-full">+{step.xp} XP</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleSection>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-7">
              <CollapsibleSection
                title="Risk Score"
                icon={<Heart className="w-5 h-5" />}
              >
                <div className="flex items-center gap-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-100" />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke="url(#scoreGradient)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${(100 - 23) * 2.51} 251`}
                      />
                      <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#22C55E" />
                          <stop offset="100%" stopColor="#10B981" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-gray-900">23</span>
                      <span className="text-sm text-green-600 font-bold">Low Risk</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <p className="text-gray-600 font-medium">Your health indicators are looking great!</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-green-600 font-bold">Stable</span>
                    </div>
                    <button className="text-sm text-[#013DC4] font-bold hover:underline flex items-center gap-1">
                      View Details <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CollapsibleSection>
              
              <CollapsibleSection
                title="Daily Check-In"
                icon={<Smile className="w-5 h-5" />}
                badge={<span className="ml-2 px-3 py-1 bg-gradient-to-r from-[#CDB6EF] to-purple-400 text-white text-xs font-bold rounded-full shadow-lg">3</span>}
              >
                <div className="space-y-4">
                  <button className="w-full py-4 bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#4B7BE5] text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-[#013DC4]/30 transition-all hover:scale-[1.02]">
                    Start Check-in (+15 XP)
                  </button>
                  
                  <div className="bg-gradient-to-br from-[#CDB6EF]/10 to-[#D2EDFF]/10 rounded-2xl p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Recent Check-ins</p>
                    <div className="space-y-2">
                      {[
                        { emoji: '😊', emotion: 'Happy', time: 'Today at 9:15am' },
                        { emoji: '😌', emotion: 'Calm', time: 'Yesterday at 8:30am' },
                        { emoji: '⚡', emotion: 'Energetic', time: 'Dec 17 at 10:00am' },
                      ].map((checkin, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/50 hover:bg-white hover:shadow-lg transition-all">
                          <span className="text-2xl">{checkin.emoji}</span>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{checkin.emotion}</p>
                            <p className="text-xs text-gray-500">{checkin.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsibleSection>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-7">
              <CollapsibleSection
                title="Active Missions"
                icon={<Flame className="w-5 h-5" />}
                badge={<span className="ml-2 px-3 py-1 bg-gradient-to-r from-orange-400 to-red-400 text-white text-xs font-bold rounded-full shadow-lg">3</span>}
              >
                <div className="space-y-4">
                  {[
                    { title: 'Morning Stretch', desc: 'Do 5 minutes of stretching', xp: 20, progress: 80, category: 'Activity' },
                    { title: 'Hydration Hero', desc: 'Drink 8 glasses of water', xp: 15, progress: 50, category: 'Wellness' },
                    { title: 'Mindful Moment', desc: 'Practice deep breathing', xp: 25, progress: 0, category: 'Mental' },
                  ].map((mission, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-white/50 hover:bg-white hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-xs text-[#013DC4] font-bold uppercase tracking-wider">{mission.category}</span>
                          <h4 className="font-bold text-gray-900 text-lg">{mission.title}</h4>
                          <p className="text-sm text-gray-500">{mission.desc}</p>
                        </div>
                        <span className="px-3 py-1 bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 text-[#013DC4] text-xs font-bold rounded-full">
                          +{mission.xp} XP
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] rounded-full transition-all"
                          style={{ width: `${mission.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  
                  <button className="w-full py-3 border-2 border-[#013DC4] text-[#013DC4] rounded-2xl font-bold hover:bg-gradient-to-r hover:from-[#013DC4] hover:to-[#0150FF] hover:text-white hover:border-transparent transition-all">
                    View All Quests
                  </button>
                </div>
              </CollapsibleSection>
              
              <CollapsibleSection
                title="Leaderboard"
                icon={<Users className="w-5 h-5" />}
              >
                <div className="space-y-3">
                  {[
                    { rank: 1, name: 'Emma K.', xp: 3240 },
                    { rank: 2, name: 'Michael R.', xp: 2890 },
                    { rank: 3, name: 'Sarah (You)', xp: 2450, isYou: true },
                    { rank: 4, name: 'David L.', xp: 2310 },
                  ].map((user) => (
                    <div 
                      key={user.rank}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                        user.isYou ? 'bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 shadow-lg' : 'hover:bg-white/50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                        user.rank === 1 ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-lg' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {user.rank === 1 ? '🏆' : user.rank}
                      </div>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                        user.isYou ? 'bg-gradient-to-br from-[#013DC4] to-[#0150FF]' : 'bg-gradient-to-br from-[#CDB6EF] to-purple-400'
                      }`}>
                        {user.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <span className={`font-bold ${user.isYou ? 'text-[#013DC4]' : 'text-gray-900'}`}>
                          {user.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 rounded-full">
                        <Zap className="w-4 h-4 text-[#013DC4]" />
                        <span className="font-bold text-gray-700">{user.xp.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  
                  <button className="w-full text-sm text-[#013DC4] font-bold hover:underline flex items-center justify-center gap-1 pt-2">
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </CollapsibleSection>
            </div>
            
            <CollapsibleSection
              title="Medications"
              icon={<Pill className="w-5 h-5" />}
              badge={<span className="ml-2 px-3 py-1 bg-gradient-to-r from-[#013DC4] to-[#0150FF] text-white text-xs font-bold rounded-full shadow-lg">2</span>}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[
                  { name: 'Vitamin D', dosage: '1000 IU', times: ['8:00 AM'], adherence: 95 },
                  { name: 'Omega-3', dosage: '500mg', times: ['8:00 AM', '8:00 PM'], adherence: 88 },
                ].map((med, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-white/50 hover:bg-white hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{med.name}</h4>
                        <p className="text-sm text-gray-500">{med.dosage}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full font-bold text-sm ${
                        med.adherence >= 90 
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-600' 
                          : 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-600'
                      }`}>
                        {med.adherence}%
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {med.times.map((time, j) => (
                        <span key={j} className="px-3 py-1.5 bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 text-[#013DC4] text-sm font-semibold rounded-xl">
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-4 py-4 border-2 border-dashed border-gray-300 text-gray-500 rounded-2xl font-bold hover:border-[#013DC4] hover:text-[#013DC4] hover:bg-[#013DC4]/5 transition-all flex items-center justify-center gap-2">
                <Pill className="w-5 h-5" />
                Add Medication
              </button>
            </CollapsibleSection>
            
            <CollapsibleSection
              title="Health Science"
              icon={<BookOpen className="w-5 h-5" />}
              defaultOpen={false}
            >
              <div className="p-5 bg-gradient-to-br from-[#CDB6EF]/10 to-[#D2EDFF]/10 rounded-2xl">
                <p className="text-gray-600 font-medium">
                  Discover evidence-based health tips and educational content to support your wellness journey.
                </p>
              </div>
            </CollapsibleSection>
            
            <p className="text-sm text-gray-400 text-center pb-6 font-medium">
              Loretta provides general wellness information only. Always consult with healthcare professionals for medical advice.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
