import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { 
  ArrowLeft, 
  Save, 
  Sparkles, 
  History, 
  Loader2, 
  CheckCircle2,
  X,
  Plus,
  ArrowRight,
  Globe,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const BlogEditor = ({ blogId, onBack }: { blogId?: number, onBack: () => void }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const { user, theme } = useStore();

  useEffect(() => {
    if (blogId) {
      fetch(`/api/blogs/${blogId}`)
        .then(res => res.json())
        .then(data => {
          setTitle(data.title);
          setContent(data.content);
          setImageUrl(data.image_url || '');
          setTags(data.tags.map((t: any) => t.name));
          setVisibility(data.visibility || 'public');
        });
      
      fetch(`/api/blogs/${blogId}/versions`)
        .then(res => res.json())
        .then(data => setHistory(data));
    }
  }, [blogId]);

  const handleSuggestTags = async () => {
    if (!title || !content) return;
    setSuggesting(true);
    try {
      const res = await fetch('/api/ai/suggest-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      const suggested = await res.json();
      setTags(Array.from(new Set([...tags, ...suggested])));
    } catch (error) {
      console.error("Tag Suggestion Error:", error);
    } finally {
      setSuggesting(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const method = blogId ? 'PUT' : 'POST';
      const url = blogId ? `/api/blogs/${blogId}` : '/api/blogs';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_id: user?.id,
          title,
          content,
          tags,
          visibility,
          image_url: imageUrl
        }),
      });
      if (res.ok) onBack();
    } catch (error) {
      console.error("Save Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const addTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const inputClasses = theme === 'orange' 
    ? 'bg-black border-orange-500/20 focus:ring-orange-500 text-orange-100' 
    : theme === 'dark' 
      ? 'bg-slate-800/50 border-slate-700 focus:ring-indigo-500 text-white' 
      : 'bg-slate-50 border-slate-100 focus:ring-indigo-500 text-slate-900';

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-12">
        <button 
          onClick={onBack} 
          className={`p-3 rounded-2xl transition-all border ${theme === 'orange' ? 'border-orange-500/20 hover:bg-orange-500/10 text-orange-500' : theme === 'dark' ? 'border-slate-700 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'}`}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex gap-4">
          <select 
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
            className={`px-6 py-3 rounded-2xl font-black uppercase tracking-widest outline-none border transition-all cursor-pointer ${theme === 'orange' ? 'bg-black border-orange-500/20 text-orange-500 hover:bg-orange-500/5' : theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}
          >
            <option value="public">🌍 Public</option>
            <option value="private">🔒 Private</option>
          </select>
          {blogId && (
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest transition-all border ${theme === 'orange' ? 'border-orange-500/20 text-orange-500 hover:bg-orange-500/5' : theme === 'dark' ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
            >
              <History className="w-5 h-5" /> History
            </button>
          )}
          <button 
            disabled={loading}
            onClick={handleSave}
            className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl disabled:opacity-50 ${theme === 'orange' ? 'bg-orange-500 text-black hover:bg-orange-400 shadow-orange-500/20' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {blogId ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a catchy title..."
          className={`w-full text-5xl font-black placeholder:opacity-20 outline-none border-none bg-transparent italic uppercase tracking-tighter ${theme === 'orange' ? 'text-orange-100' : theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
        />

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Cover Image URL</label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className={`w-full p-5 rounded-2xl outline-none border transition-all text-sm font-medium ${inputClasses}`}
          />
        </div>

        <div className={`flex flex-wrap items-center gap-4 py-6 border-y ${theme === 'orange' ? 'border-orange-500/10' : 'border-slate-100'}`}>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <span key={tag} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${theme === 'orange' ? 'bg-orange-500/10 text-orange-500' : 'bg-indigo-50 text-indigo-600'}`}>
                #{tag}
                <button onClick={() => removeTag(tag)} className="hover:opacity-60"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <form onSubmit={addTag} className="flex items-center">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag..."
              className={`text-sm font-bold outline-none bg-transparent border-none w-32 placeholder:opacity-30 ${theme === 'orange' ? 'text-orange-500' : 'text-slate-400'}`}
            />
          </form>
          <button 
            onClick={handleSuggestTags}
            disabled={suggesting}
            className={`ml-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all disabled:opacity-50 ${theme === 'orange' ? 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
          >
            {suggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            AI Suggest
          </button>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tell your story... (Markdown supported)"
          className={`w-full min-h-[600px] text-xl leading-relaxed placeholder:opacity-20 outline-none border-none bg-transparent resize-none font-medium ${theme === 'orange' ? 'text-orange-100/80' : theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}
        />
      </div>

      {/* Version History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl border-l border-slate-100 p-6 z-50 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">Version History</h3>
              <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X /></button>
            </div>
            <div className="space-y-6">
              {history.map((v) => (
                <div key={v.id} className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                  <p className="text-xs font-bold text-slate-400 mb-2">
                    {new Date(v.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-600 line-clamp-3 mb-4">{v.content}</p>
                  <button 
                    onClick={() => {
                      setContent(v.content);
                      setShowHistory(false);
                    }}
                    className="text-xs font-bold text-indigo-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    Restore this version <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {history.length === 0 && <p className="text-slate-400 text-center py-12">No previous versions found.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
