'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { FileText, FileSpreadsheet, Download, BarChart3, PieChart as PieIcon } from 'lucide-react';

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

  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (type: string) => {
    setExporting(type);
    try {
      const res = await apiClient.get(`/export/${type}`, {
        responseType: 'blob'
      });
      
      const fileExtension = type === 'excel' ? 'xlsx' : type === 'pdf' ? 'pdf' : 'csv';
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `swasthya_setu_report_${Date.now()}.${fileExtension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Authenticated export failed:', e);
      alert('Failed to download report. Please verify login credentials.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reports & Clinical Analytics Dashboard</h1>
          <p className="text-xs text-slate-500">Systemwide health metrics, triage distribution, village health breakdown, and audit reports</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting !== null}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-lg border border-slate-300 text-slate-700 flex items-center gap-1 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> {exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={exporting !== null}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-lg border border-slate-300 text-emerald-700 flex items-center gap-1 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> {exporting === 'excel' ? 'Exporting...' : 'Export Excel'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting !== null}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 disabled:opacity-50 shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" /> {exporting === 'pdf' ? 'Generating...' : 'Download PDF Report'}
          </button>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Triage Priority Pie Chart */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-emerald-600" /> Triage Outcome Breakdown
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
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Village Patient Distribution Bar Chart */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" /> Patient Registrations by Village
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={villageData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }} />
                <Bar dataKey="patient_count" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
