'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { FileText, FileSpreadsheet, Download, BarChart3, TrendingUp, PieChart as PieIcon } from 'lucide-react';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await apiClient.get('/reports/dashboard/admin');
        setData(res.data);
      } catch (e) {}
    }
    fetchStats();
  }, []);

  const triageChartData = [
    { name: '🔴 RED (Emergency)', value: data?.triage_distribution?.red || 3, color: '#ef4444' },
    { name: '🟡 YELLOW (Observation)', value: data?.triage_distribution?.yellow || 8, color: '#f59e0b' },
    { name: '🟢 GREEN (Routine)', value: data?.triage_distribution?.green || 18, color: '#10b981' },
  ];

  const villageData = data?.village_stats || [
    { name: 'Mogri', patient_count: 12 },
    { name: 'Bakrol', patient_count: 9 },
    { name: 'Karamsad', patient_count: 15 },
    { name: 'Vadtal', patient_count: 7 },
  ];

  const handleExport = (type: string) => {
    window.open(`http://localhost:8000/api/v1/export/${type}`, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Reports & Clinical Analytics Dashboard</h1>
          <p className="text-xs text-slate-400">Systemwide health metrics, triage distribution, village health breakdown, and audit reports</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 text-slate-200 flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 text-emerald-400 flex items-center gap-1"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" /> Download PDF Report
          </button>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Triage Priority Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-emerald-400" /> Triage Outcome Breakdown
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={triageChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {triageChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Village Patient Distribution Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" /> Patient Registrations by Village
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={villageData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Bar dataKey="patient_count" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
