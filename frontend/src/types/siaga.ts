import type { RegionItem, HazardTypeItem } from './disaster';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskFactorItem {
  weight: number;
  contribution: number;
  description: string;
  [key: string]: unknown;
}

export interface LocationRiskAssessment {
  risk_score: number;
  risk_level: RiskLevel;
  risk_label?: string;
  active_threats_count?: number;
  active_alerts_count?: number;
  factors: Record<string, RiskFactorItem>;
  assessed_at?: string;
  data_freshness?: string;
}

export interface LocationCheckResult {
  location: {
    latitude: number;
    longitude: number;
    region?: RegionItem | null;
  };
  assessment: LocationRiskAssessment;
  recommendations: {
    action_steps: string[];
    recommended_checklist_items: GoBagChecklistItem[];
  };
  provenance: {
    source: string;
    data_sources: string[];
    disclaimer: string;
  };
}

export interface PreparednessPlanItem {
  id?: number;
  user_id?: number;
  title: string;
  primary_meeting_point?: string | null;
  secondary_meeting_point?: string | null;
  evacuation_notes?: string | null;
  custom_provisions?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface EmergencyContactItem {
  id: number;
  user_id?: number;
  name: string;
  relationship: string;
  phone_number: string;
  is_emergency_priority: boolean;
  created_at?: string;
}

export interface GoBagChecklistItem {
  id: number;
  category: 'dokumen' | 'medis' | 'logistik' | 'peralatan' | 'proteksi';
  name: string;
  description?: string | null;
  is_essential: boolean;
  is_completed?: boolean;
}

export interface ScenarioQuestionOption {
  id: string;
  text: string;
  is_correct?: boolean;
  explanation?: string;
}

export interface ScenarioQuestionItem {
  id: number;
  question: string;
  points: number;
  options: ScenarioQuestionOption[];
}

export interface SimulationScenarioItem {
  id: number;
  title: string;
  slug: string;
  difficulty: 'pemula' | 'menengah' | 'lanjutan';
  description: string;
  context_brief: string;
  estimated_minutes: number;
  hazard_type?: HazardTypeItem | null;
  questions?: ScenarioQuestionItem[];
}

export interface ScenarioAttemptResult {
  attempt_id: number;
  scenario_id: number;
  scenario_title: string;
  earned_score: number;
  total_possible_score: number;
  score_percentage: number;
  passed: boolean;
  evaluation_summary: Array<{
    question_id: number;
    question: string;
    selected_option: string;
    is_correct: boolean;
    correct_option_id: string;
    explanation: string;
  }>;
}

export interface CommunityReportItem {
  id: number;
  user_id?: number;
  hazard_type_id: number;
  region_id: number;
  title: string;
  description: string;
  photo_path?: string | null;
  photo_url?: string | null;
  status: 'pending' | 'verified' | 'rejected';
  cluster_id?: string | null;
  latitude: number;
  longitude: number;
  hazard_type?: HazardTypeItem | null;
  region?: RegionItem | null;
  created_at: string;
  verified_at?: string | null;
}
