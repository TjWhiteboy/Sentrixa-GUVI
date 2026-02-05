
export type Theme = 'light' | 'dark' | 'system';

export interface Message {
  id: string;
  sender: 'attacker' | 'defender' | 'system';
  content: string;
  timestamp: string;
}

export interface TelemetryEvent {
  event_type: 'detection' | 'behavioral_indicators' | 'session_end' | 'privacy_violation';
  session_id: string;
  timestamp: string;
  data: any;
}

export interface IncidentReport {
  incident_id: string;
  session_id: string;
  environment: 'synthetic';
  summary: {
    scam_category: string;
    risk_score: number;
    containment_action: string;
    privacy_violation: boolean;
  };
  behavioral_signals: {
    urgency_level: string;
    persuasion_style: string;
    impersonation_type: string;
    fake_link_indicator: boolean;
    synthetic_payment_token: string;
  };
  timeline: Message[];
  ethics: {
    simulation_only: true;
    real_data_collected: false;
    research_use: true;
  };
  generated_at: string;
}

export interface SessionState {
  id: string;
  status: 'active' | 'terminated' | 'idle';
  riskScore: number;
  messages: Message[];
  telemetry: TelemetryEvent[];
  scamCategory: string;
  startTime: string;
}
