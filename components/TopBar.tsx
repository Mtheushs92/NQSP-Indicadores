import React from 'react';
import { Filter, Calendar, Building2 } from 'lucide-react';
import { SECTORS, MONTHS, GlobalFilters } from '../types';

interface TopBarProps {
  filters: GlobalFilters;
  onFilterChange: (newFilters: GlobalFilters) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ filters, onFilterChange }) => {
  // Gera uma lista de anos de 2030 descendo até 2023
  // Isso permite planejamento futuro conforme solicitado
  const years = Array.from({ length: 2030 - 2023 + 1 }, (_, i) => 2030 - i);

  const handleChange = (key: keyof GlobalFilters, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-2 text-slate-700">
        <Filter size={20} className="text-sky-600" />
        <span className="font-semibold text-sm uppercase tracking-wide">Filtros Globais</span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Setor Selector */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-md border border-slate-200">
          <Building2 size={16} className="text-slate-400" />
          <select 
            className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none min-w-[200px]"
            value={filters.sector}
            onChange={(e) => handleChange('sector', e.target.value)}
          >
            {SECTORS.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-md border border-slate-200">
          <Calendar size={16} className="text-slate-400" />
          <select 
            className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
            value={filters.year}
            onChange={(e) => handleChange('year', Number(e.target.value))}
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-md border border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase">Mês Ref.</span>
          <select 
            className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
            value={filters.month}
            onChange={(e) => handleChange('month', Number(e.target.value))}
          >
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};