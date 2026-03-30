import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { 
  ArrowLeft, 
  MessageSquare, 
  Eye, 
  User, 
  Calendar,
  Send,
  Loader2,
  AlertCircle,
  Heart,
  Smile,
  Lightbulb,
  Info
} from 'lucide-react';
import Markdown from 'react-markdown';
import { motion } from 'motion/react';
import { format } from 'date-fns';

const REACTION_TYPES = [
  { type: 'inspiring', icon: Lightbulb, label: 'Inspiring', color: 'text-amber-500 bg-amber-50' },
  { type: 'informative', icon: Info, label: 'Informative', color: 'text-blue-500 bg-blue-50' },
  { type: 'funny', icon: Smile, label: 'Funny', color: 'text-emerald-500 bg-emerald-50' },
  { type: 'loved_it', icon: Heart, label: 'Loved It', color: 'text-rose-500 bg-rose-50' },
];

export const BlogView = ({ blogId, onBack }: { blogId: number, onBack: () => void }) => {
  const [blog, setBlog] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, theme } = useStore();

  const fetchBlog = async () => {
    try {
      const res = await fetch(`/api/blogs/${blogId}`);
      const data = await res.json();
      setBlog(data);
    } catch (error) {
      console.error("Fetch Blog Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlog();
  }, [blogId]);

  const handleReaction = async (type: string) => {
    if (!user) return;
    try {
      await fetch(`/api/blogs/${blogId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, type }),
      });
      fetchBlog();
    } catch (error) {
      console.error("Reaction Error:", error);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment || !user) return;
    setSubmitting(true);
    try {
      // AI Filtering
      const filterRes = await fetch('/api/ai/filter-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      });
      const { is_spam } = await filterRes.json();

      if (is_spam) {
        alert("Your comment was flagged as inappropriate and will not be visible.");
      }

      await fetch(`/api/blogs/${blogId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, content: comment, is_spam }),
      });
      setComment('');
      fetchBlog();
    } catch (error) {
      console.error("Comment Error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin w-12 h-12 text-indigo-600" /></div>;
  if (!blog) return <div>Blog not found</div>;

  const isAuthor = blog.author_id === user?.id;

  const cardClasses = theme === 'orange' 
    ? 'bg-zinc-900/50 border-orange-500/10' 
    : theme === 'dark' 
      ? 'bg-slate-800/50 border-slate-700/50 backdrop-blur-xl' 
      : 'bg-slate-50 border-transparent backdrop-blur-xl';

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <button 
        onClick={onBack} 
        className={`mb-8 p-3 rounded-2xl transition-all border ${theme === 'orange' ? 'border-orange-500/20 hover:bg-orange-500/10 text-orange-500' : theme === 'dark' ? 'border-slate-700 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'}`}
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <article>
        {blog.image_url && (
          <div className="w-full h-[400px] rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl border border-white/10">
            <img 
              src={blog.image_url} 
              alt={blog.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {blog.tags?.map((tag: any) => (
            <span key={tag.name} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${theme === 'orange' ? 'bg-orange-500/10 text-orange-500' : 'bg-indigo-50 text-indigo-600'}`}>
              #{tag.name}
            </span>
          ))}
        </div>

        <h1 className="text-5xl lg:text-6xl font-black mb-8 leading-tight uppercase tracking-tight italic">{blog.title}</h1>

        <div className={`flex items-center justify-between py-8 border-y mb-12 ${theme === 'orange' ? 'border-orange-500/10' : 'border-slate-100'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${theme === 'orange' ? 'bg-orange-500/10 text-orange-500' : 'bg-indigo-600 text-white'}`}>
              {blog.author_name[0].toUpperCase()}
            </div>
            <div>
              <p className="font-bold">@{blog.author_name}</p>
              <p className={`text-sm flex items-center gap-1 ${theme === 'orange' ? 'text-orange-500/40' : 'text-slate-400'}`}>
                <Calendar className="w-3 h-3" /> {format(new Date(blog.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-sm font-bold opacity-40 uppercase tracking-widest"><Eye className="w-4 h-4" /> {blog.views} views</span>
          </div>
        </div>

        <div className={`markdown-body mb-20 prose prose-lg max-w-none ${theme === 'orange' ? 'prose-invert prose-orange' : theme === 'dark' ? 'prose-invert' : ''}`}>
          <Markdown>{blog.content}</Markdown>
        </div>

        {/* Reactions */}
        <div className={`p-10 rounded-[3rem] mb-20 border ${cardClasses}`}>
          <h3 className="text-xl font-black mb-8 text-center uppercase tracking-widest italic">How did you find this story?</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {REACTION_TYPES.map((r) => {
              const count = blog.reactions?.find((br: any) => br.type === r.type)?.count || 0;
              return (
                <button
                  key={r.type}
                  onClick={() => handleReaction(r.type)}
                  className={`flex flex-col items-center gap-3 p-6 rounded-3xl transition-all hover:scale-105 active:scale-95 ${r.color} ${theme === 'orange' ? 'bg-opacity-10' : 'bg-opacity-50 backdrop-blur-sm'}`}
                >
                  <r.icon className="w-8 h-8" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{r.label}</span>
                  <span className="text-lg font-black">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Comments Section */}
        <section className="space-y-12">
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-black flex items-center gap-3 uppercase tracking-tight italic">
              <MessageSquare className="text-indigo-600" /> Discussion
            </h3>
            <span className="text-sm font-bold opacity-40 uppercase tracking-widest">{blog.comments?.length || 0} comments</span>
          </div>

          <form onSubmit={handleComment} className="relative">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={isAuthor ? "Add a thought to your story..." : "Reply to this story..."}
              className={`w-full p-8 rounded-[2.5rem] border focus:ring-2 outline-none transition-all min-h-[160px] resize-none text-lg ${theme === 'orange' ? 'bg-black border-orange-500/20 focus:ring-orange-500' : theme === 'dark' ? 'bg-slate-800/50 border-slate-700 focus:ring-indigo-500' : 'bg-white/80 border-slate-200 focus:ring-indigo-500'}`}
            />
            <button
              disabled={submitting || !comment}
              type="submit"
              className={`absolute right-6 bottom-6 p-4 rounded-2xl transition-all disabled:opacity-50 shadow-xl ${theme === 'orange' ? 'bg-orange-50 text-black hover:bg-orange-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}
            >
              {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
            </button>
          </form>

          <div className="space-y-8">
            {blog.comments?.map((c: any) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={c.id} 
                className={`flex gap-6 p-8 rounded-[2.5rem] border shadow-sm ${cardClasses}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold shrink-0 text-lg ${theme === 'orange' ? 'bg-orange-500/10 text-orange-500' : 'bg-indigo-600 text-white'}`}>
                  {c.username[0].toUpperCase()}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-lg">@{c.username}</span>
                      <span className="text-[10px] opacity-40 uppercase font-black tracking-widest">
                        {format(new Date(c.created_at), 'MMM d')}
                      </span>
                    </div>
                    {!isAuthor && c.user_id !== user?.id && (
                      <button 
                        onClick={() => {
                          setComment(`@${c.username} `);
                          window.scrollTo({ top: document.querySelector('textarea')?.offsetTop ? document.querySelector('textarea')!.offsetTop - 100 : 0, behavior: 'smooth' });
                          document.querySelector('textarea')?.focus();
                        }}
                        className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-400"
                      >
                        Reply
                      </button>
                    )}
                  </div>
                  <p className="text-lg opacity-80 leading-relaxed">{c.content}</p>
                </div>
              </motion.div>
            ))}
            {(!blog.comments || blog.comments.length === 0) && (
              <div className="text-center py-20 opacity-20">
                <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                <p className="text-xl font-bold uppercase tracking-widest">No comments yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        </section>
      </article>
    </div>
  );
};
