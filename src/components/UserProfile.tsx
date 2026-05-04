import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { 
  Zap, 
  BookOpen, 
  Users, 
  UserPlus, 
  UserCheck, 
  ArrowLeft,
  Calendar,
  Grid,
  List as ListIcon,
  Eye,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatToIST, apiFetch } from '../lib/api';

export const UserProfile = ({ userId, onBack, onSelectBlog }: { userId: number, onBack: () => void, onSelectBlog: (id: number) => void }) => {
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { theme, user: currentUser, setUser } = useStore();

  const isOwnProfile = currentUser?.id === userId;

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const [profileRes, postsRes] = await Promise.all([
        apiFetch(`/api/users/${userId}?viewer_id=${currentUser?.id}`),
        apiFetch(`/api/users/${userId}/posts?viewer_id=${currentUser?.id}`)
      ]);
      const profileData = await profileRes.json();
      setProfile(profileData);
      setPosts(await postsRes.json());
      setEditBio(profileData.bio || '');
      setEditPhoto(profileData.photo_url || '');
    } catch (error) {
      console.error("Profile Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId, currentUser?.id]);

  const handleFollow = async () => {
    if (!currentUser) return;
    try {
      const res = await apiFetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        body: JSON.stringify({ follower_id: currentUser.id })
      });
      const data = await res.json();
      if (res.ok) {
        setProfile((prev: any) => ({
          ...prev,
          isFollowing: data.followed,
          followersCount: data.followed ? prev.followersCount + 1 : prev.followersCount - 1
        }));
      }
    } catch (error) {
      console.error("Follow Error:", error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Please upload an image file.");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPendingFile(file);
  };

  const cancelPhotoSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPendingFile(null);
  };

  const handleSavePhoto = async () => {
    if (!pendingFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', pendingFile);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.url) {
        const updateRes = await apiFetch(`/api/users/${userId}`, {
          method: 'PUT',
          body: JSON.stringify({
            photo_url: data.url,
            viewer_id: currentUser?.id
          })
        });

        if (updateRes.ok) {
          const updatedUser = await updateRes.json();
          setProfile((prev: any) => ({ ...prev, ...updatedUser }));
          setEditPhoto(updatedUser.photo_url);
          if (isOwnProfile) {
            setUser({ ...currentUser, ...updatedUser });
          }
          cancelPhotoSelection();
          alert("Profile picture updated successfully!");
        }
      }
    } catch (error) {
      console.error("Save Photo Error:", error);
      alert("Failed to update profile picture.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await apiFetch(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          bio: editBio,
          photo_url: editPhoto,
          viewer_id: currentUser?.id
        })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setProfile((prev: any) => ({ ...prev, ...updatedUser }));
        if (isOwnProfile) {
          setUser({ ...currentUser, ...updatedUser });
        }
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Save Profile Error:", error);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Zap className="animate-pulse w-12 h-12 text-indigo-600" /></div>;
  if (!profile) return <div className="p-12 text-center text-rose-500 font-bold">User Not Found</div>;

  const cardClasses = theme === 'orange' 
    ? 'bg-zinc-900/50 border-orange-500/20' 
    : 'bg-white/80 border-slate-200 backdrop-blur-xl';

  return (
    <div className={`max-w-4xl mx-auto px-6 py-12 ${theme === 'orange' ? 'text-orange-100' : 'text-slate-900'}`}>
      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsEditing(false);
                cancelPhotoSelection();
              }
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`p-8 rounded-[3rem] max-w-md w-full relative border ${cardClasses}`}
            >
              <h2 className="text-3xl font-black mb-8 uppercase italic tracking-tighter">Edit Profile</h2>
              
              <div className="space-y-6">
                {/* Photo Upload */}
                <div className="flex flex-col items-center gap-4">
                  <div className={`w-24 h-24 rounded-3xl flex items-center justify-center font-black text-2xl border-2 overflow-hidden ${theme === 'orange' ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' : 'bg-indigo-600/10 border-indigo-500/30 text-indigo-600'}`}>
                    {previewUrl ? (
                      <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                    ) : editPhoto ? (
                      <img src={editPhoto} className="w-full h-full object-cover" alt="" />
                    ) : (
                      profile.username[0].toUpperCase()
                    )}
                  </div>
                  
                  {!previewUrl ? (
                    <label className={`cursor-pointer px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'orange' ? 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
                      Change Photo
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </label>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={handleSavePhoto}
                        disabled={isUploading}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'orange' ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                      >
                        {isUploading ? 'Saving...' : 'Save Photo'}
                      </button>
                      <button 
                        onClick={cancelPhotoSelection}
                        disabled={isUploading}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'orange' ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                      >
                        Discard
                      </button>
                    </div>
                  )}
                </div>

                {/* Bio Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Bio</label>
                  <textarea 
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className={`w-full p-4 rounded-2xl outline-none border transition-all text-sm h-32 resize-none ${theme === 'orange' ? 'bg-black border-orange-500/20 text-orange-100' : 'bg-slate-50 border-slate-100'}`}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      cancelPhotoSelection();
                    }}
                    className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest transition-all border ${theme === 'orange' ? 'border-orange-500/20 text-orange-500 hover:bg-orange-500/10' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl ${theme === 'orange' ? 'bg-[#ff8c00] text-black hover:bg-orange-400 shadow-orange-500/20' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-4 mb-12">
        <button 
          onClick={onBack}
          className={`p-3 rounded-2xl transition-all border ${theme === 'orange' ? 'border-orange-500/20 hover:bg-orange-500/10 text-orange-500' : 'border-slate-200 hover:bg-slate-100 text-slate-600'}`}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-black uppercase italic tracking-tighter">User Profile</h1>
      </div>

      {/* Profile Card */}
      <div className={`p-8 lg:p-12 rounded-[3.5rem] border mb-12 ${cardClasses}`}>
        <div className="flex flex-col md:flex-row gap-12 items-center md:items-start">
          {/* Avatar Area */}
          <div className="relative group">
            <div className={`w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] flex items-center justify-center font-black text-4xl border-4 shadow-2xl transition-transform group-hover:scale-105 ${theme === 'orange' ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' : 'bg-indigo-600/10 border-indigo-500/30 text-indigo-600'}`}>
              {profile.photo_url ? (
                <img src={profile.photo_url} className="w-full h-full object-cover rounded-[2.2rem]" alt={profile.username} />
              ) : (
                profile.username[0].toUpperCase()
              )}
            </div>
            {profile.isFollowing && !isOwnProfile && (
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full shadow-lg">
                <UserCheck className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Info Area */}
          <div className="flex-1 w-full space-y-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-4xl font-black tracking-tight mb-1">@{profile.username}</h2>
                <div className="flex items-center justify-center md:justify-start gap-2 text-sm font-bold opacity-50 uppercase tracking-widest">
                  <Calendar className="w-4 h-4" /> Joined {new Date(profile.created_at).toLocaleDateString()}
                </div>
              </div>
              {!isOwnProfile ? (
                <button
                  onClick={handleFollow}
                  className={`flex items-center justify-center gap-2 px-8 py-4 rounded-3xl font-black uppercase tracking-widest transition-all ${
                    profile.isFollowing 
                    ? (theme === 'orange' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500/20' : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200')
                    : (theme === 'orange' ? 'bg-[#ff8c00] text-black hover:bg-orange-400 shadow-xl shadow-orange-500/20' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200')
                  }`}
                >
                  {profile.isFollowing ? <><UserCheck className="w-5 h-5" /> Following</> : <><UserPlus className="w-5 h-5" /> Follow</>}
                </button>
              ) : (
                <button 
                  className={`px-8 py-4 rounded-3xl font-black uppercase tracking-widest transition-all border ${theme === 'orange' ? 'border-orange-500/20 text-orange-500 hover:bg-orange-500/10' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              )}
            </div>

            {/* Stats */}
            <div className={`grid grid-cols-3 divide-x ${theme === 'orange' ? 'divide-orange-500/10' : 'divide-slate-100'} py-6 border-y ${theme === 'orange' ? 'border-orange-500/10' : 'border-slate-50'}`}>
              <div className="text-center">
                <p className="text-2xl font-black">{profile.postCount}</p>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black">{profile.followersCount}</p>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black">{profile.followingCount}</p>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Following</p>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="pt-2">
                <p className={`text-lg italic leading-relaxed ${theme === 'orange' ? 'text-orange-100/70' : 'text-slate-600'}`}>
                  "{profile.bio}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b pb-4 border-slate-100/50">
          <h3 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tight italic">
            <BookOpen className="text-indigo-600" /> Stories by {profile.username}
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setLayout('grid')}
              className={`p-2 rounded-xl transition-all ${layout === 'grid' ? (theme === 'orange' ? 'bg-orange-500/20 text-orange-500' : 'bg-indigo-50 text-indigo-600') : 'opacity-40'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setLayout('list')}
              className={`p-2 rounded-xl transition-all ${layout === 'list' ? (theme === 'orange' ? 'bg-orange-500/20 text-orange-500' : 'bg-indigo-50 text-indigo-600') : 'opacity-40'}`}
            >
              <ListIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className={`p-20 text-center rounded-[3rem] border-2 border-dashed ${theme === 'orange' ? 'border-orange-500/10' : 'border-slate-100'}`}>
            <p className="text-lg font-bold opacity-30 uppercase tracking-widest">No stories shared yet.</p>
          </div>
        ) : layout === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <motion.div
                key={post.id}
                whileHover={{ y: -4 }}
                className={`rounded-[2.5rem] border shadow-sm hover:shadow-xl transition-all cursor-pointer group overflow-hidden ${cardClasses}`}
                onClick={() => onSelectBlog(post.id)}
              >
                {(post.media_url || post.image_url) && (
                  <div className="w-full h-48 overflow-hidden bg-black/5 relative">
                    <img 
                      src={post.media_url || post.image_url} 
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${theme === 'orange' ? 'bg-orange-500/10 text-orange-500' : 'bg-indigo-50 text-indigo-600'}`}>
                      {formatToIST(post.created_at)}
                    </span>
                    <div className="flex gap-3 text-xs opacity-40">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.views}</span>
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.reaction_count}</span>
                    </div>
                  </div>
                  <h4 className="text-xl font-black line-clamp-1 mb-2 italic tracking-tight">{post.title}</h4>
                  <p className="text-sm opacity-60 line-clamp-2 leading-relaxed">{post.content.replace(/[#*`]/g, '')}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div 
                key={post.id}
                onClick={() => onSelectBlog(post.id)}
                className={`p-6 rounded-3xl border transition-all cursor-pointer group flex items-center justify-between text-left ${cardClasses} hover:border-indigo-500/40`}
              >
                <div className="flex-1">
                  <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] mb-1">{formatToIST(post.created_at)}</p>
                  <h4 className="text-xl font-black italic tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{post.title}</h4>
                </div>
                <div className="flex items-center gap-8 text-sm font-black opacity-30">
                   <span className="flex items-center gap-2"><Eye className="w-4 h-4" /> {post.views}</span>
                   <span className="flex items-center gap-2"><Heart className="w-4 h-4" /> {post.reaction_count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
