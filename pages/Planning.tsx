
import React, { useState, useEffect, useMemo } from 'react';
import { CalendarDays, X, Check, Loader2, Trophy, UserPlus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SECTORS, MONTHS, GlobalFilters, PlanningRecord } from '../types';
import * as storage from '../services/storage';

interface PlanningProps {
  currentFilters: GlobalFilters;
}

// Cores vibrantes e profissionais para o ranking
const RANK_COLORS = [
  '#0284c7', '#059669', '#7c3aed', '#db2777', '#ea580c', 
  '#2563eb', '#16a34a', '#4f46e5', '#be185d', '#d97706'
];

export const Planning: React.FC<PlanningProps> = ({ currentFilters }) => {
  const [planningData, setPlanningData] = useState<PlanningRecord[]>([]);
  const [editingCell, setEditingCell] = useState<{ sector: string, month: number } | null>(null);
  const [tempName, setTempName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await storage.loadPlanning();
        setPlanningData(data);
      } catch (err) { console.error(err); }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const getResponsible = (sector: string, month: number) => {
    const id = storage.generatePlanningId(sector, currentFilters.year, month);
    return planningData.find(r => r.id === id)?.responsible || '';
  };

  const handleCellClick = (sector: string, month: number) => {
    setTempName(getResponsible(sector, month));
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
    
    setPlanningData(prev => !tempName.trim() 
      ? prev.filter(r => r.id !== id) 
      : (prev.find(r => r.id === id) ? prev.map(r => r.id === id ? newRecord : r) : [...prev, newRecord])
    );
    
    await storage.upsertPlanning(newRecord);
    setEditingCell(null);
  };

  const productivityStats = useMemo(() => {
    const yearData = planningData.filter(r => r.year === currentFilters.year && r.responsible.trim() !== '');
    const counts: Record<string, number> = {};
    yearData.forEach(r => {
      const name = r.responsible.trim();
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [planningData, currentFilters.year]);

  if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-sky-600" size={48} /></div>;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8 animate-in fade-in pb-20 print:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-6 print:hidden">
        <div className="flex items-center gap-3">
          <div className="bg-sky-100 p-2 rounded-lg"><CalendarDays className="text-sky-600" size={24} /></div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Escala de Responsabilidades</h2>
            <p className="text-slate-600 font-medium">Gestão de Auditorias NQSP - {currentFilters.year}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-x-auto relative">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-50 text-slate-900">
            <tr className="border-b border-slate-200">
              <th className="sticky left-0 bg-slate-50 p-4 text-left border-r border-slate-200 min-w-[220px] font-black uppercase text-xs tracking-wider z-10">Setores Hospitalares</th>
              {MONTHS.map(m => (
                <th key={m.value} className="p-2 border-b border-slate-200 font-black text-center uppercase text-[10px] tracking-widest min-w-[80px]">{m.label.substring(0, 3)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SECTORS.map(sector => (
              <tr key={sector} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                <td className="sticky left-0 bg-white font-bold p-3 border-r border-slate-200 text-xs text-slate-900 z-10">{sector}</td>
                {MONTHS.map(month => {
                  const resp = getResponsible(sector, month.value);
                  const isEditing = editingCell?.sector === sector && editingCell?.month === month.value;
                  return (
                    <td 
                      key={month.value} 
                      className={`p-1 border-r border-slate-50 h-16 relative text-center cursor-pointer transition-all ${resp ? 'bg-sky-50/60' : ''}`} 
                      onClick={() => !isEditing && handleCellClick(sector, month.value)}
                    >
                      {isEditing ? (
                        <div className="absolute inset-y-0 -inset-x-20 bg-white z-50 flex items-center p-2 shadow-[0_20px_50px_rgba(0,0,0,0.2)] ring-2 ring-sky-500 rounded-lg min-w-[300px]">
                          <div className="bg-sky-50 p-2 rounded-l-md text-sky-600">
                            <UserPlus size={18} />
                          </div>
                          <input 
                            autoFocus 
                            className="flex-1 h-full text-base outline-none text-slate-900 font-black px-4 bg-white" 
                            placeholder="Nome do Colaborador..."
                            value={tempName} 
                            onChange={(e) => setTempName(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()} 
                          />
                          <div className="flex gap-2 ml-2 pr-2">
                            <button onClick={saveEdit} title="Confirmar" className="p-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors shadow-md">
                              <Check size={20} />
                            </button>
                            <button onClick={() => setEditingCell(null)} title="Fechar" className="p-2.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors">
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center group">
                          <span className="text-[11px] font-black text-slate-900 truncate block px-1 leading-tight group-hover:text-sky-600">{resp}</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-8 border-t border-slate-200 print:hidden">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h4 className="font-black text-slate-900 text-lg flex items-center gap-2 uppercase tracking-tight">
              <Trophy className="text-amber-500" size={24} /> 
              Ranking de Atividades Realizadas
            </h4>
          </div>
          <div className="h-96 w-full">
            <ResponsiveContainer>
              <BarChart data={productivityStats} layout="vertical" margin={{ left: 40, right: 40 }}>
                <CartesianGrid horizontal={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={140} 
                  tick={{fill: '#0f172a', fontSize: 13, fontWeight: 'bold'}} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="count" 
                  radius={[0, 12, 12, 0]} 
                  barSize={45} // Barras bem robustas
                >
                  {productivityStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={RANK_COLORS[index % RANK_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
           <h4 className="font-black text-slate-900 text-sm mb-6 uppercase tracking-widest border-b border-slate-100 pb-3">Quadro de Auditores</h4>
           <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
             <table className="w-full text-sm">
                <thead className="border-b border-slate-50 text-[10px] uppercase text-slate-400 font-black tracking-widest sticky top-0 bg-white z-10">
                  <tr><th className="text-left py-2">Colaborador</th><th className="text-right py-2">Visitas</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {productivityStats.map((item, idx) => (
                    <tr key={item.name} className="hover:bg-slate-50 group">
                      <td className="py-4 font-bold text-slate-900 flex items-center gap-4">
                        <span 
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-lg transform group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: RANK_COLORS[idx % RANK_COLORS.length] }}
                        >
                          {idx + 1}
                        </span>
                        {item.name}
                      </td>
                      <td className="py-4 text-right">
                        <span className="font-black text-slate-900 bg-slate-100 group-hover:bg-sky-600 group-hover:text-white transition-all px-3 py-1.5 rounded-lg text-sm">
                          {item.count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
};
