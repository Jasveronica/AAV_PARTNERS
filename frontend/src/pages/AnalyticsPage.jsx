import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Shield,
  Calendar,
  Building2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

export const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/admin').then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  const categoryWorkload = [
    { name: 'Drafting & Pleadings', hours: 84, color: '#172D43' },
    { name: 'Case Law Precedents', hours: 56, color: '#243B53' },
    { name: 'Title Scrutiny', hours: 42, color: '#C5A36B' },
    { name: 'Court Appearances', hours: 38, color: '#168653' },
    { name: 'Client Conferences', hours: 25, color: '#D69E36' },
  ];

  const monthlyTrend = [
    { month: 'Jun', tasks: 18, docs: 12 },
    { month: 'Jul', tasks: 22, docs: 15 },
    { month: 'Aug', tasks: 25, docs: 18 },
    { month: 'Sep', tasks: 21, docs: 16 },
    { month: 'Oct', tasks: 24, docs: 18 },
    { month: 'Nov', tasks: 28, docs: 21 },
  ];

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold font-serif text-navy-900">Firm-Wide Legal Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">
          Aggregated practice area distributions, productivity trends, and capacity utilization across chambers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Practice Area Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 font-serif">
                Legal Workload by Practice Category
              </h2>
              <p className="text-xs text-slate-500">Cumulative billable hours by legal activity</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryWorkload} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" unit="h" tick={{ fontSize: 11, fill: '#627D98' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#172D43', fontWeight: 500 }} width={120} />
                <Tooltip
                  formatter={(val) => [`${val} hours`, 'Time Spent']}
                  contentStyle={{ backgroundColor: '#172D43', color: '#FFFFFF', borderRadius: '8px', border: '1px solid #243B53', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}
                  itemStyle={{ color: '#FFFFFF', fontWeight: 600 }}
                  labelStyle={{ color: '#C5A36B', fontWeight: 'bold' }}
                />
                <Bar dataKey="hours" fill="#172D43" radius={[0, 4, 4, 0]}>
                  {categoryWorkload.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Six Month Output Trajectory */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 font-serif">
                Monthly Deliverables Trajectory
              </h2>
              <p className="text-xs text-slate-500">6-Month progression of tasks & legal documentation</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#172D43" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#172D43" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C5A36B" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#C5A36B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#627D98' }} />
                <YAxis tick={{ fontSize: 11, fill: '#627D98' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#172D43', color: '#FFFFFF', borderRadius: '8px', border: '1px solid #243B53', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}
                  itemStyle={{ color: '#FFFFFF', fontWeight: 600 }}
                  labelStyle={{ color: '#C5A36B', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="tasks" name="Tasks Finalized" stroke="#172D43" fillOpacity={1} fill="url(#colorTasks)" />
                <Area type="monotone" dataKey="docs" name="Documents Executed" stroke="#C5A36B" fillOpacity={1} fill="url(#colorDocs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
