import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  LogOut, 
  MessageSquare, 
  User, 
  Mail, 
  Calendar, 
  Tag,
  CheckCircle,
  Eye,
  Trash2,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { getApiUrl } from '@/lib/queryClient';

interface Feedback {
  id: string;
  userId: string;
  username: string | null;
  email: string | null;
  category: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
}

export default function AdminFeedback() {
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('adminToken');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchFeedback();
    }
  }, [token]);

  const handleLogin = async () => {
    setLoginLoading(true);
    setError('');
    try {
      const response = await fetch(getApiUrl('/api/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        sessionStorage.setItem('adminToken', data.token);
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    sessionStorage.removeItem('adminToken');
    setFeedback([]);
  };

  const fetchFeedback = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/admin/feedback'), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setFeedback(data);
      } else if (response.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    if (!token) return;
    try {
      const response = await fetch(getApiUrl(`/api/admin/feedback/${id}`), {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        fetchFeedback();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!token || !confirm('Are you sure you want to delete this feedback?')) return;
    try {
      const response = await fetch(getApiUrl(`/api/admin/feedback/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        fetchFeedback();
      }
    } catch (err) {
      console.error('Failed to delete feedback:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'reviewed': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'bug': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'feature': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'general': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      case 'other': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4 safe-area-top safe-area-bottom">
        <Card className="w-full max-w-md p-8 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-3xl shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Admin Access</h1>
            <p className="text-gray-500 mt-2">Enter password to view feedback</p>
          </div>
          
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="h-12 rounded-xl"
            />
            
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
            
            <Button 
              onClick={handleLogin} 
              disabled={loginLoading || !password}
              className="w-full h-12 bg-gradient-to-r from-[#013DC4] to-[#0150FF] text-white font-bold rounded-xl"
            >
              {loginLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Login'
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4 md:p-8 safe-area-top safe-area-bottom">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-[#013DC4]" />
              User Feedback
            </h1>
            <p className="text-gray-500 mt-1">{feedback.length} submissions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={fetchFeedback}
              disabled={loading}
              className="rounded-xl min-h-[44px]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="rounded-xl min-h-[44px]"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {loading && feedback.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#013DC4]" />
          </div>
        ) : feedback.length === 0 ? (
          <Card className="p-12 text-center backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-3xl">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">No Feedback Yet</h2>
            <p className="text-gray-500 mt-2">User feedback will appear here</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <Card 
                key={item.id} 
                className="p-6 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-2xl"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge className={`${getStatusColor(item.status)} text-white`}>
                        {item.status}
                      </Badge>
                      <Badge className={getCategoryColor(item.category)}>
                        <Tag className="w-3 h-3 mr-1" />
                        {item.category}
                      </Badge>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {item.subject}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap mb-4">
                      {item.message}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {item.username || 'Unknown'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {item.email || 'No email'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(item.createdAt), 'PPp')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex md:flex-col gap-2">
                    {item.status === 'new' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatus(item.id, 'reviewed')}
                        className="rounded-xl min-h-[44px]"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Mark Reviewed
                      </Button>
                    )}
                    {item.status === 'reviewed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatus(item.id, 'resolved')}
                        className="rounded-xl min-h-[44px] text-green-600 border-green-300 hover:bg-green-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Resolved
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteFeedback(item.id)}
                      className="rounded-xl min-h-[44px] text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
