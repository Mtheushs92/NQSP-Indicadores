
import React, { useEffect, useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Printer, TrendingUp, TrendingDown, Minus, Loader2, X, FileText, CheckCircle2 } from 'lucide-react';
import { 
  PATIENT_IDENTIFICATION_INDICATORS, 
  SAFE_SURGERY_INDICATORS, 
  PRESSURE_INJURY_INDICATORS, 
  FALLS_INDICATORS 
} from '../data/indicators';
import { GlobalFilters, IndicatorRecord, IndicatorConfig, SECTORS } from '../types';
import * as storage from '../services/storage';

interface GlobalAnalyticsProps {
  currentFilters: GlobalFilters;
}

const AnalysisCard: React.FC<{ indicator: IndicatorConfig, data: any[], sector: string }> = ({ indicator, data, sector }) => {
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month));
  }, [data]);

  const lastPoint = sortedData[sortedData.length - 1];
  const prevPoint = sortedData[sortedData.length - 2];
  
  let trend = 'stable';
  if (lastPoint && prevPoint) {
    if (lastPoint.score > prevPoint.score) trend = 'up';
    if (lastPoint.score < prevPoint.score) trend = 'down';
  }

  const interpretation = useMemo(() => {
    if (sortedData.length === 0) return "Dados insuficientes.";
    const avg = (sortedData.reduce((acc, curr) => acc + curr.score, 0) / sortedData.length).toFixed(1);
    const goodTrend = indicator.isInverse ? trend === 'down' : trend === 'up';
    return `Média: ${avg}${indicator.unit}. Tendência de ${trend === 'up' ? 'alta' : 'queda'} (${goodTrend ? 'Positivo' : 'Atenção'}).`;
  }, [sortedData, trend, indicator]);

  if (sortedData.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 break-inside-avoid shadow-sm print:shadow-none print:border-slate-300">
      <div className="flex justify-between items-start mb-4">
        <div><h4 className="font-bold text-slate-900">{indicator.name}</h4><p className="text-[10px] text-slate-500 font-medium">{indicator.description}</p></div>
        <div className="flex items-center gap-1 text-sm font-black">
          {trend === 'up' && <TrendingUp size={16} className={indicator.isInverse ? "text-red-500" : "text-emerald-500"} />}
          {trend === 'down' && <TrendingDown size={16} className={indicator.isInverse ? "text-emerald-500" : "text-red-500"} />}
          <span>{lastPoint?.score}{indicator.unit}</span>
        </div>
      </div>
      <div className="h-44 w-full mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sortedData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{fontSize: 10, fontWeight: 'bold', fill: '#1e293b'}} />
            <YAxis tick={{fontSize: 10, fill: '#64748b'}} />
            <Line type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={3} dot={{r: 3, fill: '#0ea5e9'}} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-slate-50 p-2 rounded text-[11px] text-slate-800 font-medium italic border-l-4 border-sky-500 print:bg-transparent">
        <span className="font-black not-italic text-slate-900">Análise técnica: </span>{interpretation}
      </div>
    </div>
  );
};

export const GlobalAnalytics: React.FC<GlobalAnalyticsProps> = ({ currentFilters }) => {
  const [allRecords, setAllRecords] = useState<IndicatorRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [activeSector, setActiveSector] = useState(currentFilters.sector);
  const [printSections, setPrintSections] = useState({ identificacao: true, cirurgia: true, lpp: true, quedas: true });

  useEffect(() => {
    const fetchRecords = async () => {
      setIsLoading(true);
      try {
        const records = await storage.loadRecords();
        setAllRecords(records);
      } catch (err) { console.error(err); }
      setIsLoading(false);
    };
    fetchRecords();
  }, []);

  const getIndicatorData = (indicatorId: string, sector: string) => {
    const relevant = allRecords.filter(r => r.sector === sector && r.indicatorId === indicatorId && !r.isIgnored);
    const config = [...PATIENT_IDENTIFICATION_INDICATORS, ...SAFE_SURGERY_INDICATORS, ...PRESSURE_INJURY_INDICATORS, ...FALLS_INDICATORS].find(i => i.id === indicatorId);
    return relevant.map(r => {
        let score = 0;
        if (config?.type === 'count') score = r.numerator;
        else if (r.denominator > 0) score = Number(((r.numerator * (config?.type === 'rate_1000' ? 1000 : 100)) / r.denominator).toFixed(2));
        return { year: r.year, month: r.month, label: `${r.month}/${r.year}`, score };
    });
  };

  const handlePrint = () => {
    setShowPrintModal(false);
    setTimeout(() => { window.print(); }, 700);
  };

  if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-sky-600" size={48} /></div>;

  const sections = [
    { key: 'identificacao', title: "Identificação do Paciente", indicators: PATIENT_IDENTIFICATION_INDICATORS },
    { key: 'cirurgia', title: "Cirurgia Segura", indicators: SAFE_SURGERY_INDICATORS },
    { key: 'lpp', title: "Lesão por Pressão (LPP)", indicators: PRESSURE_INJURY_INDICATORS },
    { key: 'quedas', title: "Prevenção de Quedas", indicators: FALLS_INDICATORS }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-20 print:p-0">
      <style>{`
        @media print {
          body { background: white !important; font-family: sans-serif; }
          .print-title { display: block !important; margin-bottom: 2rem; border-bottom: 3px solid #0f172a; padding-bottom: 1rem; }
          .print\\:hidden { display: none !important; }
          section { page-break-after: always; margin-bottom: 3rem; }
          .grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 1.5rem !important; }
        }
      `}</style>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6 print:hidden">
        <div><h2 className="text-3xl font-black text-slate-900 tracking-tight">Painel de Performance Global</h2><p className="text-slate-600 font-medium">Análise de tendências para o setor: <span className="font-black text-sky-600 underline">{activeSector}</span></p></div>
        <button onClick={() => setShowPrintModal(true)} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 shadow-xl font-bold transition-all"><Printer size={18} /> Imprimir Relatórios</button>
      </div>

      <div className="hidden print-title">
        <h1 className="text-3xl font-black text-slate-900">Relatório Consolidado de Qualidade Hospitalar</h1>
        <div className="flex justify-between mt-4 font-bold text-slate-600">
          <span>Unidade: {activeSector}</span>
          <span>Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      <div className="space-y-12">
        {sections.map(section => (
          <section key={section.title} className={printSections[section.key as keyof typeof printSections] ? "" : "print:hidden"}>
            <h3 className="text-xl font-black text-slate-900 mb-6 bg-slate-100 p-3 rounded-lg print:bg-transparent print:p-0 print:border-b-2 print:border-slate-900 print:mb-8">{section.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {section.indicators.map(ind => {
                const data = getIndicatorData(ind.id, activeSector);
                return data.length > 0 ? <AnalysisCard key={ind.id} indicator={ind} data={data} sector={activeSector} /> : null;
              })}
            </div>
          </section>
        ))}
      </div>

      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3"><FileText className="text-sky-600" size={24} /><h3 className="font-black text-slate-900 text-lg">Configurar Relatório</h3></div>
              <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-slate-900"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Unidade / Setor</label>
                <select className="w-full border-2 border-slate-200 p-3 rounded-xl bg-white text-slate-900 font-bold focus:border-sky-500 outline-none" value={activeSector} onChange={(e) => setActiveSector(e.target.value)}>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Módulos de Auditoria</label>
                {Object.entries({identificacao: "Identificação do Paciente", cirurgia: "Protocolo de Cirurgia Segura", lpp: "Prevenção de LPP", quedas: "Protocolo de Quedas"}).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer font-bold text-slate-700 transition-colors">
                    <input type="checkbox" className="w-5 h-5 text-sky-600 rounded focus:ring-sky-500" checked={printSections[key as keyof typeof printSections]} onChange={(e) => setPrintSections({...printSections, [key]: e.target.checked})} /> {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t flex gap-3">
              <button onClick={() => setShowPrintModal(false)} className="flex-1 p-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-600">Cancelar</button>
              <button onClick={handlePrint} className="flex-1 p-3 bg-slate-900 text-white font-black rounded-xl shadow-lg hover:bg-black transition-all">GERAR RELATÓRIO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
