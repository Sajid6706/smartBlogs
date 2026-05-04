import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { 
  Plus, 
  TrendingUp, 
  Users, 
  Tag, 
  ArrowRight, 
  Eye, 
  Heart,
  Zap,
  BookOpen,
  Lock,
  Search,
  ChevronRight,
  Filter
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatToIST, apiFetch } from '../lib/api';

export const Dashboard = ({ 
  view, 
  onViewChange, 
  onSelectBlog, 
  onCreateBlog, 
  onEditBlog,
  onViewProfile
}: { 
  view: 'all' | 'my', 
  onViewChange: (v: 'all' | 'my') => void, 
  onSelectBlog: (id: number) => void, 
  onCreateBlog: () => void, 
  onEditBlog: (id: number) => void,
  onViewProfile: (userId: number) => void
}) => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { theme, user } = useStore();

  const fetchData = async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    
    try {
      const currentPage = isLoadMore ? page + 1 : 1;
      const [blogsRes, statsRes] = await Promise.all([
        apiFetch(`/api/blogs?user_id=${user?.id}&search=${search}&page=${currentPage}&limit=10`),
        apiFetch('/api/stats')
      ]);
      const newBlogs = await blogsRes.json();
      
      if (isLoadMore) {
        setBlogs(prev => [...prev, ...newBlogs]);
        setPage(currentPage);
      } else {
        setBlogs(newBlogs);
        setPage(1);
      }
      
      setHasMore(newBlogs.length === 10);
      setStats(await statsRes.json());
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [user?.id, search]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Attempting to delete blog:", id);
    // Removed confirm to fix potential browser dialog issues in preview
    try {
      const res = await apiFetch(`/api/blogs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        console.log("Delete successful for blog:", id);
        setBlogs(prev => prev.filter(b => b.id !== id));
      } else {
        const data = await res.json();
        console.error("Delete failed:", data.error);
        alert(data.error || "Failed to delete story");
      }
    } catch (error) {
      console.error("Delete Error:", error);
      alert("An error occurred while deleting the story");
    }
  };

  const filteredBlogs = view === 'my' ? blogs.filter(b => b.author_id === user?.id) : blogs;

  if (loading) return <div className="flex items-center justify-center h-screen"><Zap className="animate-pulse w-12 h-12 text-indigo-600" /></div>;

  const cardClasses = theme === 'orange' 
    ? 'bg-zinc-900/50 border-orange-500/20 hover:border-orange-500/40' 
    : theme === 'glass'
      ? 'glass-card'
      : 'bg-white/80 border-slate-200 backdrop-blur-xl hover:border-indigo-200';

  return (
    <div className={`max-w-7xl mx-auto px-6 py-12 transition-all ${theme === 'orange' ? 'text-[#ff8c00]' : theme === 'glass' ? 'text-indigo-950' : 'text-slate-900'}`}>
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-12 ${theme === 'glass' ? 'bg-white/5 rounded-[3rem] p-4 md:p-8 border border-white/10 backdrop-blur-[2px]' : ''}`}>
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 uppercase tracking-tight italic">
              <BookOpen className="text-indigo-600" /> {view === 'my' ? 'My Stories' : 'Recent Stories'}
            </h2>
            <div className="flex w-full md:w-auto gap-4">
              <div className="relative flex-grow md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search articles..."
                  className={`w-full pl-11 pr-4 py-3 rounded-2xl border outline-none transition-all text-sm font-bold ${theme === 'orange' ? 'bg-black border-orange-500/20 focus:ring-orange-500' : theme === 'glass' ? 'bg-white/20 border-white/40 focus:ring-indigo-500 text-indigo-950 placeholder:text-indigo-400' : 'bg-slate-50 border-slate-100 focus:ring-indigo-500'}`}
                />
              </div>
              <button 
                onClick={onCreateBlog}
                className="bg-[#ff8c00] text-black px-6 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-400 transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20 whitespace-nowrap"
              >
                <Plus className="w-5 h-5" /> Write
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button 
              onClick={() => setSearch('')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${!search ? 'bg-indigo-600 text-white border-indigo-600' : (theme === 'orange' ? 'border-orange-500/20 text-orange-500/60' : theme === 'glass' ? 'border-white/40 text-indigo-900/60 bg-white/20' : 'border-slate-200 text-slate-400')}`}
            >
              All
            </button>
            {stats?.trendingTags?.map((tag: any) => (
              <button 
                key={tag.name}
                onClick={() => setSearch(search === tag.name ? '' : tag.name)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${search === tag.name ? 'bg-indigo-600 text-white border-indigo-600' : (theme === 'orange' ? 'border-orange-500/20 text-orange-500/60 hover:bg-orange-500/10' : theme === 'glass' ? 'border-white/40 text-indigo-900/60 bg-white/20 hover:bg-white/40' : 'border-slate-200 text-slate-400 hover:bg-slate-50')}`}
              >
                #{tag.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredBlogs.map((blog) => (
              <motion.div
                key={blog.id}
                whileHover={{ y: -4 }}
                className={`rounded-3xl border shadow-sm hover:shadow-xl transition-all cursor-pointer group overflow-hidden ${cardClasses}`}
                onClick={() => onSelectBlog(blog.id)}
              >
                {(blog.media_url || blog.image_url) && (
                  <div className="w-full h-64 overflow-hidden bg-black/5 relative">
                    {blog.media_type === 'video' ? (
                      <video 
                        src={blog.media_url} 
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : blog.media_type === 'audio' ? (
                      <div className={`w-full h-full flex flex-col items-center justify-center gap-4 ${theme === 'orange' ? 'bg-orange-500/10' : 'bg-slate-100'}`}>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${theme === 'orange' ? 'bg-orange-500/20 text-orange-500' : 'bg-indigo-200 text-indigo-600'}`}>
                          <Zap className="w-8 h-8" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Audio Content</p>
                      </div>
                    ) : (
                      <img 
                        src={blog.media_url || blog.image_url} 
                        alt={blog.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                )}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                       <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${theme === 'orange' ? 'bg-orange-500/10 text-orange-500' : 'bg-indigo-50 text-indigo-600'}`}>
                        {formatToIST(blog.created_at)}
                      </span>
                      {blog.visibility === 'private' && (
                        <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md flex items-center gap-1 ${theme === 'orange' ? 'bg-rose-500/10 text-rose-500' : 'bg-rose-50 text-rose-600'}`}>
                          <Lock className="w-3 h-3" /> Private
                        </span>
                      )}
                      {blog.status === 'draft' && (
                        <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md flex items-center gap-1 bg-amber-50 text-amber-600`}>
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-slate-400 text-sm">
                      <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {blog.views}</span>
                      <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {blog.reaction_count}</span>
                    </div>
                  </div>
                  <h3 className={`text-2xl font-black mb-3 transition-colors ${theme === 'orange' ? 'text-orange-100 group-hover:text-orange-500' : 'group-hover:text-indigo-600'}`}>{blog.title}</h3>
                  <p className={`line-clamp-2 mb-6 leading-relaxed ${theme === 'orange' ? 'text-orange-500/60' : 'text-slate-600'}`}>
                    {blog.content.replace(/[#*`]/g, '')}
                  </p>
                  <div className={`flex items-center justify-between pt-6 border-t ${theme === 'orange' ? 'border-orange-500/10' : 'border-slate-50'}`}>
                    <div 
                      className="flex items-center gap-3 cursor-pointer group/author"
                      onClick={(e) => { e.stopPropagation(); onViewProfile(blog.author_id); }}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-transform group-hover/author:scale-110 ${theme === 'orange' ? 'bg-orange-500/10 text-orange-500' : 'bg-slate-100 text-slate-500'}`}>
                        {blog.author_photo ? (
                          <img src={blog.author_photo} className="w-full h-full object-cover rounded-full" alt="" />
                        ) : (
                          blog.author_name?.[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-bold ${theme === 'orange' ? 'text-orange-100' : 'text-slate-900'} group-hover/author:text-indigo-500 transition-colors`}>@{blog.author_name}</p>
                          <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${theme === 'orange' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-slate-100 border-slate-200'} ${blog.author_level_color}`}>
                            {blog.author_level}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">Author</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {blog.author_id === user?.id && (
                        <div className="flex items-center gap-2 mr-4">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onEditBlog(blog.id); }}
                            className="text-xs font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-400"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(blog.id, e); }}
                            className="text-xs font-bold uppercase tracking-widest text-rose-600 hover:text-rose-400"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                      <ArrowRight className={`w-6 h-6 transition-all ${theme === 'orange' ? 'text-orange-500/20 group-hover:text-orange-500' : 'text-slate-300 group-hover:text-indigo-600'} group-hover:translate-x-1`} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {filteredBlogs.length === 0 && (
              <div className="text-center py-20 opacity-20">
                <Search className="w-12 h-12 mx-auto mb-4" />
                <p className="text-xl font-bold uppercase tracking-widest">No stories found matching your search.</p>
              </div>
            )}
            {hasMore && (
              <div className="flex justify-center pt-8">
                <button 
                  onClick={() => fetchData(true)}
                  disabled={loadingMore}
                  className={`px-8 py-4 rounded-3xl font-black uppercase tracking-widest border transition-all flex items-center gap-3 ${theme === 'orange' ? 'border-orange-500/20 hover:bg-orange-500/10 text-orange-500' : 'border-slate-100 hover:bg-slate-50 text-slate-400'}`}
                >
                  {loadingMore ? <Zap className="animate-spin w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  {loadingMore ? 'Loading...' : 'Load More Stories'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* Trending Section */}
          <section className={`p-8 rounded-3xl border shadow-sm ${cardClasses}`}>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase tracking-tight italic">
              <TrendingUp className="text-rose-500" /> Trending Now
            </h3>
            <div className="space-y-6">
              {stats?.trending?.map((item: any, i: number) => (
                <div key={item.id} className="flex gap-4 group cursor-pointer" onClick={() => onSelectBlog(item.id)}>
                  <span className={`text-4xl font-black transition-colors ${theme === 'orange' ? 'text-orange-500/10 group-hover:text-orange-500/20' : 'text-slate-100 group-hover:text-indigo-50'}`}>0{i + 1}</span>
                  <div>
                    <h4 className={`font-bold line-clamp-2 transition-colors ${theme === 'orange' ? 'text-orange-100 group-hover:text-orange-500' : 'text-slate-900 group-hover:text-indigo-600'}`}>{item.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{item.views} views</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Top Writers */}
          <section className={`p-8 rounded-[2.5rem] shadow-xl ${theme === 'orange' ? 'bg-zinc-950 border border-orange-500/20' : 'bg-white text-slate-900 border border-slate-200'}`}>
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2 uppercase tracking-tight italic">
              <Users className="text-indigo-400" /> Top Creatives
            </h3>
            <div className="space-y-6">
              {stats?.topWriters?.map((writer: any) => (
                <div 
                  key={writer.username} 
                  className={`group relative p-4 rounded-3xl transition-all border cursor-pointer ${theme === 'orange' ? 'hover:bg-orange-500/5 border-transparent hover:border-orange-500/20' : 'hover:bg-indigo-50/50 border-transparent hover:border-indigo-100'}`}
                  onClick={() => onViewProfile(writer.id || writer.author_id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`relative w-12 h-12 rounded-2xl border-2 flex items-center justify-center font-black text-lg transition-transform group-hover:scale-110 ${theme === 'orange' ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' : 'bg-indigo-600/10 border-indigo-500/30 text-indigo-600'}`}>
                        {writer.photo_url ? (
                          <img src={writer.photo_url} className="w-full h-full object-cover rounded-[0.9rem]" alt="" />
                        ) : (
                          writer.username[0].toUpperCase()
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${writer.totalScore > 1000 ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                      </div>
                      <div>
                        <p className="font-black text-sm tracking-tight">@{writer.username}</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${writer.levelColor}`}>{writer.level}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${theme === 'orange' ? 'text-orange-500' : 'text-indigo-600'}`}>
                        {writer.total_views > 1000 ? (writer.total_views / 1000).toFixed(1) + 'k' : writer.total_views}
                      </p>
                      <p className="text-[9px] font-bold opacity-40 uppercase tracking-tighter">Impact</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 pt-3 border-t border-slate-100/50">
                    <div className="flex-1">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-30 mb-1">Uniqueness</p>
                      <div className="flex items-center gap-1">
                        <Zap className={`w-3 h-3 ${writer.uniqueness === 'High' ? 'text-amber-500' : 'text-slate-300'}`} />
                        <span className={`text-[10px] font-bold ${writer.uniqueness === 'High' ? 'text-amber-600' : 'opacity-60'}`}>
                          {writer.uniqueness} Style
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-30 mb-1">Portfolio</p>
                      <p className="text-[10px] font-bold opacity-60">{writer.blog_count} Stories</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Popular Tags */}
          <section className={`p-8 rounded-3xl border shadow-sm ${cardClasses}`}>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase tracking-tight italic">
              <Tag className="text-emerald-500" /> Popular Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {stats?.trendingTags?.map((tag: any) => (
                <span key={tag.name} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${theme === 'orange' ? 'bg-orange-500/5 text-orange-500/60 hover:bg-orange-500/10 hover:text-orange-500' : 'bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                  #{tag.name}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
