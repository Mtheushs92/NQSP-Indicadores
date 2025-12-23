
export interface GlobalFilters {
  sector: string;
  year: number;
  month: number;
}

export interface IndicatorRecord {
  id: string; // unique composite key: sector-year-month-indicatorId
  sector: string;
  year: number;
  month: number;
  indicatorId: string;
  numerator: number; // e.g., Conformidades, Eventos, Quedas
  denominator: number; // e.g., Total, Pacientes-Dia (can be 1 or 17 fixed)
  observation: string;
  isIgnored?: boolean; // New field: if true, excludes from stats
}

export interface GoalRecord {
  id: string; // sector-year-indicatorId
  sector: string;
  year: number;
  indicatorId: string;
  value: number;
}

export interface PlanningRecord {
  id: string; // unique key: sector-year-month
  sector: string;
  year: number;
  month: number;
  responsible: string; // Name of person responsible
}

export type IndicatorType = 'percentage_fixed' | 'percentage_variable' | 'count' | 'rate_1000';

export interface IndicatorConfig {
  id: string;
  name: string;
  description: string;
  type: IndicatorType;
  fixedDenominator?: number; // e.g., 17 for sampling
  defaultGoal?: number; // Fallback if no specific goal is set
  isInverse?: boolean; // If true, lower is better (e.g. falls, adverse events)
  unit?: string; // %, ‰, or empty
}

export const SECTORS = [
  "Clínica Médica",
  "Clínica Cirúrgica",
  "UTI Geral",
  "UTI Cardio",
  "UTI Neonatal",
  "UTI Pediátrica",
  "Pediatria",
  "Maternidade",
  "Centro Cirúrgico",
  "Centro Obstétrico",
  "Hemodinâmica",
  "Emergência",
  "Ambulatório",
  "Oncologia",
  "Diálise",
  "Endoscopia",
  "Diagnóstico por Imagem",
  "Laboratório",
  "Farmácia",
  "Nutrição",
  "Banco de Sangue",
  "Radioterapia"
];

export const MONTHS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];
