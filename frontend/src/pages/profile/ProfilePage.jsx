import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Bell, Cpu, Lock, AlertTriangle, 
  Save, LogOut, Loader, Sparkles, TrendingUp,
  Target, Activity, Award, Zap, Flame, Camera, 
  Trash2, Download, CheckCircle, RefreshCw, Eye, EyeOff,
  Globe, Clock, Calendar, Check, X, BookOpen, Layers,
  Compass, BarChart3, CheckSquare, HeartPulse
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { profileApi } from '../../api/profileApi';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export default function ProfilePage() {
  const { user, logout, avatarBlobUrl, updateProfile } = useAuth();
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  
  // State
  const [profile, setProfile] = useState(null);
  const [originalProfile, setOriginalProfile] = useState(null);
  const [journeyStats, setJourneyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('journey');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Avatar preview before saving
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Browser timezone detection
  const detectedTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  }, []);

  useEffect(() => {
    fetchProfileAndStats();
  }, []);

  const fetchProfileAndStats = async () => {
    try {
      setLoading(true);
      const data = await profileApi.getProfile();
      if (data.success) {
        setProfile(data.profile);
        setOriginalProfile(data.profile);
      } else {
        setError(data.error || 'Failed to load profile');
      }
    } catch (err) {
      setError('Failed to load profile data.');
    } finally {
      setLoading(false);
    }

    try {
      setStatsLoading(true);
      const statsRes = await profileApi.getJourneyStats();
      if (statsRes.success) {
        setJourneyStats(statsRes.stats);
      }
    } catch (err) {
      console.error('Failed to load journey stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleResetProfile = () => {
    if (originalProfile) {
      setProfile({ ...originalProfile });
      setAvatarPreview(null);
      setAvatarFile(null);
      setError(null);
      setSuccess(null);
    }
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // If avatar file was chosen, upload first
      if (avatarFile) {
        const uploadRes = await profileApi.uploadAvatar(avatarFile);
        if (uploadRes.success) {
          updateProfile({ has_avatar: true });
        }
        setAvatarFile(null);
        setAvatarPreview(null);
      }

      const data = await profileApi.updateProfile(profile);
      if (data.success) {
        setProfile(data.profile);
        setOriginalProfile(data.profile);
        updateProfile({ ...data.profile });
        setSuccess('Profile and preferences updated successfully!');
        setTimeout(() => setSuccess(null), 4000);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      setError('Invalid format. Only JPG, PNG, and WEBP images are supported.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5 MB.');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleRemoveAvatar = async () => {
    try {
      setSaving(true);
      setError(null);
      const data = await profileApi.removeAvatar();
      if (data.success) {
        setProfile(data.profile);
        setOriginalProfile(data.profile);
        setAvatarPreview(null);
        setAvatarFile(null);
        updateProfile({ has_avatar: false });
        setSuccess('Profile photo removed.');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Failed to remove profile photo.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (passwordData.new !== passwordData.confirm) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (passwordData.new.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    try {
      setPasswordSaving(true);
      const data = await profileApi.changePassword(passwordData.current, passwordData.new);
      if (data.success) {
        setPasswordSuccess('Password updated successfully!');
        setPasswordData({ current: '', new: '', confirm: '' });
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess(null);
        }, 1800);
      } else {
        setPasswordError(data.error || 'Failed to update password');
      }
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Failed to change password. Please check your current password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      const data = await profileApi.exportUserData();
      if (data.success) {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', jsonString);
        downloadAnchor.setAttribute('download', `life_replay_export_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setSuccess('Your personal data archive was exported successfully!');
        setTimeout(() => setSuccess(null), 4000);
      }
    } catch (err) {
      setError('Failed to export data archive.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setError("Please type 'DELETE' to confirm account deletion.");
      return;
    }

    try {
      setDeleting(true);
      await profileApi.deleteAccount();
      logout();
      navigate('/login');
    } catch (err) {
      setError('Failed to delete account. Please try again.');
      setDeleting(false);
    }
  };

  // Profile completion calculation
  const completionData = useMemo(() => {
    if (!profile) return { score: 0, missing: [] };
    let score = 0;
    const missing = [];

    if (profile.full_name?.trim()) score += 20; else missing.push('Full Name');
    if (profile.email?.trim()) score += 15;
    if (profile.has_avatar || avatarPreview) score += 20; else missing.push('Profile Photo');
    if (profile.bio?.trim()) score += 15; else missing.push('Bio Statement');
    if (profile.timezone) score += 10;
    if (profile.preferred_language) score += 10;
    if (profile.ai_focus_areas?.trim()) score += 10; else missing.push('AI Focus Areas');

    return { score: Math.min(100, score), missing };
  }, [profile, avatarPreview]);

  // Password strength estimation
  const passwordStrength = useMemo(() => {
    const p = passwordData.new;
    if (!p) return { label: 'None', color: 'bg-slate-700', width: '0%' };
    let score = 0;
    if (p.length >= 8) score += 1;
    if (/[A-Z]/.test(p)) score += 1;
    if (/[0-9]/.test(p)) score += 1;
    if (/[^A-Za-z0-9]/.test(p)) score += 1;

    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: '25%' };
    if (score === 2) return { label: 'Fair', color: 'bg-amber-500', width: '50%' };
    if (score === 3) return { label: 'Good', color: 'bg-blue-500', width: '75%' };
    return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  }, [passwordData.new]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-3 border-purple-500 border-t-transparent animate-spin" />
          <p className="text-slate-300 text-sm font-medium tracking-wide">Loading your profile & settings…</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'journey', label: 'Journey Summary', icon: Compass },
    { id: 'preferences', label: 'Personal Preferences', icon: Globe },
    { id: 'ai', label: 'AI & Coaching', icon: Cpu },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'account', label: 'Data & Account', icon: Layers }
  ];

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <User className="w-8 h-8 text-purple-400" />
            Profile & Settings
          </h1>
          <p className="text-slate-300 mt-1 text-base">Manage your profile, preferences and personal journey</p>
        </div>
      </motion.div>

      {/* Global Status Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-500/15 border border-red-500/30 rounded-2xl text-red-200 flex items-center justify-between backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-200 flex items-center justify-between backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: Large Profile Card & Edit Profile Form      */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Identity & Avatar Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/70 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Avatar Section */}
            <div className="flex flex-col items-center text-center">
              <div className="relative group/avatar mb-4">
                <div className="w-28 h-28 rounded-3xl p-1 bg-gradient-to-br from-purple-500 via-indigo-500 to-purple-800 shadow-xl relative overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full rounded-[22px] object-cover" />
                  ) : avatarBlobUrl ? (
                    <img src={avatarBlobUrl} alt="Profile" className="w-full h-full rounded-[22px] object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-[22px] bg-slate-950/80 flex items-center justify-center text-3xl font-extrabold text-white tracking-wider">
                      {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>

                {/* Camera Overlay Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  className="absolute bottom-1 right-1 p-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg border border-purple-400/40 transition-all hover:scale-110 active:scale-95 cursor-pointer"
                  title="Upload profile photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Photo Actions */}
              <div className="flex items-center gap-2 mb-4">
                {avatarFile && (
                  <span className="text-xs text-purple-300 font-medium px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30">
                    New photo selected (Click Save)
                  </span>
                )}
                {profile?.has_avatar && !avatarFile && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={saving}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 hover:underline"
                  >
                    <Trash2 className="w-3 h-3" /> Remove Photo
                  </button>
                )}
              </div>

              {/* Name & Subtitle */}
              <h2 className="text-2xl font-bold text-white tracking-tight">{profile?.full_name || 'Life Replay User'}</h2>
              <p className="text-sm text-purple-300/80 font-medium mt-0.5">Your journey, replayed</p>
              <p className="text-xs text-slate-400 mt-1">{profile?.email}</p>

              {/* Badges: Level, XP, Streak */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 shadow-sm">
                  <Zap className="w-3 h-3 text-purple-400" /> Level {profile?.level || 1}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3 h-3 text-amber-400" /> {Number(profile?.total_xp || 0).toLocaleString()} XP
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                  <Flame className="w-3 h-3 text-emerald-400" /> {profile?.current_streak || 0} Day Streak
                </span>
              </div>
            </div>

            {/* Profile Completion Indicator */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
                  Profile Completion
                </span>
                <span className="font-bold text-purple-300">{completionData.score}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionData.score}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full shadow-glow-purple"
                />
              </div>
              {completionData.missing.length > 0 && (
                <p className="text-[11px] text-slate-400 mt-2">
                  Tip: Complete your <span className="text-purple-300">{completionData.missing.join(', ')}</span> for 100% profile score.
                </p>
              )}
            </div>
          </motion.div>

          {/* Edit Profile Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/70 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              Edit Profile
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile?.full_name || ''}
                  onChange={(e) => handleFieldChange('full_name', e.target.value)}
                  required
                  placeholder="Your full name"
                  className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-[10px] text-slate-500 lowercase">(read-only)</span>
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  readOnly
                  className="w-full bg-slate-950/30 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-400 cursor-not-allowed text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Bio & Motivation
                  </label>
                  <span className={clsx(
                    "text-[11px] font-mono",
                    (profile?.bio?.length || 0) > 220 ? "text-amber-400" : "text-slate-400"
                  )}>
                    {profile?.bio?.length || 0} / 250
                  </span>
                </div>
                <textarea
                  value={profile?.bio || ''}
                  onChange={(e) => handleFieldChange('bio', e.target.value.slice(0, 250))}
                  rows={3}
                  placeholder="Documenting my journey. Growing every day."
                  className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm resize-none"
                />
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleResetProfile}
                  disabled={saving}
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl font-semibold text-sm bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" /> Reset
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Settings Navigation & Modules              */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-6">

          {/* Module Tabs Navigation */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-hide shadow-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    "flex-shrink-0 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap",
                    isActive
                      ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Module 1: Journey Summary */}
          {activeTab === 'journey' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/70 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                    <Compass className="w-6 h-6 text-purple-400" />
                    Your Journey Summary
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Real verified metrics from your personal growth records</p>
                </div>
                {statsLoading && <Loader className="w-4 h-4 animate-spin text-purple-400" />}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/50 border border-purple-500/20 flex flex-col items-center text-center">
                  <CheckSquare className="w-5 h-5 text-purple-400 mb-2" />
                  <span className="text-2xl font-extrabold text-white">{journeyStats?.total_checkins ?? 0}</span>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mt-1">Total Check-ins</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/50 border border-emerald-500/20 flex flex-col items-center text-center">
                  <Flame className="w-5 h-5 text-emerald-400 mb-2" />
                  <span className="text-2xl font-extrabold text-emerald-300">{journeyStats?.current_streak ?? 0}</span>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mt-1">Current Streak</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/50 border border-amber-500/20 flex flex-col items-center text-center">
                  <TrendingUp className="w-5 h-5 text-amber-400 mb-2" />
                  <span className="text-2xl font-extrabold text-amber-300">{journeyStats?.longest_streak ?? 0}</span>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mt-1">Longest Streak</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/50 border border-indigo-500/20 flex flex-col items-center text-center">
                  <Target className="w-5 h-5 text-indigo-400 mb-2" />
                  <span className="text-2xl font-extrabold text-indigo-300">{journeyStats?.goals_completed ?? 0}</span>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mt-1">Goals Achieved</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/50 border border-cyan-500/20 flex flex-col items-center text-center">
                  <Activity className="w-5 h-5 text-cyan-400 mb-2" />
                  <span className="text-2xl font-extrabold text-cyan-300">{journeyStats?.habits_tracked ?? 0}</span>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mt-1">Habits Tracked</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/50 border border-pink-500/20 flex flex-col items-center text-center">
                  <BookOpen className="w-5 h-5 text-pink-400 mb-2" />
                  <span className="text-2xl font-extrabold text-pink-300">{journeyStats?.journal_entries ?? 0}</span>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mt-1">Journals Logged</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/50 border border-yellow-500/20 flex flex-col items-center text-center">
                  <Award className="w-5 h-5 text-yellow-400 mb-2" />
                  <span className="text-2xl font-extrabold text-yellow-300">{journeyStats?.achievements_unlocked ?? 0}</span>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mt-1">Achievements</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/50 border border-rose-500/20 flex flex-col items-center text-center">
                  <HeartPulse className="w-5 h-5 text-rose-400 mb-2" />
                  <span className="text-2xl font-extrabold text-rose-300">{journeyStats?.life_score ?? '--'}</span>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mt-1">Life Score</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-white text-sm">Personal Growth Level {profile?.level || 1}</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    You have earned <span className="text-purple-300 font-bold">{Number(profile?.total_xp || 0).toLocaleString()} XP</span>. Keep checking in and finishing goals to level up!
                  </p>
                </div>
                <button
                  onClick={() => navigate('/analytics')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shrink-0 cursor-pointer"
                >
                  View Deep Analytics
                </button>
              </div>
            </motion.div>
          )}

          {/* Module 2: Personal Preferences */}
          {activeTab === 'preferences' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/70 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
            >
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                  <Globe className="w-6 h-6 text-purple-400" />
                  Personal Preferences
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Customize timezones, languages, and date formats</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-400" /> Timezone
                    </label>
                    <select
                      value={profile?.timezone || 'Asia/Kolkata'}
                      onChange={(e) => handleFieldChange('timezone', e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500 text-sm cursor-pointer"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST • UTC+05:30)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST • UTC+04:00)</option>
                      <option value="Asia/Singapore">Asia/Singapore (SGT • UTC+08:00)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST • UTC+09:00)</option>
                      <option value="Europe/London">Europe/London (GMT/BST • UTC+00:00)</option>
                      <option value="Europe/Paris">Europe/Paris (CET • UTC+01:00)</option>
                      <option value="America/New_York">America/New_York (EST • UTC-05:00)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST • UTC-08:00)</option>
                      <option value="Australia/Sydney">Australia/Sydney (AEST • UTC+10:00)</option>
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                    </select>
                    {detectedTimezone && (
                      <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                        Detected system timezone: <span className="text-purple-300">{detectedTimezone}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-purple-400" /> Preferred Language
                    </label>
                    <select
                      value={profile?.preferred_language || 'en'}
                      onChange={(e) => handleFieldChange('preferred_language', e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500 text-sm cursor-pointer"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi (हिंदी)</option>
                      <option value="mr">Marathi (मराठी)</option>
                      <option value="bn">Bengali (বাংলা)</option>
                      <option value="ta">Tamil (தமிழ்)</option>
                      <option value="te">Telugu (తెలుగు)</option>
                      <option value="gu">Gujarati (ગુજરાતી)</option>
                      <option value="kn">Kannada (ಕನ್ನಡ)</option>
                      <option value="ml">Malayalam (മലയാളം)</option>
                      <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
                      <option value="es">Spanish (Español)</option>
                      <option value="fr">French (Français)</option>
                      <option value="de">German (Deutsch)</option>
                      <option value="pt">Portuguese (Português)</option>
                      <option value="ja">Japanese (日本語)</option>
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1.5">Preferred language for personalized summaries.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" /> Date Format
                    </label>
                    <select
                      value={profile?.date_format || 'YYYY-MM-DD'}
                      onChange={(e) => handleFieldChange('date_format', e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500 text-sm cursor-pointer"
                    >
                      <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-08-31)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 31/08/2026)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/31/2026)</option>
                      <option value="DD MMM YYYY">DD MMM YYYY (e.g. 31 Aug 2026)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-400" /> Time Format
                    </label>
                    <select
                      value={profile?.time_format || '12h'}
                      onChange={(e) => handleFieldChange('time_format', e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500 text-sm cursor-pointer"
                    >
                      <option value="12h">12-hour (e.g. 08:30 PM)</option>
                      <option value="24h">24-hour (e.g. 20:30)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="py-2.5 px-5 rounded-xl font-semibold text-sm bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Preferences
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Module 3: AI & Journey Preferences */}
          {activeTab === 'ai' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/70 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
            >
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                  <Cpu className="w-6 h-6 text-purple-400" />
                  Journey & AI Preferences
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Control response tone, narrative depth, and priority focus areas</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Response Depth & Style
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'Concise', label: 'Concise', desc: 'Direct, bullet-focused insights' },
                      { id: 'Balanced', label: 'Balanced', desc: 'Moderate depth & context' },
                      { id: 'Detailed', label: 'Detailed', desc: 'Deep reflective breakdowns' },
                    ].map((st) => (
                      <div
                        key={st.id}
                        onClick={() => handleFieldChange('ai_style', st.id)}
                        className={clsx(
                          "p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between",
                          profile?.ai_style === st.id
                            ? "bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-950/50"
                            : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                        )}
                      >
                        <span className="font-bold text-sm text-purple-200">{st.label}</span>
                        <span className="text-xs text-slate-400 mt-1">{st.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Coaching Tone
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {['Gentle', 'Neutral', 'Motivational', 'Direct'].map((tone) => (
                      <div
                        key={tone}
                        onClick={() => handleFieldChange('ai_coaching', tone)}
                        className={clsx(
                          "p-3 rounded-xl border text-center cursor-pointer transition-all",
                          profile?.ai_coaching === tone
                            ? "bg-purple-600/20 border-purple-500 text-purple-200 font-bold shadow-sm"
                            : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                        )}
                      >
                        <span className="text-xs">{tone}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Growth Priority Focus Areas
                  </label>
                  <input
                    type="text"
                    value={profile?.ai_focus_areas || ''}
                    onChange={(e) => handleFieldChange('ai_focus_areas', e.target.value)}
                    placeholder="e.g., Deep Work, Health, Reading, Career Mastery"
                    className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">Comma-separated themes that Life Replay AI highlights in monthly reports.</p>
                </div>

                <div className="pt-3 border-t border-white/10 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="py-2.5 px-5 rounded-xl font-semibold text-sm bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save AI Settings
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Module 4: Privacy & Security */}
          {activeTab === 'privacy' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/70 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
            >
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                  <Shield className="w-6 h-6 text-purple-400" />
                  Privacy & Security
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Control data analysis boundaries and manage account password</p>
              </div>

              {/* Privacy Toggles */}
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 flex items-start justify-between gap-4">
                  <div>
                    <span className="font-semibold text-white text-sm block">Allow AI Analysis of Uploaded Documents</span>
                    <span className="text-xs text-slate-400 leading-relaxed block mt-0.5">
                      Enable document memory indexing for personalized query synthesis.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile?.privacy_analyze_documents ?? true}
                    onChange={(e) => handleFieldChange('privacy_analyze_documents', e.target.checked)}
                    className="w-5 h-5 accent-purple-600 rounded cursor-pointer mt-1"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 flex items-start justify-between gap-4">
                  <div>
                    <span className="font-semibold text-white text-sm block">Allow AI Reflection on Journal Entries</span>
                    <span className="text-xs text-slate-400 leading-relaxed block mt-0.5">
                      Allow emotional tone and growth reflection based on your daily reflections.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile?.privacy_analyze_journals ?? true}
                    onChange={(e) => handleFieldChange('privacy_analyze_journals', e.target.checked)}
                    className="w-5 h-5 accent-purple-600 rounded cursor-pointer mt-1"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 flex items-start justify-between gap-4">
                  <div>
                    <span className="font-semibold text-white text-sm block">Enable Mathematical Analytics & Correlations</span>
                    <span className="text-xs text-slate-400 leading-relaxed block mt-0.5">
                      Calculate Pearson correlation coefficients for sleep, focus, and productivity scores.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile?.privacy_enable_analytics ?? true}
                    onChange={(e) => handleFieldChange('privacy_enable_analytics', e.target.checked)}
                    className="w-5 h-5 accent-purple-600 rounded cursor-pointer mt-1"
                  />
                </div>
              </div>

              {/* Security & Sessions */}
              <div className="p-5 rounded-2xl bg-slate-950/50 border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-white text-sm">Account Password</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Protect your account with a secure password</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(true)}
                    className="py-2 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Lock className="w-3.5 h-3.5 text-purple-400" /> Change Password
                  </button>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Two-Factor Authentication (2FA)</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Coming Soon
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Active Web Session</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active Now
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="py-2.5 px-5 rounded-xl font-semibold text-sm bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Privacy Controls
                </button>
              </div>
            </motion.div>
          )}

          {/* Module 5: Notifications */}
          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/70 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
            >
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                  <Bell className="w-6 h-6 text-purple-400" />
                  Notification Preferences
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Toggle reminders and system updates for daily habits and milestones</p>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'notify_smart_alerts', title: 'Daily Check-in & Smart Alerts', desc: 'Alerts if a daily habit is at risk or check-in is pending' },
                  { key: 'notify_habit_reminders', title: 'Habit Schedule Reminders', desc: 'Timely reminders for recurring habit routines' },
                  { key: 'notify_goal_reminders', title: 'Goal Milestone Reminders', desc: 'Updates on target dates and active goal deadlines' },
                  { key: 'notify_achievements', title: 'Achievement & Gamification Alerts', desc: 'Celebrations when you earn badges, gain XP, or reach a streak' },
                  { key: 'notify_monthly_reports', title: 'Monthly Progress Summary', desc: 'Notification when your 30-day verified growth report is synthesized' }
                ].map((notif) => (
                  <div key={notif.key} className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 flex items-start justify-between gap-4">
                    <div>
                      <span className="font-semibold text-white text-sm block">{notif.title}</span>
                      <span className="text-xs text-slate-400 leading-relaxed block mt-0.5">{notif.desc}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile?.[notif.key] ?? true}
                      onChange={(e) => handleFieldChange(notif.key, e.target.checked)}
                      className="w-5 h-5 accent-purple-600 rounded cursor-pointer mt-1"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="py-2.5 px-5 rounded-xl font-semibold text-sm bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Notifications
                </button>
              </div>
            </motion.div>
          )}

          {/* Module 6: Data & Account */}
          {activeTab === 'account' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/70 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
            >
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                  <Layers className="w-6 h-6 text-purple-400" />
                  Data & Account
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Export personal archives or permanently delete account data</p>
              </div>

              {/* Export Data */}
              <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Download className="w-4 h-4 text-purple-400" /> Export My Data
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Download a structured JSON archive containing your check-ins, journal reflections, habits, goals, and achievements.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportData}
                    disabled={exporting}
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 transition-all flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    {exporting ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Export Data Archive
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-red-400 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Delete Account
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Permanently erase your account, daily logs, memories, XP, and growth statistics. This action is irreversible.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-red-600/80 hover:bg-red-600 text-white shadow-lg shadow-red-950/50 transition-all flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Account
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* ======================================================== */}
      {/* CHANGE PASSWORD MODAL                                     */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 relative"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-purple-400" />
                  Change Password
                </h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {passwordError && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs">
                  {passwordSuccess}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.current}
                      onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                      required
                      placeholder="Enter current password"
                      className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white pr-10 text-sm focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.new}
                      onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                      required
                      minLength={8}
                      placeholder="At least 8 characters"
                      className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white pr-10 text-sm focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordData.new && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Strength:</span>
                        <span className="font-semibold text-purple-300">{passwordStrength.label}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full ${passwordStrength.color} transition-all duration-300`} style={{ width: passwordStrength.width }} />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                      required
                      minLength={8}
                      placeholder="Re-enter new password"
                      className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white pr-10 text-sm focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {passwordSaving ? <Loader className="w-4 h-4 animate-spin" /> : null}
                    Update Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* DELETE ACCOUNT CONFIRMATION MODAL                         */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-red-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 relative"
            >
              <div className="flex items-center gap-3 text-red-400 border-b border-white/10 pb-4">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-lg font-bold text-white">Delete your account?</h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                This action is <span className="text-red-400 font-bold">permanent and irreversible</span>. All your check-ins, journal reflections, habits, goals, XP, and growth data will be immediately erased.
              </p>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Type <span className="text-white font-mono font-bold">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-slate-950/80 border border-red-500/40 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || deleting}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {deleting ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Confirm Permanent Deletion
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
