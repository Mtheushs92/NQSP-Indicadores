
import React, { useState, useEffect, useMemo } from 'react';
import { CalendarDays, User, X, Check, BarChart as BarChartIcon, Trophy, Loader2 } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';
import { SECTORS, MONTHS, GlobalFilters, PlanningRecord } from '../types';
import * as storage from '../services/storage';

interface PlanningProps {
  currentFilters: GlobalFilters;
}

export const Planning: React.FC<PlanningProps> = ({ currentFilters }) => {
  const [planningData, setPlanningData] = useState<PlanningRecord[]>([]);
  const [editingCell, setEditingCell] = useState<{ sector: string, month: number } | null>(null);
  const [tempName, setTempName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const data = await storage.loadPlanning();
      setPlanningData(data);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const getResponsible = (sector: string, month: number) => {
    const id = storage.generatePlanningId(sector, currentFilters.year, month);
    return planningData.find(r => r.id === id)?.responsible || '';
  };

  const handleCellClick = (sector: string, month: number) => {
    const currentName = getResponsible(sector, month);
    setTempName(currentName);
    setEditingCell({ sector, month });
  };

  const saveEdit = async () => {
    if (!editingCell) return;
    const id = storage.generatePlanningId(editingCell.sector, currentFilters.year, editingCell.month);
    const newRecord: PlanningRecord = {
      id,
      sector: editingCell.sector,
      year: currentFilters.year,
      month: editingCell.month,
      responsible: tempName
    };

    // Optimistic update
    setPlanningData(prev => {
      if (!tempName || tempName.trim() === '') {
        return prev.filter(r => r.id !== id);
      }
      const index = prev.findIndex(r => r.id === id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = newRecord;
        return updated;
      }
      return [...prev, newRecord];
    });

    await storage.upsertPlanning(newRecord);
    setEditingCell(null);
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setTempName('');
  };

  const productivityStats = useMemo(() => {
    const currentYearData = planningData.filter(r => r.year === currentFilters.year && r.responsible.trim() !== '');
    const totalAssignments = currentYearData.length;
    const counts: Record<string, number> = {};
    currentYearData.forEach(r => {
      const name = r.responsible.trim();
      counts[name] = (counts[name] || 0) + 1;
    });
    const ranking = Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalAssignments > 0 ? ((count / totalAssignments) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.count - a.count);
    return { ranking, totalAssignments };
  }, [planningData, currentFilters.year]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-sky-600" size={48} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8 animate-in fade-in pb-20 print:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6 print:hidden">
        <div className="flex items-center gap-3">
          <div className="bg-sky-100 p-2 rounded-lg"><CalendarDays className="text-sky-600" size={24} /></div>
          <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Planejamento Anual</h2>
            <p className="text-slate-500 text-lg">Responsabilidades ({currentFilters.year})</p>
          </div>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-slate-50 p-4 text-left font-bold text-slate-700 border-b border-r border-slate-200 min-w-[200px]">Setor</th>
                {MONTHS.map(m => <th key={m.value} className="bg-slate-50 p-2 text-center font-bold text-slate-600 border-b border-slate-200 min-w-[100px]">{m.label.substring(0, 3)}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SECTORS.map((sector) => (
                <tr key={sector} className="hover:bg-slate-50 group">
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 p-3 font-semibold text-slate-700 border-r border-slate-200 text-xs">{sector}</td>
                  {MONTHS.map((month) => {
                    const responsible = getResponsible(sector, month.value);
                    const isEditing = editingCell?.sector === sector && editingCell?.month === month.value;
                    return (
                      <td key={`${sector}-${month.value}`} className={`p-1 border-r border-slate-100 relative h-12 ${!isEditing ? 'cursor-pointer hover:bg-sky-50' : ''} ${responsible && !isEditing ? 'bg-sky-50/50' : ''}`} onClick={() => !isEditing && handleCellClick(sector, month.value)}>
                        {isEditing ? (
                          <div className="absolute inset-0 z-30 bg-white flex items-center p-1 shadow-lg ring-2 ring-sky-500 rounded-sm">
                            <input autoFocus className="w-full h-full px-2 text-xs outline-none bg-transparent text-slate-900 font-medium" value={tempName} onChange={(e) => setTempName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEdit()} />
                            <div className="flex items-center">
                              <button onClick={saveEdit} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"><Check size={14} /></button>
                              <button onClick={cancelEdit} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"><X size={14} /></button>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center">
                            {responsible ? <span className="text-[10px] font-medium text-sky-700 truncate w-full text-center">{responsible}</span> : <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 border-t border-slate-200">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productivityStats.ranking} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fill: '#475569', fontSize: 12 }} width={100}/>
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="count" name="Visitas" radius={[0, 4, 4, 0]} barSize={20}>
                  {productivityStats.ranking.map((_, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#0ea5e9' : '#94a3b8'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-y-auto max-h-64">
           <table className="w-full text-sm">
              <thead className="text-xs text-slate-400 uppercase border-b border-slate-100">
                <tr><th className="text-left py-2">Colaborador</th><th className="text-center py-2">Visitas</th><th className="text-right py-2">%</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {productivityStats.ranking.map((item, index) => (
                    <tr key={item.name} className="hover:bg-slate-50">
                      <td className="py-3 flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${index === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-400'}`}>{index + 1}</span>
                        <span className="font-medium text-slate-700">{item.name}</span>
                      </td>
                      <td className="py-3 text-center font-bold text-slate-800">{item.count}</td>
                      <td className="py-3 text-right text-slate-500 text-xs">{item.percentage}%</td>
                    </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
