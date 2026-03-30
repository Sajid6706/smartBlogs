import { useState, useEffect } from 'react';
import { useStore } from './store';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { BlogEditor } from './components/BlogEditor';
import { BlogView } from './components/BlogView';
import { Navbar } from './components/Navbar';
import { Settings } from './components/Settings';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { user, theme } = useStore();
  const [view, setView] = useState<'dashboard' | 'editor' | 'view' | 'settings'>('dashboard');
  const [subView, setSubView] = useState<'all' | 'my'>('all');
  const [selectedBlogId, setSelectedBlogId] = useState<number | undefined>();

  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  const getThemeClasses = () => {
    switch (theme) {
      case 'orange': return 'bg-black text-[#ff8c00]';
      case 'light': return 'bg-white text-slate-900';
      default: return 'bg-white text-slate-900';
    }
  };

  if (!user) return <Auth />;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${getThemeClasses()}`}>
      <Navbar 
        onViewChange={(v, sv) => {
          setView(v);
          if (sv) setSubView(sv);
        }}
        currentView={view}
        currentSubView={subView}
      />
      
      <AnimatePresence mode="wait">
        {view === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Dashboard 
              view={subView}
              onViewChange={setSubView}
              onSelectBlog={(id) => {
                setSelectedBlogId(id);
                setView('view');
              }}
              onCreateBlog={() => {
                setSelectedBlogId(undefined);
                setView('editor');
              }}
              onEditBlog={(id) => {
                setSelectedBlogId(id);
                setView('editor');
              }}
            />
          </motion.div>
        )}

        {view === 'editor' && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <BlogEditor 
              blogId={selectedBlogId}
              onBack={() => setView('dashboard')}
            />
          </motion.div>
        )}

        {view === 'view' && (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <BlogView 
              blogId={selectedBlogId!}
              onBack={() => setView('dashboard')}
            />
          </motion.div>
        )}

        {view === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Settings onBack={() => setView('dashboard')} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className={`px-8 py-12 border-t mt-20 ${theme === 'orange' ? 'border-orange-900/30 bg-zinc-950' : 'border-slate-200'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-2xl font-black tracking-tighter uppercase italic">
            Smart Blog
          </div>
          <div className={`flex gap-8 text-sm font-bold ${theme === 'orange' ? 'text-orange-500/60' : 'text-slate-400'}`}>
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Contact Us</a>
          </div>
          <div className={`text-sm font-medium ${theme === 'orange' ? 'text-orange-500/40' : 'text-slate-400'}`}>
            © 2026 Smart Blog AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
