
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Save, AlertCircle, TrendingUp, CheckCircle2, Info, Pencil, Ban, Download, Loader2, Database } from 'lucide-react';
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
      const isIgnored = record?.isIgnored === true;

      return {
        month: m.value,
        monthName: m.label.substring(0, 3),
        numerator: num,
        denominator: den,
        observation: record ? record.observation : '',
        score: isIgnored ? null : calculateScore(num, den, indicator),
        isRecorded: !!record,
        isIgnored: isIgnored
      };
    });
  }, [allRecords, filters.sector, filters.year, indicator]);

  const handleInputChange = async (month: number, field: keyof IndicatorRecord, value: string | number | boolean) => {
    const recordId = storage.generateRecordId(filters.sector, filters.year, month, indicator.id);
    const existingRecord = allRecords.find(r => r.id === recordId);
    
    let defaultDenom = indicator.fixedDenominator || 1;
    if (indicator.type === 'rate_1000' || indicator.type === 'percentage_variable') {
      defaultDenom = existingRecord?.denominator || 0;
    }

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

  const exportToCSV = () => {
    const headers = ['Ano', 'Mês', 'Numerador', 'Denominador', 'Resultado', 'Observação'];
    const rows = currentData.map(d => [filters.year, d.monthName, d.numerator, d.denominator, d.score ?? 'N/A', `"${d.observation}"`]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${indicator.id}_${filters.sector}_${filters.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const averageScore = useMemo(() => {
    const validMonths = currentData.filter(d => !d.isIgnored && d.score !== null && (d.isRecorded || d.numerator > 0));
    if (validMonths.length === 0) return 0;
    const sum = validMonths.reduce((acc, curr) => acc + (curr.score || 0), 0);
    if (indicator.type === 'count') return sum;
    return (sum / validMonths.length).toFixed(indicator.type === 'rate_1000' ? 2 : 1);
  }, [currentData, indicator]);

  const totalNumerator = useMemo(() => {
    const validMonths = currentData.filter(d => !d.isIgnored);
    return validMonths.reduce((acc, curr) => acc + curr.numerator, 0);
  }, [currentData]);

  const isGoodScore = (score: number | null) => {
    if (score === null) return false;
    if (indicator.isInverse) return score <= currentGoalValue;
    return score >= currentGoalValue;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-10 print:break-inside-avoid relative">
      {isUpdating && (
        <div className="absolute top-2 right-2 z-20">
          <Loader2 size={16} className="text-sky-500 animate-spin" />
        </div>
      )}
      {/* Indicator Header */}
      <div className="bg-slate-50 p-6 border-b border-slate-200">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {indicator.name}
              {indicator.type === 'percentage_fixed' && (
                <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-normal border border-sky-200">
                  Amostra Fixa (Sugerida): {indicator.fixedDenominator}
                </span>
              )}
            </h3>
            <p className="text-slate-500 text-sm mt-1">{indicator.description}</p>
          </div>
          <button onClick={exportToCSV} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors print:hidden">
            <Download size={14} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 border-b border-slate-200">
        <div className="p-6 flex items-center gap-4">
          <div className="p-3 bg-sky-50 rounded-full text-sky-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">
              {indicator.type === 'count' ? 'Total (Considerado)' : 'Média (Considerada)'}
            </p>
            <h3 className="text-2xl font-bold text-slate-800">
              {averageScore}
              <span className="text-sm font-normal text-slate-400 ml-1">{indicator.unit}</span>
            </h3>
          </div>
        </div>

        <div className="p-6 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">
              {indicator.type === 'count' ? 'Ocorrências' : 'Numerador Total'}
            </p>
            <h3 className="text-2xl font-bold text-slate-800">{totalNumerator}</h3>
          </div>
        </div>

        <div className="p-6 flex items-center gap-4 bg-amber-50/30">
          <div className="p-3 bg-amber-50 rounded-full text-amber-600">
            <AlertCircle size={24} />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-medium text-slate-500">Meta ({filters.year})</p>
              <Pencil size={12} className="text-slate-400 print:hidden" />
            </div>
            <div className="flex items-baseline gap-1">
              <input 
                type="number" 
                className="bg-white border border-amber-200 text-slate-800 font-bold text-xl rounded px-2 py-0.5 w-24 focus:ring-2 focus:ring-amber-400 outline-none print:border-none print:bg-transparent"
                value={currentGoalValue}
                onChange={(e) => handleGoalChange(e.target.value)}
              />
              <span className="text-sm font-normal text-slate-400">{indicator.unit}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3">
        <div className="xl:col-span-2 p-6 border-b xl:border-b-0 xl:border-r border-slate-200">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} formatter={(value: any) => [value, indicator.name]} labelStyle={{ color: '#64748b' }} />
                <ReferenceLine y={currentGoalValue} label="Meta" stroke={indicator.isInverse ? "#ef4444" : "#f59e0b"} strokeDasharray="3 3" />
                <Line type="monotone" dataKey="score" stroke="#0284c7" strokeWidth={3} dot={{ r: 4, fill: '#0284c7', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#0ea5e9' }} animationDuration={1000} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-50 flex flex-col max-h-[500px] overflow-hidden print:hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-100/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Save size={14} /> Dados Mensais
            </span>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
             <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs text-slate-500 uppercase bg-slate-100 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-2 py-2 w-8 text-center"></th>
                  <th className="px-2 py-2 font-semibold">Mês</th>
                  <th className="px-2 py-2 text-center w-20">{indicator.type === 'count' ? 'Qtd' : 'Num.'}</th>
                  {indicator.type !== 'count' && <th className="px-2 py-2 text-center w-20">{indicator.fixedDenominator ? 'Den.' : 'Den.'}</th>}
                  <th className="px-2 py-2 text-right w-16">{indicator.unit || 'Res.'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentData.map((row) => {
                  const isCurrentFilterMonth = row.month === filters.month;
                  const isDisabled = row.isIgnored;
                  const scoreColor = isGoodScore(row.score) ? 'text-emerald-600' : 'text-amber-600';
                  return (
                    <React.Fragment key={row.month}>
                      <tr className={`${isCurrentFilterMonth ? 'bg-sky-100/50' : 'bg-white hover:bg-slate-50'} ${isDisabled ? 'bg-slate-100 opacity-60' : ''}`}>
                        <td className="px-2 py-2 text-center border-r border-slate-100">
                           <input type="checkbox" className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer" checked={!row.isIgnored} onChange={(e) => handleInputChange(row.month, 'isIgnored', !e.target.checked)} />
                        </td>
                        <td className="px-2 py-3 font-medium text-slate-700 border-r border-transparent">{row.monthName}</td>
                        <td className="px-2 py-2 text-center">
                          <input type="number" min="0" disabled={isDisabled} className={`w-full p-1.5 border rounded text-center font-medium shadow-sm outline-none ${isDisabled ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-sky-500'}`} value={row.numerator || ''} onChange={(e) => handleInputChange(row.month, 'numerator', Number(e.target.value))} />
                        </td>
                        {indicator.type !== 'count' && (
                          <td className="px-2 py-2 text-center">
                             <input 
                               type="number" 
                               min="0" 
                               disabled={isDisabled} 
                               className={`w-full p-1.5 border rounded text-center font-medium shadow-sm outline-none ${isDisabled ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-sky-500'}`} 
                               value={row.denominator || ''} 
                               onChange={(e) => handleInputChange(row.month, 'denominator', Number(e.target.value))} 
                             />
                          </td>
                        )}
                        <td className={`px-2 py-3 text-right font-bold ${isDisabled ? 'text-slate-300' : scoreColor}`}>{row.score ?? '-'}</td>
                      </tr>
                      {!isDisabled && (
                        <tr className={`${isCurrentFilterMonth ? 'bg-sky-100/50' : 'bg-white'}`}>
                          <td colSpan={1}></td>
                          <td colSpan={indicator.type === 'count' ? 3 : 4} className="px-2 pb-2 pt-0">
                            <input type="text" className="w-full text-xs text-slate-600 bg-transparent border-b border-dashed border-slate-200 focus:border-sky-500 outline-none py-1" placeholder="Observação..." value={row.observation} onChange={(e) => handleInputChange(row.month, 'observation', e.target.value)} />
                          </td>
                        </tr>
                      )}
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
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [records, goals] = await Promise.all([
        storage.loadRecords(),
        storage.loadGoals()
      ]);
      setLocalRecords(records);
      setLocalGoals(goals);
    } catch (err: any) {
      console.error("Dashboard Load Error:", err);
      setError(err.message || "Erro desconhecido ao conectar com o banco de dados.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecordUpdate = async (newRecord: IndicatorRecord) => {
    // Optimistic update
    setLocalRecords(prev => {
      const index = prev.findIndex(r => r.id === newRecord.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = newRecord;
        return updated;
      }
      return [...prev, newRecord];
    });
    
    await storage.upsertRecord(newRecord);
  };

  const handleGoalUpdate = async (newGoal: GoalRecord) => {
    // Optimistic update
    setLocalGoals(prev => {
      const index = prev.findIndex(g => g.id === newGoal.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = newGoal;
        return updated;
      }
      return [...prev, newGoal];
    });

    await storage.upsertGoal(newGoal);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-slate-500">
        <Loader2 className="animate-spin text-sky-600" size={48} />
        <p className="animate-pulse">Carregando indicadores do Supabase...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600">
            <Database size={32} />
          </div>
          <h2 className="text-2xl font-bold text-red-800">Erro de Conexão</h2>
          <p className="text-red-600 max-w-md mx-auto">
            Não foi possível carregar os dados do banco de dados. Verifique se as tabelas foram criadas no Supabase ou se as chaves API são válidas.
          </p>
          <div className="text-xs bg-red-100/50 p-3 rounded font-mono text-red-500 break-all">
            Log: {error}
          </div>
          <button 
            onClick={fetchData}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 print:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-200 pb-6 print:hidden">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{title}</h2>
          <p className="text-slate-500 text-lg">{subtitle}</p>
        </div>
      </div>
      <div className="flex flex-col gap-10">
        {indicators.map((ind) => (
          <IndicatorSection key={ind.id} indicator={ind} filters={filters} allRecords={localRecords} allGoals={localGoals} onRecordUpdate={handleRecordUpdate} onGoalUpdate={handleGoalUpdate} />
        ))}
      </div>
    </div>
  );
};
