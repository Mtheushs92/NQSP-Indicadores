import React from 'react';
import { 
  Activity, 
  ClipboardCheck, 
  AlertTriangle, 
  UserMinus, 
  LayoutDashboard,
  BookOpen,
  PieChart,
  CalendarDays
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const menuItems = [
    { id: 'identificacao', label: 'Identificação do Paciente', icon: <ClipboardCheck size={20} /> },
    { id: 'cirurgia', label: 'Cirurgia Segura', icon: <Activity size={20} /> },
    { id: 'lpp', label: 'Lesão por Pressão', icon: <UserMinus size={20} /> },
    { id: 'quedas', label: 'Prevenção de Quedas', icon: <AlertTriangle size={20} /> },
  ];

  const secondaryItems = [
    { id: 'global', label: 'Visão Global & Relatórios', icon: <PieChart size={20} /> },
    { id: 'planning', label: 'Planejamento Anual', icon: <CalendarDays size={20} /> },
    { id: 'definitions', label: 'Dicionário de Indicadores', icon: <BookOpen size={20} /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 overflow-y-auto flex flex-col shadow-xl z-20 print:hidden">
      <div className="p-6 border-b border-slate-700 flex items-center gap-3">
        <div className="bg-sky-500 p-2 rounded-lg">
          <LayoutDashboard size={24} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">NQSP Monitor</h1>
          <p className="text-xs text-slate-400">Qualidade Hospitalar</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
          Módulos
        </div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
              currentPage === item.id 
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/50' 
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="shrink-0">
              {item.icon}
            </div>
            <span className="font-medium text-sm leading-tight">{item.label}</span>
          </button>
        ))}

        <div className="mt-8 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
          Análise & Ajuda
        </div>
        {secondaryItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
              currentPage === item.id 
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/50' 
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="shrink-0">
              {item.icon}
            </div>
            <span className="font-medium text-sm leading-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400">
          <p className="font-semibold text-slate-200 mb-1">Status do Sistema</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Online • v1.1.0
          </div>
        </div>
      </div>
    </aside>
  );
};