import React from 'react';
import { 
  PATIENT_IDENTIFICATION_INDICATORS, 
  SAFE_SURGERY_INDICATORS, 
  PRESSURE_INJURY_INDICATORS, 
  FALLS_INDICATORS 
} from '../data/indicators';
import { IndicatorConfig } from '../types';
import { BookOpen, Calculator, Target } from 'lucide-react';

const DefinitionCard: React.FC<{ indicator: IndicatorConfig, category: string }> = ({ indicator, category }) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded uppercase tracking-wider">
            {category}
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-2">{indicator.name}</h3>
        </div>
        {indicator.type === 'percentage_fixed' && (
          <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
            Amostra Fixa: {indicator.fixedDenominator}
          </div>
        )}
      </div>

      <p className="text-slate-600 text-sm mb-4 leading-relaxed">
        {indicator.description}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-start gap-2">
          <Calculator size={16} className="text-slate-400 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-700 block">Como Calcular:</span>
            <span className="text-slate-500">
              {indicator.type === 'count' ? 'Soma absoluta de ocorrências.' : 
               indicator.type === 'rate_1000' ? '(Numerador × 1000) ÷ Denominador' : 
               '(Numerador × 100) ÷ Denominador'}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Target size={16} className="text-slate-400 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-700 block">Interpretação:</span>
            <span className="text-slate-500">
              {indicator.isInverse 
                ? 'Quanto MENOR o resultado, MELHOR para a segurança do paciente.' 
                : 'Quanto MAIOR o resultado, MELHOR a adesão/qualidade.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Definitions: React.FC = () => {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in pb-20">
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-sky-100 p-2 rounded-lg">
            <BookOpen className="text-sky-600" size={24} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">Dicionário de Indicadores</h2>
        </div>
        <p className="text-slate-500 text-lg">
          Guia completo sobre as fórmulas, métodos de coleta e interpretação dos dados do sistema NQSP.
        </p>
      </div>

      <div className="space-y-10">
        <section>
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            Identificação do Paciente
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {PATIENT_IDENTIFICATION_INDICATORS.map(ind => (
              <DefinitionCard key={ind.id} indicator={ind} category="Identificação" />
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            Cirurgia Segura
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {SAFE_SURGERY_INDICATORS.map(ind => (
              <DefinitionCard key={ind.id} indicator={ind} category="Cirurgia" />
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            Lesão por Pressão (LPP)
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {PRESSURE_INJURY_INDICATORS.map(ind => (
              <DefinitionCard key={ind.id} indicator={ind} category="LPP" />
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            Prevenção de Quedas
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {FALLS_INDICATORS.map(ind => (
              <DefinitionCard key={ind.id} indicator={ind} category="Quedas" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};