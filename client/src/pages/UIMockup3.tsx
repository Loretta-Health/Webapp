import { useState } from 'react';
import { 
  Heart, Flame, Star, TrendingUp, Users, ChevronRight, Zap, Target, 
  Menu, X, User, MessageCircle, LogOut, Shield, Accessibility, Sun, Moon,
  MapPin, CloudRain, Smile, Pill, BookOpen, Check, Sparkles, ChevronDown
} from 'lucide-react';
import logomarkViolet from '@assets/Logomark_violet@2x_1766161339181.png';
import logoHorizontalBlue from '@assets/Logo_horizontal_blue@2x_(1)_1766161586795.png';

function Card({ 
  children, 
  className = '',
  hover = false
}: { 
  children: React.ReactNode; 
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={`
      bg-white border border-gray-100 rounded-2xl shadow-sm
      ${hover ? 'hover:shadow-md hover:border-[#013DC4]/20 transition-all cursor-pointer' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

function CollapsibleSection({ 
  title, 
  icon, 
  iconBg = 'bg-[#013DC4]',
  badge, 
  children, 
  defaultOpen = true
}: { 
  title: string; 
  icon: React.ReactNode;
  iconBg?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Card>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center text-white`}>
            {icon}
          </div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {badge}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all ${isOpen ? 'max-h-[2000px]' : 'max-h-0'}`}>
        <div className="px-5 pb-5 pt-0">{children}</div>
      </div>
    </Card>
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
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-72 lg:w-80
        bg-white border-r border-gray-100
        flex flex-col overflow-y-auto
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-5 lg:p-6 space-y-5">
          <div className="flex items-center justify-between lg:hidden">
            <img src={logoHorizontalBlue} alt="Loretta" className="h-8 object-contain" />
            <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="hidden lg:block">
            <img src={logoHorizontalBlue} alt="Loretta" className="h-10 object-contain" />
          </div>
          
          <div className="pt-2">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#CDB6EF] rounded-lg flex items-center justify-center border-2 border-white">
                  <img src={logomarkViolet} alt="" className="w-3.5 h-3.5 brightness-0 invert" />
                </div>
              </div>
              <div>
                <h2 className="font-bold text-gray-900">sarah_health</h2>
                <p className="text-sm text-gray-500">Level {level} Explorer</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 font-medium">Progress to Level {level + 1}</span>
                <span className="text-[#013DC4] font-semibold">{Math.round(xpProgress)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#013DC4] rounded-full"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{xp.toLocaleString()} / {nextLevelXP.toLocaleString()} XP</p>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Today</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                  <Flame className="w-4 h-4" />
                  <span className="font-bold">{streak}</span>
                </div>
                <span className="text-xs text-gray-500">Streak</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-[#013DC4] font-bold mb-1">+{xp}</div>
                <span className="text-xs text-gray-500">XP</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-[#CDB6EF] font-bold mb-1">2/5</div>
                <span className="text-xs text-gray-500">Quests</span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Community</h4>
            <div className="space-y-1">
              {[
                { id: 'loretta', label: 'Loretta Community', icon: Users },
                { id: 'friends', label: 'My Friends', icon: Heart },
                { id: 'team', label: 'My Team', icon: Target },
              ].map((option) => (
                <button 
                  key={option.id}
                  onClick={() => setCommunityType(option.id as any)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    communityType === option.id 
                      ? 'bg-[#013DC4]/5 text-[#013DC4]' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <option.icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{option.label}</span>
                  {communityType === option.id && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#013DC4]" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Navigation</h4>
            <div className="space-y-1">
              {[
                { label: 'My Profile', icon: User, active: true },
                { label: 'Health Navigator', icon: MessageCircle },
                { label: 'Leaderboard', icon: Users },
              ].map((item) => (
                <button 
                  key={item.label}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    item.active 
                      ? 'bg-[#013DC4] text-white' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              ))}
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-500 text-left">
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">Sign Out</span>
              </button>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-4 flex gap-4">
            <button className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Privacy
            </button>
            <button className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <Accessibility className="w-3.5 h-3.5" /> Accessibility
            </button>
          </div>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <button 
            className="lg:hidden p-2 hover:bg-gray-100 rounded-xl"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#013DC4]/5 rounded-lg">
              <Star className="w-4 h-4 text-[#013DC4]" />
              <span className="text-sm font-semibold text-[#013DC4]">Level {level}</span>
            </div>
            
            <div className="h-6 w-px bg-gray-200" />
            
            <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-100 rounded-lg text-sm">
              <span className="font-medium text-gray-900">EN</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-400">DE</span>
            </div>
            
            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
              <MapPin className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <CloudRain className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 hidden sm:inline">Weather</span>
              <div className="w-8 h-4 bg-gray-300 rounded-full relative cursor-pointer">
                <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow" />
              </div>
            </div>
            
            <button 
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-5 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-5">
            <div className="bg-gradient-to-r from-[#013DC4] to-[#0150FF] rounded-2xl p-6 lg:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                    Welcome back, Sarah!
                  </h1>
                  <p className="text-white/70">Ready to continue your health journey?</p>
                </div>
                <div className="hidden sm:flex w-14 h-14 bg-white/10 rounded-2xl items-center justify-center">
                  <img src={logomarkViolet} alt="" className="w-8 h-8 object-contain brightness-0 invert" />
                </div>
              </div>
            </div>
            
            <Card hover className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#CDB6EF] flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Speak to Loretta</h3>
                    <p className="text-sm text-gray-500">Get personalized health guidance</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Card>
            
            <CollapsibleSection
              title="Complete Your Setup"
              icon={<Sparkles className="w-4 h-4" />}
              badge={<span className="ml-2 px-2 py-0.5 bg-[#013DC4]/10 text-[#013DC4] text-xs font-semibold rounded-md">3/4</span>}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">75% complete</span>
                  <span className="text-[#013DC4] font-medium">Unlock leaderboard</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-[#013DC4] rounded-full" />
                </div>
                
                <div className="space-y-2 mt-4">
                  {[
                    { label: 'Data Consent', complete: true, xp: 10 },
                    { label: 'Complete Profile', complete: true, xp: 25 },
                    { label: 'Health Questionnaire', complete: true, xp: 50 },
                    { label: 'First Emotional Check-In', complete: false, xp: 15 },
                  ].map((step, i) => (
                    <div 
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${
                        step.complete 
                          ? 'bg-green-50/50 border-green-100' 
                          : 'bg-white border-gray-100 hover:border-[#013DC4]/30 cursor-pointer'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        step.complete ? 'bg-green-500' : 'bg-[#CDB6EF]/20'
                      }`}>
                        {step.complete ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : (
                          <Heart className="w-4 h-4 text-[#CDB6EF]" />
                        )}
                      </div>
                      <span className={`flex-1 font-medium text-sm ${step.complete ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {step.label}
                      </span>
                      {step.complete ? (
                        <span className="text-xs text-green-600 font-medium">Done</span>
                      ) : (
                        <span className="text-xs text-[#CDB6EF] font-medium">+{step.xp} XP</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleSection>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <CollapsibleSection
                title="Risk Score"
                icon={<Heart className="w-4 h-4" />}
                iconBg="bg-rose-500"
              >
                <div className="flex items-center gap-6">
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#F1F5F9" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke="#22C55E"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${(100 - 23) * 2.51} 251`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-gray-900">23</span>
                      <span className="text-xs text-green-600 font-medium">Low Risk</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <p className="text-sm text-gray-600">Your health indicators are looking great!</p>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-md bg-green-100 flex items-center justify-center">
                        <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <span className="text-green-600 font-medium">Stable</span>
                    </div>
                    <button className="text-sm text-[#013DC4] font-medium hover:underline flex items-center gap-1">
                      View Details <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CollapsibleSection>
              
              <CollapsibleSection
                title="Daily Check-In"
                icon={<Smile className="w-4 h-4" />}
                iconBg="bg-[#CDB6EF]"
                badge={<span className="ml-2 px-2 py-0.5 bg-[#CDB6EF]/20 text-purple-700 text-xs font-semibold rounded-md">3</span>}
              >
                <div className="space-y-4">
                  <button className="w-full py-3 bg-[#013DC4] text-white rounded-xl font-medium hover:bg-[#012DA4] transition-colors">
                    Start Check-in (+15 XP)
                  </button>
                  
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Recent</p>
                    <div className="space-y-2">
                      {[
                        { emoji: '😊', emotion: 'Happy', time: 'Today at 9:15am' },
                        { emoji: '😌', emotion: 'Calm', time: 'Yesterday' },
                        { emoji: '⚡', emotion: 'Energetic', time: 'Dec 17' },
                      ].map((checkin, i) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                          <span className="text-xl">{checkin.emoji}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{checkin.emotion}</p>
                            <p className="text-xs text-gray-500">{checkin.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsibleSection>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <CollapsibleSection
                title="Active Missions"
                icon={<Flame className="w-4 h-4" />}
                iconBg="bg-orange-500"
                badge={<span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-semibold rounded-md">3</span>}
              >
                <div className="space-y-3">
                  {[
                    { title: 'Morning Stretch', desc: '5 min stretching', xp: 20, progress: 80, category: 'Activity' },
                    { title: 'Hydration Hero', desc: '8 glasses of water', xp: 15, progress: 50, category: 'Wellness' },
                    { title: 'Mindful Moment', desc: 'Deep breathing', xp: 25, progress: 0, category: 'Mental' },
                  ].map((mission, i) => (
                    <div key={i} className="p-3 rounded-xl border border-gray-100 hover:border-[#013DC4]/20 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-xs text-[#013DC4] font-medium">{mission.category}</span>
                          <h4 className="font-medium text-gray-900">{mission.title}</h4>
                          <p className="text-xs text-gray-500">{mission.desc}</p>
                        </div>
                        <span className="text-xs text-[#013DC4] font-medium bg-[#013DC4]/5 px-2 py-0.5 rounded">
                          +{mission.xp} XP
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#013DC4] rounded-full"
                          style={{ width: `${mission.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  
                  <button className="w-full py-2.5 border border-[#013DC4] text-[#013DC4] rounded-xl font-medium hover:bg-[#013DC4]/5 transition-colors">
                    View All Quests
                  </button>
                </div>
              </CollapsibleSection>
              
              <CollapsibleSection
                title="Leaderboard"
                icon={<Users className="w-4 h-4" />}
                iconBg="bg-amber-500"
              >
                <div className="space-y-2">
                  {[
                    { rank: 1, name: 'Emma K.', xp: 3240 },
                    { rank: 2, name: 'Michael R.', xp: 2890 },
                    { rank: 3, name: 'Sarah (You)', xp: 2450, isYou: true },
                    { rank: 4, name: 'David L.', xp: 2310 },
                  ].map((user) => (
                    <div 
                      key={user.rank}
                      className={`flex items-center gap-3 p-3 rounded-xl ${
                        user.isYou ? 'bg-[#013DC4]/5 border border-[#013DC4]/20' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                        user.rank === 1 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {user.rank === 1 ? '🏆' : user.rank}
                      </div>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-medium ${
                        user.isYou ? 'bg-[#013DC4]' : 'bg-[#CDB6EF]'
                      }`}>
                        {user.name.charAt(0)}
                      </div>
                      <span className={`flex-1 font-medium text-sm ${user.isYou ? 'text-[#013DC4]' : 'text-gray-900'}`}>
                        {user.name}
                      </span>
                      <div className="flex items-center gap-1 text-sm">
                        <Zap className="w-3.5 h-3.5 text-[#013DC4]" />
                        <span className="font-semibold text-gray-700">{user.xp.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  
                  <button className="w-full text-sm text-[#013DC4] font-medium hover:underline flex items-center justify-center gap-1 pt-2">
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </CollapsibleSection>
            </div>
            
            <CollapsibleSection
              title="Medications"
              icon={<Pill className="w-4 h-4" />}
              badge={<span className="ml-2 px-2 py-0.5 bg-[#013DC4]/10 text-[#013DC4] text-xs font-semibold rounded-md">2</span>}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {[
                  { name: 'Vitamin D', dosage: '1000 IU', times: ['8:00 AM'], adherence: 95 },
                  { name: 'Omega-3', dosage: '500mg', times: ['8:00 AM', '8:00 PM'], adherence: 88 },
                ].map((med, i) => (
                  <div key={i} className="p-4 rounded-xl border border-gray-100 hover:border-[#013DC4]/20 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{med.name}</h4>
                        <p className="text-sm text-gray-500">{med.dosage}</p>
                      </div>
                      <span className={`text-sm font-semibold ${med.adherence >= 90 ? 'text-green-600' : 'text-amber-600'}`}>
                        {med.adherence}%
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {med.times.map((time, j) => (
                        <span key={j} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-3 py-3 border border-dashed border-gray-300 text-gray-500 rounded-xl font-medium hover:border-[#013DC4] hover:text-[#013DC4] transition-colors flex items-center justify-center gap-2">
                <Pill className="w-4 h-4" />
                Add Medication
              </button>
            </CollapsibleSection>
            
            <CollapsibleSection
              title="Health Science"
              icon={<BookOpen className="w-4 h-4" />}
              iconBg="bg-teal-500"
              defaultOpen={false}
            >
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">
                  Discover evidence-based health tips and educational content to support your wellness journey.
                </p>
              </div>
            </CollapsibleSection>
            
            <p className="text-xs text-gray-400 text-center py-4">
              Loretta provides general wellness information only. Always consult with healthcare professionals for medical advice.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
