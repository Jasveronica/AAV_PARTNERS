import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm' }) => {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  const variantMap = {
    // Attendance & Success
    Present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',

    // Warnings & Late
    Late: 'bg-amber-50 text-amber-700 border-amber-200',
    'Half Day': 'bg-amber-50 text-amber-700 border-amber-200',
    'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
    IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
    Assigned: 'bg-slate-100 text-slate-700 border-slate-300',
    ASSIGNED: 'bg-slate-100 text-slate-700 border-slate-300',
    'Submitted for Review': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Submitted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    SUBMITTED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Manager Review': 'bg-purple-50 text-purple-700 border-purple-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Draft: 'bg-slate-100 text-slate-600 border-slate-200',
    draft: 'bg-slate-100 text-slate-600 border-slate-200',

    // Priorities
    Low: 'bg-slate-100 text-slate-600 border-slate-200',
    Medium: 'bg-blue-50 text-blue-700 border-blue-200',
    High: 'bg-amber-50 text-amber-700 border-amber-200',
    Urgent: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',

    // Danger & Absences
    Absent: 'bg-rose-50 text-rose-700 border-rose-200',
    Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    'Rejected / Needs Revision': 'bg-rose-50 text-rose-700 border-rose-200',
    NEEDS_REVISION: 'bg-rose-50 text-rose-700 border-rose-200',
    correction_requested: 'bg-rose-50 text-rose-700 border-rose-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    cancelled: 'bg-slate-100 text-slate-500 border-slate-200',

    // Neutral / Leave
    'Approved Leave': 'bg-teal-50 text-teal-700 border-teal-200',
    'Weekly Off': 'bg-slate-100 text-slate-500 border-slate-200',
    Holiday: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    default: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const styleClass = variantMap[variant] || variantMap.default;

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full border ${sizeClasses[size]} ${styleClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      {children}
    </span>
  );
};
