import { useState } from 'react';
import { 
  Heart, Flame, Star, TrendingUp, Users, ChevronRight, Zap, Target, Award, 
  Menu, X, User, MessageCircle, LogOut, Shield, Accessibility, Sun, Moon,
  MapPin, CloudRain, Smile, Pill, BookOpen, Check, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';
import logomarkViolet from '@assets/Logomark_violet@2x_1766161339181.png';

function CollapsibleSection({ 
  title, 
  icon, 
  badge, 
  children, 
  defaultOpen = true 
}: { 
  title: string; 
  icon: React.ReactNode; 
  badge?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="bg-white rounded-2xl border border-[#D2EDFF] shadow-sm overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {badge}
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export default function UIMockup1() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [communityType, setCommunityType] = useState<'loretta' | 'friends' | 'team'>('loretta');
  
  const xp = 2450;
  const level = 8;
  const streak = 12;
  const nextLevelXP = 3000;
  const xpProgress = (xp / nextLevelXP) * 100;
  
  return (
    <div className="flex h-screen bg-gradient-to-b from-[#F8FAFF] to-white overflow-hidden">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-72 lg:w-80 
        bg-white border-r border-[#D2EDFF]
        flex flex-col overflow-y-auto
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 lg:p-6 space-y-4 lg:space-y-5">
          <div className="flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#013DC4] flex items-center justify-center p-1.5">
                <img src={logomarkViolet} alt="Loretta" className="w-full h-full object-contain brightness-0 invert" />
              </div>
              <span className="text-lg font-bold text-[#013DC4]">loretta</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="hidden lg:flex justify-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#013DC4] flex items-center justify-center p-2">
                <img src={logomarkViolet} alt="Loretta" className="w-full h-full object-contain brightness-0 invert" />
              </div>
              <span className="text-xl font-bold text-[#013DC4]">loretta</span>
            </div>
          </div>
          
          <div className="text-center py-2">
            <div className="relative inline-block mb-3">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center border-4 border-[#D2EDFF] shadow-lg">
                <User className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#CDB6EF] rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-xs">💜</span>
              </div>
            </div>
            <h2 className="text-lg lg:text-xl font-bold text-gray-900">sarah_health</h2>
            <p className="text-xs lg:text-sm text-gray-500">Level {level} Health Explorer</p>
          </div>
          
          <div className="h-px bg-[#D2EDFF]" />
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[#013DC4]" />
                <span className="font-medium text-gray-700">Level {level}</span>
              </div>
              <span className="text-gray-500">{xp.toLocaleString()} / {nextLevelXP.toLocaleString()} XP</span>
            </div>
            <div className="h-2.5 bg-[#D2EDFF] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#013DC4] to-[#0150FF] rounded-full transition-all"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
          
          <div className="h-px bg-[#D2EDFF]" />
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-500 uppercase">Today's Progress</h3>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 rounded-full">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-xs font-semibold text-orange-600">{streak}</span>
              </div>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">XP Earned</span>
                <span className="font-semibold text-gray-900">+{xp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Quests</span>
                <span className="font-semibold text-gray-900">2/5 done</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Achievements</span>
                <span className="font-semibold text-gray-900">3 total</span>
              </div>
            </div>
          </div>
          
          <div className="h-px bg-[#D2EDFF]" />
          
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase">My Community</h3>
            <div className="space-y-1.5">
              {[
                { id: 'loretta', label: 'Loretta Community', icon: Users },
                { id: 'friends', label: 'My Friends', icon: Heart },
                { id: 'team', label: 'My Team', icon: Target },
              ].map((option) => (
                <label 
                  key={option.id}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                    communityType === option.id ? 'bg-[#D2EDFF]' : 'hover:bg-gray-50'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="community" 
                    checked={communityType === option.id}
                    onChange={() => setCommunityType(option.id as any)}
                    className="w-4 h-4 text-[#013DC4]"
                  />
                  <option.icon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="h-px bg-[#D2EDFF]" />
          
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase">Navigation</h3>
            <div className="space-y-1.5">
              <button className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[#D2EDFF]/50 hover:bg-[#D2EDFF] transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-gray-900">My Profile</span>
              </button>
              <button className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#CDB6EF]/20 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#CDB6EF] to-purple-400 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-gray-900">Health Navigator</span>
              </button>
              <button className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-yellow-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-gray-900">Leaderboard</span>
              </button>
              <button className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <LogOut className="w-4 h-4 text-gray-500" />
                </div>
                <span className="font-medium text-gray-500">Sign Out</span>
              </button>
            </div>
          </div>
          
          <div className="h-px bg-[#D2EDFF]" />
          
          <div className="space-y-1">
            <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
              <Shield className="w-3 h-3" />
              Privacy Policy
            </button>
            <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
              <Accessibility className="w-3 h-3" />
              Accessibility
            </button>
          </div>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-gradient-to-r from-[#013DC4] to-[#0150FF] text-white px-3 py-2.5 flex items-center justify-between shadow-lg">
          <button 
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-semibold">
              Level {level}
            </span>
            
            <div className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg">
              <span className="text-xs font-medium">EN</span>
              <span className="text-white/50">/</span>
              <span className="text-xs text-white/60">DE</span>
            </div>
            
            <button className="p-2 hover:bg-white/10 rounded-lg">
              <MapPin className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded-lg">
              <CloudRain className="w-4 h-4 text-white/60" />
              <span className="text-xs text-white/80 hidden sm:inline">Weather</span>
              <div className="w-8 h-4 bg-white/20 rounded-full relative">
                <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
              </div>
            </div>
            
            <button 
              className="p-2 hover:bg-white/10 rounded-lg"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-6xl mx-auto space-y-4 lg:space-y-6">
            <div className="bg-gradient-to-r from-[#013DC4]/10 via-[#CDB6EF]/20 to-[#D2EDFF]/30 rounded-2xl p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                    Welcome back, Sarah!
                  </h1>
                  <p className="text-gray-600">Ready to continue your health journey?</p>
                </div>
                <div className="hidden sm:flex w-16 h-16 bg-[#CDB6EF]/30 rounded-full items-center justify-center p-3">
                  <img src={logomarkViolet} alt="Loretta mascot" className="w-full h-full object-contain" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-[#CDB6EF]/30 to-[#D2EDFF]/30 rounded-2xl border border-[#CDB6EF]/50 p-4 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#CDB6EF] to-purple-400 flex items-center justify-center shadow-lg">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#013DC4] transition-colors">
                      Speak to Loretta
                    </h3>
                    <p className="text-sm text-gray-500">Get personalized health guidance and support</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-[#013DC4] transition-colors" />
              </div>
            </div>
            
            <CollapsibleSection
              title="Complete Your Setup"
              icon={<Sparkles className="w-5 h-5 text-[#013DC4]" />}
              badge={<span className="ml-2 px-2 py-0.5 bg-[#D2EDFF] text-[#013DC4] text-xs font-semibold rounded-full">3/4</span>}
            >
              <div className="space-y-3">
                <div className="h-2 bg-[#D2EDFF] rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-[#013DC4] to-[#0150FF] rounded-full" />
                </div>
                <p className="text-xs text-gray-500">Complete all steps to unlock the leaderboard!</p>
                
                <div className="space-y-2">
                  {[
                    { label: 'Data Consent', complete: true, xp: 10, color: 'green' },
                    { label: 'Complete Profile', complete: true, xp: 25, color: 'green' },
                    { label: 'Health Questionnaire', complete: true, xp: 50, color: 'green' },
                    { label: 'First Emotional Check-In', complete: false, xp: 15, color: 'pink' },
                  ].map((step, i) => (
                    <div 
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                        step.complete 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-white border-gray-200 hover:border-[#013DC4]/50 cursor-pointer'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.complete ? 'bg-green-500' : 'bg-pink-100'
                      }`}>
                        {step.complete ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : (
                          <Heart className="w-4 h-4 text-pink-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium text-sm ${step.complete ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {step.label}
                        </p>
                      </div>
                      {step.complete ? (
                        <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full">Done</span>
                      ) : (
                        <span className="px-2 py-0.5 border border-pink-300 text-pink-600 text-xs font-medium rounded-full">+{step.xp} XP</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleSection>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <CollapsibleSection
                title="Risk Score"
                icon={<Heart className="w-5 h-5 text-red-500" />}
              >
                <div className="flex items-center gap-6">
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#D2EDFF" strokeWidth="12" />
                      <circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke="#22C55E"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${(100 - 23) * 2.64} 264`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-gray-900">23</span>
                      <span className="text-xs text-green-600">Low Risk</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-gray-600">Your health indicators are looking great!</p>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-green-500" />
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
                icon={<Smile className="w-5 h-5 text-[#CDB6EF]" />}
                badge={<span className="ml-2 px-2 py-0.5 bg-[#CDB6EF]/30 text-purple-700 text-xs font-semibold rounded-full">3</span>}
              >
                <div className="space-y-3">
                  <button className="w-full py-3 bg-[#013DC4] text-white rounded-xl font-medium hover:bg-[#0130A0] transition-colors">
                    Start Check-in (+15 XP)
                  </button>
                  
                  <div className="bg-gradient-to-br from-[#CDB6EF]/20 to-[#D2EDFF]/20 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                      <Heart className="w-3 h-3" /> Recent Check-ins
                    </p>
                    <div className="space-y-2">
                      {[
                        { emoji: '😊', emotion: 'Happy', time: 'Today at 9:15am' },
                        { emoji: '😌', emotion: 'Calm', time: 'Yesterday at 8:30am' },
                        { emoji: '⚡', emotion: 'Energetic', time: 'Dec 17 at 10:00am' },
                      ].map((checkin, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/50 hover:bg-white transition-colors">
                          <span className="text-lg">{checkin.emoji}</span>
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
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <CollapsibleSection
                title="Active Missions"
                icon={<Flame className="w-5 h-5 text-orange-500" />}
                badge={<span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">3</span>}
              >
                <div className="space-y-3">
                  {[
                    { title: 'Morning Stretch', desc: 'Do 5 minutes of stretching', xp: 20, progress: 80, category: 'Activity' },
                    { title: 'Hydration Hero', desc: 'Drink 8 glasses of water', xp: 15, progress: 50, category: 'Wellness' },
                    { title: 'Mindful Moment', desc: 'Practice deep breathing', xp: 25, progress: 0, category: 'Mental' },
                  ].map((mission, i) => (
                    <div key={i} className="p-3 rounded-xl border border-gray-200 hover:border-[#013DC4]/30 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-xs text-[#013DC4] font-medium">{mission.category}</span>
                          <h4 className="font-semibold text-gray-900">{mission.title}</h4>
                          <p className="text-xs text-gray-500">{mission.desc}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-[#D2EDFF] text-[#013DC4] text-xs font-semibold rounded-full">
                          +{mission.xp} XP
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#013DC4] to-[#0150FF] rounded-full"
                          style={{ width: `${mission.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  
                  <button className="w-full py-2.5 border-2 border-[#013DC4] text-[#013DC4] rounded-xl font-medium hover:bg-[#D2EDFF] transition-colors">
                    View All Quests
                  </button>
                </div>
              </CollapsibleSection>
              
              <CollapsibleSection
                title="Leaderboard"
                icon={<Users className="w-5 h-5 text-yellow-500" />}
              >
                <div className="space-y-2">
                  {[
                    { rank: 1, name: 'Emma K.', xp: 3240, isTop: true },
                    { rank: 2, name: 'Michael R.', xp: 2890 },
                    { rank: 3, name: 'Sarah (You)', xp: 2450, isYou: true },
                    { rank: 4, name: 'David L.', xp: 2310 },
                  ].map((user) => (
                    <div 
                      key={user.rank}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        user.isYou ? 'bg-[#D2EDFF]/50 border border-[#013DC4]/20' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className={`w-6 text-center font-bold ${
                        user.rank === 1 ? 'text-yellow-500' : 'text-gray-400'
                      }`}>
                        {user.rank === 1 ? '🏆' : `#${user.rank}`}
                      </span>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                        user.isYou ? 'bg-gradient-to-br from-[#013DC4] to-[#0150FF]' : 'bg-[#CDB6EF]'
                      }`}>
                        {user.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <span className={`font-medium ${user.isYou ? 'text-[#013DC4]' : 'text-gray-900'}`}>
                          {user.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4 text-[#013DC4]" />
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
              icon={<Pill className="w-5 h-5 text-[#013DC4]" />}
              badge={<span className="ml-2 px-2 py-0.5 bg-[#D2EDFF] text-[#013DC4] text-xs font-semibold rounded-full">2</span>}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {[
                  { name: 'Vitamin D', dosage: '1000 IU', times: ['8:00 AM'], adherence: 95 },
                  { name: 'Omega-3', dosage: '500mg', times: ['8:00 AM', '8:00 PM'], adherence: 88 },
                ].map((med, i) => (
                  <div key={i} className="p-4 rounded-xl border border-gray-200 hover:border-[#013DC4]/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{med.name}</h4>
                        <p className="text-sm text-gray-500">{med.dosage}</p>
                      </div>
                      <span className={`text-sm font-medium ${med.adherence >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {med.adherence}%
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {med.times.map((time, j) => (
                        <span key={j} className="px-2 py-0.5 bg-[#D2EDFF] text-[#013DC4] text-xs rounded-full">
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-3 py-2.5 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl font-medium hover:border-[#013DC4] hover:text-[#013DC4] transition-colors flex items-center justify-center gap-2">
                <Pill className="w-4 h-4" />
                Add Medication
              </button>
            </CollapsibleSection>
            
            <CollapsibleSection
              title="Health Science"
              icon={<BookOpen className="w-5 h-5 text-[#CDB6EF]" />}
              defaultOpen={false}
            >
              <div className="p-4 bg-gradient-to-br from-[#CDB6EF]/10 to-[#D2EDFF]/10 rounded-xl">
                <p className="text-sm text-gray-600">
                  Discover evidence-based health tips and educational content to support your wellness journey.
                </p>
              </div>
            </CollapsibleSection>
            
            <p className="text-xs text-gray-400 text-center pb-4 italic">
              Loretta provides general wellness information only. Always consult with healthcare professionals for medical advice.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
