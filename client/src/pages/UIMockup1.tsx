import { useState } from 'react';
import { Trophy, Flame, Heart, Star, TrendingUp, Activity, Pill, Users, ChevronRight, Zap, Target, Award } from 'lucide-react';

export default function UIMockup() {
  const [activeTab, setActiveTab] = useState('today');
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FAFF] to-white">
      <header className="bg-white border-b border-[#D2EDFF] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#013DC4] flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#013DC4]">loretta</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF8E6] rounded-full">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-sm text-orange-600">12 day streak</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D2EDFF] rounded-full">
              <Zap className="w-4 h-4 text-[#013DC4]" />
              <span className="font-semibold text-sm text-[#013DC4]">2,450 XP</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center shadow-lg shadow-[#013DC4]/20">
              <span className="text-2xl font-bold text-white">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Good morning, Sarah!</h1>
              <p className="text-gray-500 text-sm">Level 8 Health Explorer</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#D2EDFF] p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-[#013DC4]" />
              <span className="font-semibold text-gray-900">Level 8 Progress</span>
            </div>
            <span className="text-sm text-gray-500">2,450 / 3,000 XP</span>
          </div>
          <div className="h-3 bg-[#D2EDFF] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#013DC4] to-[#0150FF] rounded-full transition-all duration-500"
              style={{ width: '82%' }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">550 XP until Level 9</p>
        </div>

        <div className="flex gap-2 mb-6 bg-[#F0F4FF] p-1 rounded-xl">
          {['today', 'weekly', 'insights'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-white text-[#013DC4] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-[#D2EDFF] p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#D2EDFF] flex items-center justify-center">
                <Activity className="w-6 h-6 text-[#013DC4]" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+15 XP</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Daily Check-in</h3>
            <p className="text-sm text-gray-500 mb-4">How are you feeling today?</p>
            <button className="w-full py-2.5 bg-[#013DC4] text-white rounded-xl font-medium hover:bg-[#0130A0] transition-colors">
              Start Check-in
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#D2EDFF] p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#CDB6EF]/30 flex items-center justify-center">
                <Pill className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">2 pending</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Medications</h3>
            <p className="text-sm text-gray-500 mb-4">Track your daily medications</p>
            <button className="w-full py-2.5 bg-white border-2 border-[#CDB6EF] text-purple-700 rounded-xl font-medium hover:bg-[#CDB6EF]/10 transition-colors">
              View Schedule
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#D2EDFF] p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#D2EDFF] flex items-center justify-center">
                <Target className="w-6 h-6 text-[#013DC4]" />
              </div>
              <span className="text-xs font-medium text-[#013DC4] bg-[#D2EDFF] px-2 py-1 rounded-full">3 active</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Active Missions</h3>
            <p className="text-sm text-gray-500 mb-4">Complete missions to earn XP</p>
            <button className="w-full py-2.5 bg-white border-2 border-[#013DC4] text-[#013DC4] rounded-xl font-medium hover:bg-[#D2EDFF] transition-colors">
              View Missions
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#D2EDFF] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#013DC4]" />
                Risk Score
              </h3>
              <button className="text-sm text-[#013DC4] font-medium hover:underline flex items-center gap-1">
                Details <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#D2EDFF"
                    strokeWidth="12"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(100 - 23) * 2.64} 264`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">23</span>
                  <span className="text-xs text-gray-500">Low Risk</span>
                </div>
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Lifestyle</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-[#D2EDFF] rounded-full overflow-hidden">
                      <div className="h-full w-[85%] bg-green-500 rounded-full" />
                    </div>
                    <span className="text-green-600 font-medium">Good</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Activity</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-[#D2EDFF] rounded-full overflow-hidden">
                      <div className="h-full w-[70%] bg-green-500 rounded-full" />
                    </div>
                    <span className="text-green-600 font-medium">Good</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Nutrition</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-[#D2EDFF] rounded-full overflow-hidden">
                      <div className="h-full w-[55%] bg-yellow-500 rounded-full" />
                    </div>
                    <span className="text-yellow-600 font-medium">Fair</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#D2EDFF] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#013DC4]" />
                Leaderboard
              </h3>
              <button className="text-sm text-[#013DC4] font-medium hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              {[
                { rank: 1, name: 'Emma K.', xp: 3240, avatar: 'E', isTop: true },
                { rank: 2, name: 'Michael R.', xp: 2890, avatar: 'M' },
                { rank: 3, name: 'Sarah (You)', xp: 2450, avatar: 'S', isYou: true },
                { rank: 4, name: 'David L.', xp: 2310, avatar: 'D' },
              ].map((user) => (
                <div 
                  key={user.rank}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    user.isYou ? 'bg-[#D2EDFF]/50 border border-[#013DC4]/20' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-6 text-center font-bold ${
                    user.rank === 1 ? 'text-yellow-500' : 
                    user.rank === 2 ? 'text-gray-400' : 
                    user.rank === 3 ? 'text-amber-600' : 'text-gray-500'
                  }`}>
                    {user.rank === 1 ? <Trophy className="w-5 h-5 inline" /> : `#${user.rank}`}
                  </span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                    user.isYou ? 'bg-gradient-to-br from-[#013DC4] to-[#0150FF]' : 'bg-[#CDB6EF]'
                  }`}>
                    {user.avatar}
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
            </div>
          </div>
        </div>

        <div className="mt-6 bg-gradient-to-r from-[#013DC4] to-[#0150FF] rounded-2xl p-6 text-white shadow-lg shadow-[#013DC4]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Weekly Challenge</h3>
                <p className="text-white/80 text-sm">Complete 5 check-ins this week</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">3/5</div>
              <div className="text-white/70 text-sm">+100 XP bonus</div>
            </div>
          </div>
          <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full w-[60%] bg-white rounded-full" />
          </div>
        </div>

        <div className="mt-8 p-6 bg-[#CDB6EF]/20 rounded-2xl border border-[#CDB6EF]">
          <h3 className="font-bold text-gray-900 mb-4">Design System Preview</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Primary Buttons</p>
              <div className="flex flex-wrap gap-3">
                <button className="px-6 py-2.5 bg-[#013DC4] text-white rounded-xl font-medium hover:bg-[#0130A0] transition-colors">
                  Primary Action
                </button>
                <button className="px-6 py-2.5 bg-white border-2 border-[#013DC4] text-[#013DC4] rounded-xl font-medium hover:bg-[#D2EDFF] transition-colors">
                  Secondary
                </button>
                <button className="px-6 py-2.5 bg-[#D2EDFF] text-[#013DC4] rounded-xl font-medium hover:bg-[#C0E2FF] transition-colors">
                  Tertiary
                </button>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">Accent Buttons</p>
              <div className="flex flex-wrap gap-3">
                <button className="px-6 py-2.5 bg-[#CDB6EF] text-purple-900 rounded-xl font-medium hover:bg-[#BFA5E3] transition-colors">
                  Purple Accent
                </button>
                <button className="px-6 py-2.5 bg-white border-2 border-[#CDB6EF] text-purple-700 rounded-xl font-medium hover:bg-[#CDB6EF]/20 transition-colors">
                  Purple Outline
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Color Palette</p>
              <div className="flex gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-16 h-16 rounded-xl bg-[#013DC4] shadow-md"></div>
                  <span className="text-xs text-gray-600">#013DC4</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-16 h-16 rounded-xl bg-[#CDB6EF] shadow-md"></div>
                  <span className="text-xs text-gray-600">#CDB6EF</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-16 h-16 rounded-xl bg-[#D2EDFF] shadow-md"></div>
                  <span className="text-xs text-gray-600">#D2EDFF</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-16 h-16 rounded-xl bg-[#F8FAFF] border border-gray-200 shadow-md"></div>
                  <span className="text-xs text-gray-600">#F8FAFF</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
