import { IndicatorConfig } from '../types';

export const PATIENT_IDENTIFICATION_INDICATORS: IndicatorConfig[] = [
  { 
    id: 'identificacao_eventos', 
    name: 'Eventos Adversos', 
    description: 'Nº de eventos adversos devido a falhas na identificação do paciente (Valor Total no Mês).',
    type: 'count',
    defaultGoal: 0,
    isInverse: true,
    unit: ''
  },
  { 
    id: 'identificacao_pulseira', 
    name: 'Proporção com Pulseiras', 
    description: 'Pacientes com pulseira entre os internados (Fórmula: Conformidades * 100 / 17).',
    type: 'percentage_fixed',
    fixedDenominator: 17,
    defaultGoal: 95,
    unit: '%'
  },
  { 
    id: 'identificacao_placa', 
    name: 'Proporção com Placa no Leito', 
    description: 'Pacientes com placa no leito entre os internados (Fórmula: Conformidades * 100 / 17).',
    type: 'percentage_fixed',
    fixedDenominator: 17,
    defaultGoal: 95,
    unit: '%'
  }
];

export const SAFE_SURGERY_INDICATORS: IndicatorConfig[] = [
  {
    id: 'adesao_lvcs',
    name: 'Taxa de Adesão LVCS',
    description: 'Nº procedimentos c/ LVCS utilizada * 100 / Nº procedimentos realizados.',
    type: 'percentage_variable',
    defaultGoal: 95,
    unit: '%'
  },
  {
    id: 'evento_lado',
    name: 'Evento: Lado Errado',
    description: 'Nº absoluto de procedimentos cirúrgicos realizados no lado errado.',
    type: 'count',
    defaultGoal: 0,
    isInverse: true,
    unit: ''
  },
  {
    id: 'evento_paciente',
    name: 'Evento: Paciente Errado',
    description: 'Nº absoluto de cirurgias realizadas no paciente errado.',
    type: 'count',
    defaultGoal: 0,
    isInverse: true,
    unit: ''
  },
  {
    id: 'evento_procedimento',
    name: 'Evento: Procedimento Errado',
    description: 'Nº absoluto de procedimentos cirúrgicos errados.',
    type: 'count',
    defaultGoal: 0,
    isInverse: true,
    unit: ''
  }
];

export const PRESSURE_INJURY_INDICATORS: IndicatorConfig[] = [
  {
    id: 'lpp_risco_adm',
    name: 'Avaliação de Risco na Admissão',
    description: 'Pacientes avaliados (Braden) em 24h da admissão (Fórmula: Conformidades * 100 / 17).',
    type: 'percentage_fixed',
    fixedDenominator: 17,
    defaultGoal: 95,
    unit: '%'
  },
  {
    id: 'lpp_preventivas',
    name: 'Cuidado Preventivo Apropriado',
    description: 'Pacientes de risco recebendo cuidados preventivos (Fórmula: Conformidades * 100 / 17).',
    type: 'percentage_fixed',
    fixedDenominator: 17,
    defaultGoal: 95,
    unit: '%'
  },
  {
    id: 'lpp_reaval_diaria',
    name: 'Reavaliação Diária de Risco',
    description: 'Pacientes com avaliação diária de risco (Fórmula: Conformidades * 100 / 17).',
    type: 'percentage_fixed',
    fixedDenominator: 17,
    defaultGoal: 95,
    unit: '%'
  },
  {
    id: 'lpp_incidencia',
    name: 'Índice de Lesão por Pressão',
    description: 'Novos casos de LPP em pacientes de risco (Fórmula: Novos Casos * 100 / 17).',
    type: 'percentage_fixed',
    fixedDenominator: 17,
    defaultGoal: 0,
    isInverse: true,
    unit: '%'
  }
];

export const FALLS_INDICATORS: IndicatorConfig[] = [
  {
    id: 'queda_com_dano',
    name: 'Índice de Quedas C/ Dano',
    description: 'Quedas C/ Dano * 100 / Total Pacientes (Absoluto ou Amostra).',
    type: 'percentage_variable',
    defaultGoal: 0,
    isInverse: true,
    unit: '%'
  },
  {
    id: 'queda_sem_dano',
    name: 'Índice de Quedas S/ Dano',
    description: 'Quedas S/ Dano * 100 / Total Pacientes (Absoluto ou Amostra).',
    type: 'percentage_variable',
    defaultGoal: 0,
    isInverse: true,
    unit: '%'
  },
  {
    id: 'queda_risco_adm',
    name: 'Avaliação de Risco na Admissão',
    description: 'Avaliações na admissão * 100 / Total Pacientes (Absoluto ou Amostra).',
    type: 'percentage_variable',
    defaultGoal: 95,
    unit: '%'
  },
  {
    id: 'queda_geral',
    name: 'Índice de Queda (Geral)',
    description: 'Pacientes com queda * 100 / Total Pacientes (Absoluto ou Amostra).',
    type: 'percentage_variable',
    defaultGoal: 0,
    isInverse: true,
    unit: '%'
  },
  {
    id: 'queda_reaval_diaria',
    name: 'Reavaliação Diária de Risco',
    description: 'Avaliações diárias * 100 / Total Pacientes (Absoluto ou Amostra).',
    type: 'percentage_variable',
    defaultGoal: 95,
    unit: '%'
  }
];