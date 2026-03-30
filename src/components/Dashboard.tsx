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
  Lock
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

export const Dashboard = ({ view, onViewChange, onSelectBlog, onCreateBlog, onEditBlog }: { view: 'all' | 'my', onViewChange: (v: 'all' | 'my') => void, onSelectBlog: (id: number) => void, onCreateBlog: () => void, onEditBlog: (id: number) => void }) => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { theme, user } = useStore();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [blogsRes, statsRes] = await Promise.all([
        fetch(`/api/blogs?user_id=${user?.id}`),
        fetch('/api/stats')
      ]);
      const allBlogs = await blogsRes.json();
      setBlogs(allBlogs);
      setStats(await statsRes.json());
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Attempting to delete blog:", id);
    // Removed confirm to fix potential browser dialog issues in preview
    try {
      const res = await fetch(`/api/blogs/${id}`, { method: 'DELETE' });
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
    : theme === 'dark' 
      ? 'bg-slate-800/50 border-slate-700/50 backdrop-blur-xl hover:border-slate-600' 
      : 'bg-white/80 border-slate-200 backdrop-blur-xl hover:border-indigo-200';

  return (
    <div className={`max-w-7xl mx-auto px-6 py-12 ${theme === 'orange' ? 'text-[#ff8c00]' : theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-2 uppercase tracking-tight italic">
              <BookOpen className="text-indigo-600" /> {view === 'my' ? 'My Stories' : 'Recent Stories'}
            </h2>
            <button 
              onClick={onCreateBlog}
              className="bg-[#ff8c00] text-black px-6 py-2 rounded-full font-black uppercase tracking-widest hover:bg-orange-400 transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-5 h-5" /> Create Story
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredBlogs.map((blog) => (
              <motion.div
                key={blog.id}
                whileHover={{ y: -4 }}
                className={`rounded-3xl border shadow-sm hover:shadow-xl transition-all cursor-pointer group overflow-hidden ${cardClasses}`}
                onClick={() => onSelectBlog(blog.id)}
              >
                {blog.image_url && (
                  <div className="w-full h-64 overflow-hidden">
                    <img 
                      src={blog.image_url} 
                      alt={blog.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${theme === 'orange' ? 'bg-orange-500/10 text-orange-500' : 'bg-indigo-50 text-indigo-600'}`}>
                        {formatDistanceToNow(new Date(blog.created_at))} ago
                      </span>
                      {blog.visibility === 'private' && (
                        <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md flex items-center gap-1 ${theme === 'orange' ? 'bg-rose-500/10 text-rose-500' : 'bg-rose-50 text-rose-600'}`}>
                          <Lock className="w-3 h-3" /> Private
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-slate-400 text-sm">
                      <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {blog.views}</span>
                      <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {blog.reaction_count}</span>
                    </div>
                  </div>
                  <h3 className={`text-2xl font-black mb-3 transition-colors ${theme === 'orange' ? 'text-orange-100 group-hover:text-orange-500' : theme === 'dark' ? 'text-white group-hover:text-indigo-400' : 'group-hover:text-indigo-600'}`}>{blog.title}</h3>
                  <p className={`line-clamp-2 mb-6 leading-relaxed ${theme === 'orange' ? 'text-orange-500/60' : theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    {blog.content.replace(/[#*`]/g, '')}
                  </p>
                  <div className={`flex items-center justify-between pt-6 border-t ${theme === 'orange' ? 'border-orange-500/10' : 'border-slate-50'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${theme === 'orange' ? 'bg-orange-500/10 text-orange-500' : 'bg-slate-100 text-slate-500'}`}>
                        {blog.author_name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${theme === 'orange' ? 'text-orange-100' : theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>@{blog.author_name}</p>
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
          <section className={`p-8 rounded-3xl shadow-xl ${theme === 'orange' ? 'bg-zinc-950 border border-orange-500/20' : 'bg-slate-900 text-white'}`}>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase tracking-tight italic">
              <Users className="text-indigo-400" /> Top Writers
            </h3>
            <div className="space-y-4">
              {stats?.topWriters?.map((writer: any) => (
                <div key={writer.username} className={`flex items-center justify-between p-3 rounded-2xl transition-colors ${theme === 'orange' ? 'hover:bg-orange-500/5' : 'hover:bg-white/5'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold ${theme === 'orange' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-indigo-600/20 border-indigo-500/30'}`}>
                      {writer.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold">@{writer.username}</p>
                      <p className="text-xs text-slate-400">{writer.blog_count} stories</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${theme === 'orange' ? 'text-orange-500' : 'text-indigo-400'}`}>{writer.total_views}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Views</p>
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
