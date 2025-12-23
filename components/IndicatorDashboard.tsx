
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Save, AlertCircle, TrendingUp, CheckCircle2, Pencil, Download, Loader2 } from 'lucide-react';
import { GlobalFilters, MONTHS, IndicatorRecord, IndicatorConfig, GoalRecord } from '../types';
import * as storage from '../services/storage';

interface SectionProps {
  indicator: IndicatorConfig;
  filters: GlobalFilters;
  allRecords: IndicatorRecord[];
  allGoals: GoalRecord[];
  onRecordUpdate: (newRecord: IndicatorRecord) => Promise<void>;
  onGoalUpdate: (newGoal: GoalRecord) => Promise<void>;
}

const IndicatorSection: React.FC<SectionProps> = ({ 
  indicator, 
  filters, 
  allRecords, 
  allGoals,
  onRecordUpdate,
  onGoalUpdate
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const calculateScore = (num: number, den: number, config: IndicatorConfig): number | null => {
    if (config.type === 'count') return num;
    if (den === 0) return 0;
    if (config.type === 'percentage_fixed' || config.type === 'percentage_variable') {
      return Number(((num * 100) / den).toFixed(1));
    }
    if (config.type === 'rate_1000') {
      return Number(((num * 1000) / den).toFixed(2));
    }
    return 0;
  };

  const currentGoalValue = useMemo(() => {
    const goalId = storage.generateGoalId(filters.sector, filters.year, indicator.id);
    const savedGoal = allGoals.find(g => g.id === goalId);
    return savedGoal ? savedGoal.value : (indicator.defaultGoal ?? 0);
  }, [allGoals, filters.sector, filters.year, indicator]);

  const currentData = useMemo(() => {
    return MONTHS.map(m => {
      const recordId = storage.generateRecordId(filters.sector, filters.year, m.value, indicator.id);
      const record = allRecords.find(r => r.id === recordId);
      const defaultDenom = indicator.fixedDenominator || (indicator.type === 'rate_1000' ? 0 : 1);
      const num = record ? record.numerator : 0;
      const den = record ? record.denominator : defaultDenom;
      
      // Corrigido: usando apenas isIgnored conforme definido em types.ts
      const isIgnored = record?.isIgnored || false;
      
      return {
        month: m.value,
        monthName: m.label.substring(0, 3),
        numerator: num,
        denominator: den,
        observation: record ? record.observation : '',
        score: isIgnored ? null : calculateScore(num, den, indicator),
        isIgnored
      };
    });
  }, [allRecords, filters.sector, filters.year, indicator]);

  const handleInputChange = async (month: number, field: keyof IndicatorRecord, value: any) => {
    const recordId = storage.generateRecordId(filters.sector, filters.year, month, indicator.id);
    const existingRecord = allRecords.find(r => r.id === recordId);
    const defaultDenom = indicator.fixedDenominator || (indicator.type === 'rate_1000' ? 0 : 1);

    const newRecord: IndicatorRecord = {
      id: recordId,
      sector: filters.sector,
      year: filters.year,
      month: month,
      indicatorId: indicator.id,
      numerator: existingRecord ? existingRecord.numerator : 0,
      denominator: existingRecord ? existingRecord.denominator : defaultDenom,
      observation: existingRecord ? existingRecord.observation : '',
      isIgnored: existingRecord?.isIgnored || false,
      [field]: value
    };

    setIsUpdating(true);
    await onRecordUpdate(newRecord);
    setIsUpdating(false);
  };

  const handleGoalChange = async (val: string) => {
    const numVal = Number(val);
    const goalId = storage.generateGoalId(filters.sector, filters.year, indicator.id);
    const newGoal: GoalRecord = {
      id: goalId,
      sector: filters.sector,
      year: filters.year,
      indicatorId: indicator.id,
      value: numVal
    };
    await onGoalUpdate(newGoal);
  };

  const averageScore = useMemo(() => {
    const valid = currentData.filter(d => !d.isIgnored && d.score !== null);
    if (valid.length === 0) return 0;
    const sum = valid.reduce((acc, curr) => acc + (curr.score || 0), 0);
    if (indicator.type === 'count') return sum;
    const avg = sum / valid.length;
    return Number(avg.toFixed(indicator.type === 'rate_1000' ? 2 : 1));
  }, [currentData, indicator]);

  const isGoodScore = (score: number | null) => {
    if (score === null) return false;
    return indicator.isInverse ? score <= currentGoalValue : score >= currentGoalValue;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-10 print:break-inside-avoid relative">
      {isUpdating && <div className="absolute top-2 right-2 z-20"><Loader2 size={16} className="text-sky-500 animate-spin" /></div>}
      
      <div className="bg-slate-50 p-6 border-b border-slate-200">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              {indicator.name}
              {indicator.type === 'percentage_fixed' && (
                <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-bold border border-sky-200">
                  Amostra: {indicator.fixedDenominator}
                </span>
              )}
            </h3>
            <p className="text-slate-600 text-sm mt-1">{indicator.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 border-b border-slate-200">
        <div className="p-6 flex items-center gap-4">
          <div className="p-3 bg-sky-50 rounded-full text-sky-600"><TrendingUp size={24} /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Desempenho</p>
            <h3 className="text-2xl font-black text-slate-900">{averageScore}<span className="text-sm font-normal text-slate-400 ml-1">{indicator.unit}</span></h3>
          </div>
        </div>
        <div className="p-6 flex items-center gap-4 bg-amber-50/20">
          <div className="p-3 bg-amber-100 rounded-full text-amber-600"><AlertCircle size={24} /></div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Meta Anual</p>
            <div className="flex items-baseline gap-1">
              <input 
                type="number" 
                className="bg-white border-2 border-amber-300 text-slate-900 font-black text-xl rounded-lg px-3 py-1 w-28 focus:ring-4 focus:ring-amber-200 focus:border-amber-500 outline-none transition-all shadow-sm" 
                value={currentGoalValue} 
                onChange={(e) => handleGoalChange(e.target.value)} 
              />
              <span className="text-sm font-black text-slate-500">{indicator.unit}</span>
            </div>
          </div>
        </div>
        <div className="p-6 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-full text-emerald-600"><CheckCircle2 size={24} /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Acumulado</p>
            <h3 className="text-2xl font-black text-slate-900">{currentData.reduce((a, b) => a + b.numerator, 0)}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3">
        <div className="xl:col-span-2 p-6 border-b xl:border-b-0 xl:border-r border-slate-200">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 12, fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                <ReferenceLine y={currentGoalValue} stroke={indicator.isInverse ? "#ef4444" : "#f59e0b"} strokeDasharray="3 3" />
                <Line type="monotone" dataKey="score" stroke="#0284c7" strokeWidth={4} dot={{ r: 6, fill: '#0284c7', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 9 }} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-50 flex flex-col max-h-[500px] overflow-hidden print:hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-100 flex items-center justify-between">
            <span className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2"><Save size={14} /> Auditoria Mensal</span>
          </div>
          <div className="overflow-y-auto flex-1">
             <table className="w-full text-sm text-left border-collapse">
              <thead className="text-[10px] text-slate-500 uppercase bg-slate-100 sticky top-0 z-10 shadow-sm font-black tracking-tighter">
                <tr>
                  <th className="px-2 py-3 w-8 text-center">OK</th>
                  <th className="px-2 py-3">Mês</th>
                  <th className="px-2 py-3 text-center w-20">Num.</th>
                  {indicator.type !== 'count' && <th className="px-2 py-3 text-center w-20">Den.</th>}
                  <th className="px-2 py-3 text-right w-16">Res.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentData.map((row) => {
                  const isCurrentFilterMonth = row.month === filters.month;
                  return (
                    <React.Fragment key={row.month}>
                      <tr className={`${isCurrentFilterMonth ? 'bg-sky-50 ring-2 ring-inset ring-sky-200' : 'bg-white hover:bg-slate-50'} ${row.isIgnored ? 'opacity-40 grayscale' : ''} transition-all`}>
                        <td className="px-2 py-2 text-center">
                           <input type="checkbox" className="w-5 h-5 rounded-md text-sky-600 focus:ring-sky-500 cursor-pointer" checked={!row.isIgnored} onChange={(e) => handleInputChange(row.month, 'isIgnored', !e.target.checked)} />
                        </td>
                        <td className="px-2 py-3 font-black text-slate-900">{row.monthName}</td>
                        <td className="px-2 py-2">
                          <input 
                            type="number" 
                            min="0" 
                            disabled={row.isIgnored} 
                            className="w-full p-2 border-2 border-slate-200 rounded-lg text-center bg-white text-slate-900 font-black focus:ring-4 focus:ring-sky-100 focus:border-sky-500 outline-none transition-all" 
                            value={row.numerator || ''} 
                            onChange={(e) => handleInputChange(row.month, 'numerator', Number(e.target.value))} 
                          />
                        </td>
                        {indicator.type !== 'count' && (
                          <td className="px-2 py-2">
                             <input 
                              type="number" 
                              min="0" 
                              disabled={row.isIgnored} 
                              className="w-full p-2 border-2 border-slate-200 rounded-lg text-center bg-white text-slate-900 font-black focus:ring-4 focus:ring-sky-100 focus:border-sky-500 outline-none transition-all" 
                              value={row.denominator || ''} 
                              onChange={(e) => handleInputChange(row.month, 'denominator', Number(e.target.value))} 
                            />
                          </td>
                        )}
                        <td className={`px-2 py-3 text-right font-black text-base ${row.isIgnored ? 'text-slate-300' : isGoodScore(row.score) ? 'text-emerald-600' : 'text-amber-600'}`}>{row.score ?? '-'}</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DashboardProps {
  title: string;
  subtitle: string;
  indicators: IndicatorConfig[];
  filters: GlobalFilters;
}

export const IndicatorDashboard: React.FC<DashboardProps> = ({ title, subtitle, indicators, filters }) => {
  const [localRecords, setLocalRecords] = useState<IndicatorRecord[]>([]);
  const [localGoals, setLocalGoals] = useState<GoalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [records, goals] = await Promise.all([storage.loadRecords(), storage.loadGoals()]);
      setLocalRecords(records);
      setLocalGoals(goals);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRecordUpdate = async (rec: IndicatorRecord) => {
    setLocalRecords(prev => {
      const idx = prev.findIndex(r => r.id === rec.id);
      return idx >= 0 ? prev.map(r => r.id === rec.id ? rec : r) : [...prev, rec];
    });
    await storage.upsertRecord(rec);
  };

  const handleGoalUpdate = async (goal: GoalRecord) => {
    setLocalGoals(prev => {
      const idx = prev.findIndex(g => g.id === goal.id);
      return idx >= 0 ? prev.map(g => g.id === goal.id ? goal : g) : [...prev, goal];
    });
    await storage.upsertGoal(goal);
  };

  if (isLoading) return <div className="flex flex-col items-center justify-center h-96 gap-4 text-slate-500"><Loader2 className="animate-spin text-sky-600" size={48} /><p className="font-black text-slate-900 uppercase tracking-widest">Sincronizando Dados...</p></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 print:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-200 pb-6 print:hidden">
        <div><h2 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h2><p className="text-slate-500 text-lg font-medium">{subtitle}</p></div>
      </div>
      <div className="flex flex-col gap-10">
        {indicators.map((ind) => (
          <IndicatorSection key={ind.id} indicator={ind} filters={filters} allRecords={localRecords} allGoals={localGoals} onRecordUpdate={handleRecordUpdate} onGoalUpdate={handleGoalUpdate} />
        ))}
      </div>
    </div>
  );
};
