import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { IndicatorDashboard } from './components/IndicatorDashboard';
import { Definitions } from './pages/Definitions';
import { GlobalAnalytics } from './pages/GlobalAnalytics';
import { Planning } from './pages/Planning';
import { GlobalFilters } from './types';
import { 
  PATIENT_IDENTIFICATION_INDICATORS, 
  SAFE_SURGERY_INDICATORS, 
  PRESSURE_INJURY_INDICATORS, 
  FALLS_INDICATORS 
} from './data/indicators';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('identificacao');
  
  const [filters, setFilters] = useState<GlobalFilters>({
    sector: 'UTI Geral',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });

  const renderContent = () => {
    switch (currentPage) {
      case 'identificacao':
        return (
          <IndicatorDashboard 
            title="Identificação do Paciente"
            subtitle="Monitoramento da meta de segurança internacional Nº 1"
            indicators={PATIENT_IDENTIFICATION_INDICATORS}
            filters={filters}
          />
        );
      case 'cirurgia':
        return (
          <IndicatorDashboard 
            title="Cirurgia Segura"
            subtitle="Monitoramento do Protocolo de Cirurgia Segura (LVCS)"
            indicators={SAFE_SURGERY_INDICATORS}
            filters={filters}
          />
        );
      case 'lpp':
        return (
          <IndicatorDashboard 
            title="Lesão por Pressão"
            subtitle="Prevenção e Gerenciamento de LPP"
            indicators={PRESSURE_INJURY_INDICATORS}
            filters={filters}
          />
        );
      case 'quedas':
        return (
          <IndicatorDashboard 
            title="Prevenção de Quedas"
            subtitle="Indicadores de risco e incidência de quedas"
            indicators={FALLS_INDICATORS}
            filters={filters}
          />
        );
      case 'definitions':
        return <Definitions />;
      case 'global':
        return <GlobalAnalytics currentFilters={filters} />;
      case 'planning':
        return <Planning currentFilters={filters} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 print:bg-white print:h-auto">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
      />
      
      <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden print:ml-0 print:h-auto print:overflow-visible">
        <div className="print:hidden">
          <TopBar 
            filters={filters} 
            onFilterChange={setFilters} 
          />
        </div>
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden print:overflow-visible">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;