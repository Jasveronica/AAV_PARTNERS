import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarCheck,
  FileSpreadsheet,
  CheckSquare,
  FileText,
  CalendarDays,
  TrendingUp,
  FileCheck,
  BarChart3,
  ShieldCheck,
  Settings,
  X,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, isManager, isEmployee } = useAuth();

  // Define navigation items with role visibility
  const navItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      to: isAdmin ? '/admin/dashboard' : isManager ? '/manager/dashboard' : '/employee/dashboard',
      roles: ['senior_admin', 'branch_manager', 'employee'],
    },
    {
      label: 'Branch Management',
      icon: Building2,
      to: '/branches',
      roles: ['senior_admin'],
    },
    {
      label: 'Employees',
      icon: Users,
      to: '/employees',
      roles: ['senior_admin', 'branch_manager'],
    },
    {
      label: 'Attendance',
      icon: CalendarCheck,
      to: '/attendance',
      roles: ['senior_admin', 'branch_manager', 'employee'],
    },
    {
      label: 'Daily Work Sheets',
      icon: FileSpreadsheet,
      to: '/work-sheets',
      roles: ['senior_admin', 'branch_manager', 'employee'],
    },
    {
      label: 'Task Management',
      icon: CheckSquare,
      to: '/tasks',
      roles: ['senior_admin', 'branch_manager', 'employee'],
    },
    {
      label: 'Document Tracking',
      icon: FileText,
      to: '/documents',
      roles: ['senior_admin', 'branch_manager', 'employee'],
    },
    {
      label: 'Leave Management',
      icon: CalendarDays,
      to: '/leaves',
      roles: ['senior_admin', 'branch_manager', 'employee'],
    },
    {
      label: 'Employee Performance',
      icon: TrendingUp,
      to: '/performance',
      roles: ['senior_admin', 'branch_manager', 'employee'],
    },
    {
      label: 'EOM Reports',
      icon: FileCheck,
      to: '/reports',
      roles: ['senior_admin', 'branch_manager'],
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      to: '/analytics',
      roles: ['senior_admin'],
    },
    {
      label: 'Activity Logs',
      icon: ShieldCheck,
      to: '/audit-logs',
      roles: ['senior_admin'],
    },
    {
      label: 'Settings',
      icon: Settings,
      to: '/settings',
      roles: ['senior_admin'],
    },
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-navy-900 text-white flex flex-col transition-transform duration-300 ease-in-out border-r border-navy-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-navy-800/80 bg-navy-950">
          <Logo size="sm" light={true} showTagline={false} />
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gold-400/80">
            {isAdmin ? 'Organisation Console' : isManager ? 'Branch Operations' : 'Associate Workspace'}
          </div>

          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-gold-400/15 text-gold-300 font-semibold border-l-4 border-gold-400 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800/70'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-gold-400' : 'text-slate-400 group-hover:text-gold-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-navy-800/80 bg-navy-950/60">
          <div className="px-2 py-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="font-mono text-gold-400 text-[10px]">AAV-ERP v1.0</span>
            <span className="text-[10px] bg-navy-800 px-1.5 py-0.5 rounded text-slate-300">
              {user?.branch?.code || 'HQ'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
