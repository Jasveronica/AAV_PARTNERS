import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  Search,
  User,
  LogOut,
  ChevronDown,
  Calendar,
  Building2,
  Check,
  Clock,
  CheckSquare,
  FileText,
  FileSpreadsheet,
  ChevronRight,
  Sparkles,
  Inbox
} from 'lucide-react';
import api from '../api/client';
import { format } from 'date-fns';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unread'
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  // Keep track of previous unread count and initial load state
  const prevUnreadRef = useRef(0);
  const isInitialRef = useRef(true);

  // Distinct pleasant audio chime for 3 roles: Senior Admin, Branch Manager, Legal Associate
  const playNotificationSound = (role) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      // Configure role-specific multi-tone chords:
      // Senior Admin: Crisp authoritative high chime (880Hz -> 1174Hz)
      // Branch Manager: Warm professional executive chime (587Hz -> 784Hz)
      // Legal Associate: Friendly pleasant bell chime (523Hz -> 659Hz)
      let note1 = 523.25; // C5 (Employee)
      let note2 = 659.25; // E5
      if (role === 'senior_admin') {
        note1 = 880.00; // A5
        note2 = 1174.66; // D6
      } else if (role === 'branch_manager') {
        note1 = 587.33; // D5
        note2 = 783.99; // G5
      }

      // First tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(note1, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Second harmonizing tone (staggered by 90ms)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(note2, now + 0.09);
      gain2.gain.setValueAtTime(0.28, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.45);
    } catch (e) {
      // AudioContext failed or blocked by autoplay policy
    }
  };

  const currentDateStr = format(new Date(), 'EEEE, dd MMMM yyyy');

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      const newNotifications = res.data.notifications || [];
      const newUnread = res.data.unread_count || 0;
      setNotifications(newNotifications);

      // Play role-specific sound when new unread notifications arrive
      if (!isInitialRef.current && newUnread > prevUnreadRef.current) {
        playNotificationSound(user?.role);
      }
      isInitialRef.current = false;
      setUnreadCount(newUnread);
      prevUnreadRef.current = newUnread;
    } catch (e) {
      // Ignore errors
    }
  };


  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // 10s poll for quick updates

    // Auto-refresh when tab gains focus
    const handleFocus = () => fetchNotifications();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('notifications:refresh', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('notifications:refresh', handleFocus);
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const markSingleAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  // Map any legacy or specific notification links to the correct canonical frontend route
  const resolveNotificationRoute = (n) => {
    let link = n.link || '';
    if (!link || link === '/') {
      switch (n.type) {
        case 'leave':
          return '/leaves';
        case 'task':
          return '/tasks';
        case 'attendance':
          return '/attendance';
        case 'document':
          return '/documents';
        case 'work_sheet':
        case 'worksheet':
          return '/work-sheets';
        case 'eom_report':
          return '/reports';
        case 'branch':
          return '/branches';
        default:
          return user?.role === 'senior_admin'
            ? '/admin/dashboard'
            : user?.role === 'branch_manager'
            ? '/manager/dashboard'
            : '/employee/dashboard';
      }
    }

    // Normalize any sub-prefixed routes (e.g. /manager/leaves -> /leaves)
    if (link.includes('/leaves')) return '/leaves';
    if (link.includes('/tasks')) return '/tasks';
    if (link.includes('/attendance')) return '/attendance';
    if (link.includes('/worksheets') || link.includes('/work-sheets')) return '/work-sheets';
    if (link.includes('/documents')) return '/documents';
    if (link.includes('/reports')) return '/reports';
    if (link.includes('/branches')) return '/branches';
    if (link.includes('/employees')) return '/employees';
    if (link.includes('/performance')) return '/performance';

    return link;
  };

  const handleNotificationClick = async (n) => {
    // 1. Mark as read on the backend
    if (!n.is_read) {
      api.post(`/notifications/${n.id}/read`).catch(() => {});
      setNotifications(prev =>
        prev.map(item => (item.id === n.id ? { ...item, is_read: true } : item))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // 2. Close notification popover
    setShowNotifications(false);

    // 3. Navigate to corresponding operational page
    const destination = resolveNotificationRoute(n);
    navigate(destination);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'leave':
        return (
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Calendar className="w-3.5 h-3.5" />
          </div>
        );
      case 'task':
        return (
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <CheckSquare className="w-3.5 h-3.5" />
          </div>
        );
      case 'attendance':
        return (
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
        );
      case 'document':
        return (
          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
        );
      case 'eom_report':
        return (
          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-3.5 h-3.5" />
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-lg bg-gold-100 text-gold-800 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'senior_admin':
        return <span className="bg-gold-100 text-gold-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-gold-300">Senior Admin</span>;
      case 'branch_manager':
        return <span className="bg-navy-100 text-navy-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-navy-200">Branch Manager</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200">Legal Associate</span>;
    }
  };

  const filteredNotifications = activeFilter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 shadow-subtle px-4 lg:px-8 py-2.5 flex items-center justify-between">
      {/* Left: Mobile hamburger & Date indicator */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-navy-900 hover:bg-slate-100 focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80">
          <Calendar className="w-3.5 h-3.5 text-gold-500" />
          <span className="font-medium text-slate-700">{currentDateStr}</span>
        </div>

        {user?.branch && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-navy-800 bg-gold-50/60 px-3 py-1.5 rounded-lg border border-gold-200">
            <Building2 className="w-3.5 h-3.5 text-gold-600" />
            <span className="font-semibold">{user.branch.name}</span>
            <span className="text-[10px] bg-gold-200/70 text-navy-900 px-1.5 py-0.2 rounded font-mono font-bold">
              {user.branch.code}
            </span>
          </div>
        )}
      </div>

      {/* Right Controls: Search, Notifications, User Menu */}
      <div className="flex items-center gap-3">
        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-colors focus:outline-none"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md ring-2 ring-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-[420px] bg-white rounded-xl shadow-elevated border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              {/* Header */}
              <div className="p-3.5 bg-navy-900 text-white flex items-center justify-between border-b border-navy-800">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm font-serif">Notifications</span>
                  {unreadCount > 0 ? (
                    <span className="bg-gold-400 text-navy-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  ) : (
                    <span className="bg-navy-800 text-slate-300 text-[10px] font-medium px-2 py-0.5 rounded-full">
                      Up to date
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-gold-300 hover:text-white transition-colors flex items-center gap-1 font-medium"
                  >
                    <Check className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1.5 bg-slate-100/80 border-b border-slate-200 text-xs">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`flex-1 py-1 px-2.5 rounded-md text-center font-medium transition-colors ${
                    activeFilter === 'all'
                      ? 'bg-white text-navy-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-navy-900'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveFilter('unread')}
                  className={`flex-1 py-1 px-2.5 rounded-md text-center font-medium transition-colors ${
                    activeFilter === 'unread'
                      ? 'bg-white text-navy-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-navy-900'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {/* Notifications List */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                {filteredNotifications.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <Inbox className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
                    <span>No {activeFilter === 'unread' ? 'unread ' : ''}notifications</span>
                  </div>
                ) : (
                  filteredNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`group p-3.5 text-xs transition-all cursor-pointer flex items-start gap-3 relative ${
                        !n.is_read
                          ? 'bg-amber-50/40 hover:bg-amber-50/80'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Left Type Icon */}
                      {getTypeIcon(n.type)}

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 group-hover:text-navy-900 transition-colors truncate">
                            {n.title}
                          </span>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-gold-500 shrink-0" />
                          )}
                        </div>

                        <p className="text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>

                        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                          <div className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{format(new Date(n.created_at), 'dd MMM, HH:mm')}</span>
                          </div>
                          <span className="text-gold-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                            Open matter <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>

                      {/* Quick mark as read button on hover */}
                      {!n.is_read && (
                        <button
                          onClick={(e) => markSingleAsRead(e, n.id)}
                          title="Mark as read"
                          className="absolute top-3.5 right-3 p-1 rounded-md text-slate-400 hover:text-navy-900 hover:bg-white/80 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer hint */}
              <div className="p-2 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
                Click any notification to navigate directly to its matter.
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-navy-900 border border-gold-400 text-white font-semibold text-xs flex items-center justify-center shadow-sm">
              {user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-navy-900 line-clamp-1">{user?.name}</div>
              <div className="text-[10px] text-slate-500">{user?.employee_id_code || user?.email}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-elevated border border-slate-200 overflow-hidden z-50">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <div className="font-semibold text-sm text-navy-900">{user?.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{user?.email}</div>
                <div className="mt-2.5 flex items-center gap-2">
                  {getRoleBadge(user?.role)}
                  {user?.employee?.employee_id && (
                    <span className="text-[10px] font-mono text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      {user.employee.employee_id}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out of Platform
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
