import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { 
  Shield, 
  Trash2, 
  Eye, 
  EyeOff, 
  Search, 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  User,
  Clock,
  Activity,
  Users,
  FileText,
  BarChart3,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { apiFetch } from '../lib/api';

export const AdminPanel = ({ onBack, onSelectBlog }: { onBack: () => void, onSelectBlog: (id: number) => void }) => {
  const { user, theme } = useStore();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchDashboardData = async () => {
    setStatsLoading(true);
    try {
      const res = await apiFetch(`/api/admin/dashboard-stats?userId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAllBlogs = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/admin/blogs?userId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setBlogs(data);
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Failed to fetch blogs' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAllBlogs();
      fetchDashboardData();
    }
  }, [user]);

  const handleUpdateBlog = async (id: number, updates: any) => {
    setActionLoading(id);
    try {
      const res = await apiFetch(`/api/admin/blogs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ userId: user?.id, ...updates })
      });
      if (res.ok) {
        setBlogs(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
        setMessage({ type: 'success', text: 'Blog updated successfully' });
        fetchDashboardData(); // Refresh history
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Update failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setActionLoading(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDeleteBlog = async (id: number) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;
    setActionLoading(id);
    try {
      const res = await apiFetch(`/api/admin/blogs/${id}?userId=${user?.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setBlogs(prev => prev.filter(b => b.id !== id));
        setMessage({ type: 'success', text: 'Blog deleted successfully' });
        fetchDashboardData(); // Refresh history
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Delete failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setActionLoading(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const filteredBlogs = blogs.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase()) || 
    b.author_name.toLowerCase().includes(search.toLowerCase())
  );

  const cardClasses = theme === 'orange' 
    ? 'bg-zinc-900/50 border-orange-500/20' 
    : 'bg-white border-slate-200 shadow-sm';

  const inputClasses = theme === 'orange'
    ? 'bg-black border-orange-500/20 focus:border-orange-500 text-orange-100'
    : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900';

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <Shield className="w-16 h-16 text-rose-500 mb-4 opacity-20" />
        <h2 className="text-2xl font-black uppercase italic tracking-tight mb-2">Access Denied</h2>
        <p className="opacity-60 max-w-md">You do not have administrative privileges to access this panel.</p>
        <button onClick={onBack} className="mt-8 text-indigo-600 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className={`p-3 rounded-2xl transition-all border ${theme === 'orange' ? 'border-orange-500/20 hover:bg-orange-500/10 text-orange-500' : 'border-slate-200 hover:bg-slate-100 text-slate-600'}`}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tight flex items-center gap-3">
              <Shield className="text-indigo-600" /> Admin Panel
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest opacity-40 mt-1">Manage all user posts</p>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
          <input 
            type="text"
            placeholder="Search posts or authors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-12 pr-4 py-3 rounded-2xl outline-none border transition-all font-medium ${inputClasses}`}
          />
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard 
          icon={FileText} 
          label="Total Blogs" 
          value={stats?.totalBlogs || 0} 
          loading={statsLoading} 
          theme={theme} 
          color="text-indigo-600" 
          bgColor="bg-indigo-500/10"
        />
        <StatCard 
          icon={Users} 
          label="Total Users" 
          value={stats?.totalUsers || 0} 
          loading={statsLoading} 
          theme={theme} 
          color="text-emerald-500" 
          bgColor="bg-emerald-500/10"
        />
        <StatCard 
          icon={BarChart3} 
          label="Total Views" 
          value={stats?.totalViews || 0} 
          loading={statsLoading} 
          theme={theme} 
          color="text-orange-500" 
          bgColor="bg-orange-500/10"
        />
        <StatCard 
          icon={Activity} 
          label="Admin Actions" 
          value={stats?.recentActions?.length || 0} 
          loading={statsLoading} 
          theme={theme} 
          color="text-rose-500" 
          bgColor="bg-rose-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Recent Admin Actions */}
        <div className="lg:col-span-4">
          <div className={`p-8 rounded-[2.5rem] border shadow-sm h-full ${cardClasses}`}>
            <h2 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-widest italic text-indigo-600">
              <History className="w-5 h-5" /> Recent Actions
            </h2>
            
            {statsLoading ? (
              <div className="space-y-4 opacity-40">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {stats?.recentActions?.length === 0 ? (
                  <p className="text-xs font-bold opacity-40 text-center py-10">No recent actions recorded.</p>
                ) : (
                  stats?.recentActions?.map((log: any) => (
                    <div key={log.id} className="relative pl-6 border-l-2 border-indigo-500/20">
                      <div className="absolute left-[-9px] top-0 w-4 h-4 bg-indigo-500 rounded-full border-4 border-white" />
                      <p className="text-xs font-black uppercase tracking-tight mb-1">{log.details}</p>
                      <div className="flex items-center gap-2 text-[10px] font-bold opacity-40 uppercase tracking-widest">
                        <span>{log.admin_name}</span>
                        <span>â€¢</span>
                        <span>{formatDistanceToNow(new Date(log.created_at))} ago</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Blog Management Table */}
        <div className="lg:col-span-8">
          <div className={`p-8 rounded-[2.5rem] border shadow-sm ${cardClasses}`}>
            <h2 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-widest italic text-indigo-600">
              <FileText className="w-5 h-5" /> Blog Management
            </h2>

            <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-8 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${
              message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-40">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <p className="font-black uppercase tracking-widest text-xs">Loading posts...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredBlogs.length === 0 ? (
            <div className="text-center py-20 opacity-40">
              <p className="font-bold">No posts found matching your search.</p>
            </div>
          ) : (
            filteredBlogs.map((blog) => (
              <motion.div
                layout
                key={blog.id}
                className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${cardClasses}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${blog.visibility === 'private' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {blog.visibility}
                    </span>
                    <span className="text-[10px] font-bold opacity-40 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(blog.created_at))} ago
                    </span>
                  </div>
                  <h3 className="text-lg font-black truncate mb-1">{blog.title}</h3>
                  <div className="flex items-center gap-2 text-xs font-bold opacity-60">
                    <User className="w-3 h-3" /> @{blog.author_name}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onSelectBlog(blog.id)}
                    className={`p-3 rounded-2xl transition-all border flex items-center gap-2 text-xs font-black uppercase tracking-widest ${theme === 'orange' ? 'border-orange-500/20 text-orange-500 hover:bg-orange-500/5' : 'border-slate-200 hover:bg-slate-100 text-slate-600'}`}
                  >
                    <Eye className="w-4 h-4" /> View
                  </button>
                  <button
                    onClick={() => handleUpdateBlog(blog.id, { visibility: blog.visibility === 'public' ? 'private' : 'public' })}
                    disabled={actionLoading === blog.id}
                    className={`p-3 rounded-2xl transition-all border flex items-center gap-2 text-xs font-black uppercase tracking-widest ${
                      blog.visibility === 'public' 
                        ? 'border-slate-200 hover:bg-slate-100 text-slate-600' 
                        : 'border-indigo-500/20 bg-indigo-500/5 text-indigo-600 hover:bg-indigo-500/10'
                    }`}
                  >
                    {actionLoading === blog.id ? <Loader2 className="w-4 h-4 animate-spin" /> : blog.visibility === 'public' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {blog.visibility === 'public' ? 'Make Private' : 'Make Public'}
                  </button>

                  <button
                    onClick={() => handleDeleteBlog(blog.id)}
                    disabled={actionLoading === blog.id}
                    className="p-3 rounded-2xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/5 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                  >
                    {actionLoading === blog.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
            </div>
          </div>
        </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, loading, theme, color, bgColor }: any) => {
  const cardClasses = theme === 'orange' 
    ? 'bg-zinc-900/50 border-orange-500/20' 
    : 'bg-white border-slate-200 shadow-sm';

  return (
    <div className={`p-6 rounded-[2rem] border ${cardClasses}`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${bgColor} ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          {loading ? (
            <div className="h-6 w-16 bg-slate-100 animate-pulse rounded-md mb-1" />
          ) : (
            <p className={`text-2xl font-black ${theme === 'orange' ? 'text-white' : 'text-slate-900'}`}>{value}</p>
          )}
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{label}</p>
        </div>
      </div>
    </div>
  );
};
