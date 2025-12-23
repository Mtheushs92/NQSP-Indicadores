
import React, { useEffect, useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
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
    return [...data].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }, [data]);

  const lastPoint = sortedData[sortedData.length - 1];
  const prevPoint = sortedData[sortedData.length - 2];
  
  let trend = 'stable';
  if (lastPoint && prevPoint) {
    if (lastPoint.score > prevPoint.score) trend = 'up';
    if (lastPoint.score < prevPoint.score) trend = 'down';
  }

  const interpretation = useMemo(() => {
    if (sortedData.length === 0) return "Sem dados suficientes para análise.";
    const avg = (sortedData.reduce((acc, curr) => acc + curr.score, 0) / sortedData.length).toFixed(1);
    const goodTrend = indicator.isInverse ? trend === 'down' : trend === 'up';
    let text = `Média histórica de ${avg}${indicator.unit}. `;
    if (trend !== 'stable') {
      text += `A tendência atual é de ${trend === 'up' ? 'alta' : 'queda'}, o que é considerado ${goodTrend ? 'positivo' : 'um ponto de atenção'}.`;
    } else {
      text += "O indicador apresenta estabilidade nos últimos períodos.";
    }
    return text;
  }, [sortedData, trend, indicator]);

  if (sortedData.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 break-inside-avoid shadow-sm print:shadow-none print:border-slate-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-bold text-slate-800">{indicator.name}</h4>
          <p className="text-xs text-slate-500">{indicator.description}</p>
        </div>
        <div className="flex items-center gap-1 text-sm font-bold">
          {trend === 'up' && <TrendingUp size={16} className={indicator.isInverse ? "text-red-500" : "text-emerald-500"} />}
          {trend === 'down' && <TrendingDown size={16} className={indicator.isInverse ? "text-emerald-500" : "text-red-500"} />}
          {trend === 'stable' && <Minus size={16} className="text-slate-400" />}
          <span>{lastPoint?.score}{indicator.unit}</span>
        </div>
      </div>
      <div className="h-48 w-full mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sortedData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{fontSize: 10}} interval="preserveStartEnd" />
            <YAxis tick={{fontSize: 10}} domain={[0, 'auto']} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={2} dot={{r: 2}} name={indicator.unit || "Valor"} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-slate-50 p-3 rounded text-sm text-slate-700 italic border-l-4 border-sky-400 print:bg-transparent print:p-0 print:text-xs">
        <span className="font-bold not-italic">Análise: </span>{interpretation}
      </div>
    </div>
  );
};

export const GlobalAnalytics: React.FC<GlobalAnalyticsProps> = ({ currentFilters }) => {
  const [allRecords, setAllRecords] = useState<IndicatorRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  // Opções de Filtro Local (Sincronizado com o que será impresso)
  const [activeSector, setActiveSector] = useState(currentFilters.sector);
  const [printSections, setPrintSections] = useState({
    identificacao: true,
    cirurgia: true,
    lpp: true,
    quedas: true
  });

  // Atualizar setor ativo quando os filtros globais mudarem externamente
  useEffect(() => {
    setActiveSector(currentFilters.sector);
  }, [currentFilters.sector]);

  useEffect(() => {
    const fetchRecords = async () => {
      setIsLoading(true);
      const records = await storage.loadRecords();
      setAllRecords(records);
      setIsLoading(false);
    };
    fetchRecords();
  }, []);

  const getIndicatorData = (indicatorId: string, sector: string) => {
    const relevantRecords = allRecords.filter(r => r.sector === sector && r.indicatorId === indicatorId && !r.isIgnored);
    return relevantRecords.map(r => {
        let score = 0;
        const indConfig = [...PATIENT_IDENTIFICATION_INDICATORS, ...SAFE_SURGERY_INDICATORS, ...PRESSURE_INJURY_INDICATORS, ...FALLS_INDICATORS].find(i => i.id === indicatorId);
        if (indConfig) {
             if (indConfig.type === 'count') score = r.numerator;
             else if (r.denominator > 0) {
                 const factor = indConfig.type === 'rate_1000' ? 1000 : 100;
                 score = Number(((r.numerator * factor) / r.denominator).toFixed(2));
             }
        }
        return { year: r.year, month: r.month, label: `${r.month}/${r.year}`, score: score };
    });
  };

  const handlePrint = () => {
    setShowPrintModal(false);
    // Pequeno delay para garantir que o modal fechou e a UI atualizou antes do print dialog
    setTimeout(() => {
      window.print();
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-sky-600" size={48} />
      </div>
    );
  }

  const sections = [
    { key: 'identificacao', title: "Identificação do Paciente", indicators: PATIENT_IDENTIFICATION_INDICATORS },
    { key: 'cirurgia', title: "Cirurgia Segura", indicators: SAFE_SURGERY_INDICATORS },
    { key: 'lpp', title: "Lesão por Pressão (LPP)", indicators: PRESSURE_INJURY_INDICATORS },
    { key: 'quedas', title: "Prevenção de Quedas", indicators: FALLS_INDICATORS }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-20 print:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6 print:hidden">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Visão Global & Relatórios</h2>
          <p className="text-slate-500 text-lg">Análise histórica para: <span className="font-bold text-sky-600">{activeSector}</span></p>
        </div>
        <button 
          onClick={() => setShowPrintModal(true)} 
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors shadow-lg"
        >
          <Printer size={18} /> Imprimir Relatório
        </button>
      </div>

      {/* Título Visível Apenas no Print */}
      <div className="hidden print:block mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Relatório de Qualidade Hospitalar</h1>
        <p className="text-slate-600">Setor: <span className="font-bold">{activeSector}</span> | Data: {new Date().toLocaleDateString('pt-BR')}</p>
        <hr className="mt-4 border-slate-300" />
      </div>

      <div className="space-y-12">
        {sections.map(section => {
          const isVisible = printSections[section.key as keyof typeof printSections];
          
          return (
            <section key={section.title} className={isVisible ? "" : "print:hidden"}>
              <h3 className="text-xl font-bold text-slate-900 mb-4 bg-slate-100 p-2 rounded print:bg-transparent print:p-0 print:border-b print:border-slate-200">
                {section.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
                {section.indicators.map(ind => {
                  const data = getIndicatorData(ind.id, activeSector);
                  if (data.length === 0) return null;
                  return (
                    <AnalysisCard key={ind.id} indicator={ind} data={data} sector={activeSector} />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* MODAL DE IMPRESSÃO */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="text-sky-600" size={20} />
                <h3 className="font-bold text-slate-800 text-lg">Configurar Relatório</h3>
              </div>
              <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Setor */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Setor para o Relatório</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                  value={activeSector}
                  onChange={(e) => setActiveSector(e.target.value)}
                >
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <p className="text-[10px] text-slate-400 italic">Mudar o setor aqui atualizará os gráficos ao fundo.</p>
              </div>

              {/* Seções */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Módulos para Incluir</label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries({
                    identificacao: "Identificação do Paciente",
                    cirurgia: "Cirurgia Segura",
                    lpp: "Lesão por Pressão",
                    quedas: "Prevenção de Quedas"
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200 group">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                        checked={printSections[key as keyof typeof printSections]}
                        onChange={(e) => setPrintSections({...printSections, [key]: e.target.checked})}
                      />
                      <span className="text-sm font-medium text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setShowPrintModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handlePrint}
                className="flex-1 px-4 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} />
                Gerar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
