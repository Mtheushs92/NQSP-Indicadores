
import { IndicatorRecord, GoalRecord, PlanningRecord } from '../types';
import { supabase } from './supabaseClient';

const logError = (context: string, error: any) => {
  console.error(`[Supabase ${context}]`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code
  });
};

// --- RECORDS (INDICATORS) ---

export const loadRecords = async (): Promise<IndicatorRecord[]> => {
  const { data, error } = await supabase
    .from('indicators')
    .select('*');
  
  if (error) {
    logError("loadRecords", error);
    throw error; // Lança o erro para ser tratado pelo componente UI
  }
  
  return (data || []).map(r => ({
    id: r.id,
    sector: r.sector,
    year: r.year,
    month: r.month,
    indicatorId: r.indicator_id,
    numerator: Number(r.numerator || 0),
    denominator: Number(r.denominator || 0),
    observation: r.observation || '',
    isIgnored: r.is_ignored || false
  }));
};

export const upsertRecord = async (record: IndicatorRecord): Promise<void> => {
  const { error } = await supabase
    .from('indicators')
    .upsert({
      id: record.id,
      sector: record.sector,
      year: record.year,
      month: record.month,
      indicator_id: record.indicatorId,
      numerator: record.numerator,
      denominator: record.denominator,
      observation: record.observation,
      is_ignored: record.isIgnored
    });

  if (error) logError("upsertRecord", error);
};

export const generateRecordId = (sector: string, year: number, month: number, indicatorId: string) => {
  return `${sector}-${year}-${month}-${indicatorId}`;
};

// --- GOALS ---

export const loadGoals = async (): Promise<GoalRecord[]> => {
  const { data, error } = await supabase
    .from('goals')
    .select('*');

  if (error) {
    logError("loadGoals", error);
    throw error;
  }

  return (data || []).map(g => ({
    id: g.id,
    sector: g.sector,
    year: g.year,
    indicatorId: g.indicator_id,
    value: Number(g.value || 0)
  }));
};

export const upsertGoal = async (goal: GoalRecord): Promise<void> => {
  const { error } = await supabase
    .from('goals')
    .upsert({
      id: goal.id,
      sector: goal.sector,
      year: goal.year,
      indicator_id: goal.indicatorId,
      value: goal.value
    });

  if (error) logError("upsertGoal", error);
};

export const generateGoalId = (sector: string, year: number, indicatorId: string) => {
  return `${sector}-${year}-${indicatorId}`;
};

// --- PLANNING ---

export const loadPlanning = async (): Promise<PlanningRecord[]> => {
  const { data, error } = await supabase
    .from('planning')
    .select('*');

  if (error) {
    logError("loadPlanning", error);
    throw error;
  }

  return data || [];
};

export const upsertPlanning = async (record: PlanningRecord): Promise<void> => {
  if (!record.responsible || record.responsible.trim() === '') {
    const { error } = await supabase
      .from('planning')
      .delete()
      .eq('id', record.id);
    if (error) logError("deletePlanning", error);
    return;
  }

  const { error } = await supabase
    .from('planning')
    .upsert({
      id: record.id,
      sector: record.sector,
      year: record.year,
      month: record.month,
      responsible: record.responsible
    });

  if (error) logError("upsertPlanning", error);
};

export const generatePlanningId = (sector: string, year: number, month: number) => {
  return `${sector}-${year}-${month}`;
};
