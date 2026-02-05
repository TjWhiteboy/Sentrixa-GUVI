
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Shield, 
  Terminal, 
  LayoutDashboard, 
  Download, 
  RefreshCw, 
  Settings, 
  Activity,
  Lock,
  ExternalLink,
  X,
  FileText,
  Search,
  Trash2,
  Skull,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Zap,
  Cpu,
  /* Added Database to imports */
  Database
} from 'lucide-react';
import { Theme, Message, TelemetryEvent, IncidentReport, SessionState } from './types';
import ThemeToggle from './components/ThemeToggle';
import ChatInterface from './components/ChatInterface';
import TelemetryLog from './components/TelemetryLog';
import DashboardStats from './components/DashboardStats';
import { analyzeMessage, generateAttackerMessage } from './services/gemini';

const INITIAL_SESSION: SessionState = {
  id: `sess_${Date.now()}`,
  status: 'idle',
  riskScore: 0,
  messages: [],
  telemetry: [],
  scamCategory: '',
  startTime: new Date().toISOString()
};

const SentrixaLogo: React.FC<{ size?: number; showText?: boolean }> = ({ size = 40, showText = true }) => (
  <div className="flex items-center gap-3 select-none">
    <div className="relative group" style={{ width: size, height: size }}>
      {/* Outer Glow */}
      <div className="absolute inset-0 bg-sentrixa-gradient blur-xl opacity-40 group-hover:opacity-60 transition-opacity rounded-full" />
      
      {/* SVG Logo recreating the image aesthetic */}
      <svg viewBox="0 0 100 100" className="relative z-10 w-full h-full drop-shadow-2xl">
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Shield Frame */}
        <path 
          d="M50 5 L85 20 C85 60 50 90 50 90 C50 90 15 60 15 20 L50 5Z" 
          fill="none" 
          stroke="url(#logoGrad)" 
          strokeWidth="3.5"
          className="transition-all duration-500"
        />
        
        {/* Central Eye Structure */}
        <path 
          d="M25 45 C35 35 65 35 75 45 C65 55 35 55 25 45" 
          fill="none" 
          stroke="url(#logoGrad)" 
          strokeWidth="2.5" 
          strokeLinecap="round"
        />
        <circle cx="50" cy="45" r="8" fill="url(#logoGrad)" filter="url(#glow)" />
        <circle cx="50" cy="45" r="14" fill="none" stroke="url(#logoGrad)" strokeWidth="1.5" strokeDasharray="4 2" />
        
        {/* Circuitry Patterns */}
        <path d="M50 60 L50 85" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" />
        <path d="M50 65 L65 75 L65 82" fill="none" stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M50 70 L35 80 L35 85" fill="none" stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Floating Digital Fragments */}
        <rect x="70" y="15" width="4" height="4" fill="url(#logoGrad)" className="animate-pulse" />
        <rect x="78" y="22" width="3" height="3" fill="url(#logoGrad)" />
        <rect x="85" y="10" width="5" height="5" fill="url(#logoGrad)" opacity="0.6" />
      </svg>
    </div>
    
    {showText && (
      <div>
        <span className="text-xl font-bold logo-text dark:text-white block leading-none tracking-[0.2em]">SENTRIXA</span>
        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-1 block">Neural Defense Lab</span>
      </div>
    )}
  </div>
);

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [session, setSession] = useState<SessionState>(INITIAL_SESSION);
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'lab' | 'archive'>('lab');
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  const addTelemetry = (events: any[]) => {
    const newEvents: TelemetryEvent[] = events.map(e => ({
      event_type: e.event_type as any,
      session_id: session.id,
      timestamp: new Date().toISOString(),
      data: e.data || e
    }));
    setSession(prev => ({
      ...prev,
      telemetry: [...prev.telemetry, ...newEvents]
    }));
  };

  const downloadReport = (report: IncidentReport) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `incident_${report.incident_id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleTermination = useCallback((reason: string, finalRisk: number) => {
    const lastDetection = [...session.telemetry].reverse().find(e => e.event_type === 'detection');
    const lastBehavioral = [...session.telemetry].reverse().find(e => e.event_type === 'behavioral_indicators');
    
    const incident: IncidentReport = {
      incident_id: `INC_${new Date().getFullYear()}_${Math.floor(Math.random() * 1000)}`,
      session_id: session.id,
      environment: 'synthetic',
      summary: {
        scam_category: session.scamCategory || 'General Scam',
        risk_score: finalRisk,
        containment_action: reason === 'manual_kill' ? 'emergency_kill' : 'session_terminated',
        privacy_violation: reason === 'privacy_violation'
      },
      behavioral_signals: {
        urgency_level: lastBehavioral?.data?.urgency_level || 'moderate',
        persuasion_style: lastBehavioral?.data?.persuasion_style || 'generic',
        impersonation_type: lastBehavioral?.data?.impersonation_type || 'none',
        fake_link_indicator: lastDetection?.data?.fake_link_indicator || lastBehavioral?.data?.fake_link_indicator || false,
        synthetic_payment_token: lastBehavioral?.data?.synthetic_payment_token || 'TOKEN_SIM_123'
      },
      timeline: session.messages,
      ethics: {
        simulation_only: true,
        real_data_collected: false,
        research_use: true
      },
      generated_at: new Date().toISOString()
    };

    setReports(prev => [incident, ...prev]);
    setSession(prev => ({ ...prev, status: 'terminated' }));
    if (reason !== 'manual_kill') downloadReport(incident);
  }, [session]);

  const killSwitch = () => {
    if (session.status === 'active') {
      handleTermination('manual_kill', session.riskScore);
    }
  };

  const resetAllData = () => {
    if (confirm("Are you sure you want to clear all archived incidents?")) {
      setReports([]);
      setSession(INITIAL_SESSION);
    }
  };

  const startSimulation = async () => {
    setIsLoading(true);
    const newSessionId = `sess_${Date.now()}`;
    setSession({ ...INITIAL_SESSION, id: newSessionId, status: 'active' });

    try {
      const initialMessage = await generateAttackerMessage(newSessionId, []);
      const msg: Message = {
        id: `msg_${Date.now()}`,
        sender: 'attacker',
        content: initialMessage || "Hello, this is an urgent message regarding your account.",
        timestamp: new Date().toISOString()
      };
      setSession(prev => ({ ...prev, messages: [msg] }));
      processNextTurn(newSessionId, [msg], msg.content);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const processNextTurn = async (sid: string, history: Message[], latest: string) => {
    setIsLoading(true);
    try {
      const analysis = await analyzeMessage(sid, history, latest);
      addTelemetry(analysis.telemetry);
      const newRisk = Math.min(100, session.riskScore + (analysis.risk_increase || 0));
      setSession(prev => ({ 
        ...prev, 
        riskScore: newRisk,
        scamCategory: analysis.telemetry.find((t: any) => t.event_type === 'detection')?.data?.scam_category || prev.scamCategory
      }));

      const defenderMsg: Message = {
        id: `def_${Date.now()}`,
        sender: 'defender',
        content: analysis.defensive_response,
        timestamp: new Date().toISOString()
      };

      setSession(prev => {
        if (prev.status !== 'active') return prev;
        const updated = { ...prev, messages: [...prev.messages, defenderMsg] };
        if (newRisk >= 80) {
          setTimeout(() => handleTermination('risk_threshold_exceeded', newRisk), 1000);
        } else {
          setTimeout(async () => {
            if (updated.status !== 'active') return;
            const nextAttacker = await generateAttackerMessage(sid, updated.messages);
            const attackerMsg: Message = {
              id: `att_${Date.now()}`,
              sender: 'attacker',
              content: nextAttacker || "Are you still there? This is important.",
              timestamp: new Date().toISOString()
            };
            setSession(s => {
              if (s.status !== 'active') return s;
              const nextHistory = [...s.messages, attackerMsg];
              processNextTurn(sid, nextHistory, attackerMsg.content);
              return { ...s, messages: nextHistory };
            });
          }, 2000);
        }
        return updated;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReports = useMemo(() => {
    if (!searchQuery) return reports;
    const q = searchQuery.toLowerCase();
    return reports.filter(r => 
      r.incident_id.toLowerCase().includes(q) || 
      r.summary.scam_category.toLowerCase().includes(q)
    );
  }, [reports, searchQuery]);

  const systemStatus = reports.length > 5 || session.riskScore > 60 ? 'ELEVATED' : 'STABLE';

  return (
    <div className="flex h-screen bg-sentrixa-light-bg dark:bg-sentrixa-dark-bg text-slate-900 dark:text-slate-200 transition-colors duration-200 overflow-hidden font-body">
      
      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-[280px] bg-sentrixa-light-card dark:bg-sentrixa-dark-card border-r border-slate-200 dark:border-slate-800 shrink-0 shadow-2xl z-20">
        <div className="h-24 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <SentrixaLogo size={36} />
        </div>

        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <button 
            onClick={() => setView('lab')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${view === 'lab' ? 'bg-sentrixa-gradient text-white shadow-lg shadow-sky-500/25' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <RefreshCw size={18} className={view === 'lab' ? 'animate-spin-slow' : ''} /> Research Lab
          </button>
          <button 
            onClick={() => setView('archive')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${view === 'archive' ? 'bg-sentrixa-gradient text-white shadow-lg shadow-sky-500/25' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={18} /> Incident Archive
          </button>
          
          <div className="pt-8 pb-3 px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-t border-slate-200/50 dark:border-slate-800/50 mt-6">DEFENSIVE PROTOCOLS</div>
          <div className="px-4 space-y-4 py-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-medium">
                <span className="text-slate-500 flex items-center gap-2"><Cpu size={12} className="text-sentrixa-dark-primary" /> Synthetic Core</span>
                <span className="text-green-500 font-bold">ONLINE</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-medium">
                <span className="text-slate-500 flex items-center gap-2"><Lock size={12} className="text-sentrixa-dark-secondary" /> Data Redaction</span>
                <span className="text-sentrixa-dark-primary font-bold">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-medium">
                <span className="text-slate-500 flex items-center gap-2"><Eye size={12} className="text-sentrixa-dark-primary" /> Behavioral AI</span>
                <span className="text-green-500 font-bold">VERIFIED</span>
              </div>
            </div>
            <div className="p-4 bg-slate-100 dark:bg-sentrixa-dark-bg rounded-2xl border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-30 transition-opacity">
                 <Shield size={40} />
               </div>
               <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium relative z-10 italic">
                 Ethics Enforced: Lab environment strictly isolated from production networks.
               </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-800 space-y-4 bg-slate-50/50 dark:bg-slate-900/30">
          <button 
            onClick={resetAllData}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-transparent hover:border-red-200"
          >
            <Trash2 size={14} /> Clear Archive
          </button>
          <div className="bg-sentrixa-light-bg dark:bg-sentrixa-dark-bg p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
            <p className="text-[9px] text-slate-400 font-bold uppercase mb-1 tracking-widest">Global Heartbeat</p>
            <div className="flex items-center gap-2 text-[10px] text-sentrixa-dark-primary font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-sentrixa-dark-accent animate-pulse" /> NODES_SYNCED_200
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP HEADER */}
        <header className="h-20 flex items-center justify-between px-8 bg-white/80 dark:bg-sentrixa-dark-card/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shrink-0 z-10">
          <div className="flex items-center gap-8 flex-1">
            <h2 className="text-xl font-bold font-heading dark:text-white capitalize hidden sm:block">
              {view === 'lab' ? 'Intelligence Lab' : 'Security Repository'}
            </h2>
            
            <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full text-[11px] font-bold border ${systemStatus === 'STABLE' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
               <span className="opacity-60">SYSTEM STATUS:</span>
               <span>{systemStatus}</span>
            </div>

            <div className="relative flex-1 max-w-md hidden md:block">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <input 
                 type="text" 
                 placeholder="Search incident markers or telemetry logs..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-sentrixa-dark-bg border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 ring-sentrixa-dark-primary/20 transition-all dark:text-white outline-none"
               />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {session.status === 'active' && (
              <button 
                onClick={killSwitch}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-[10px] font-bold flex items-center gap-2 shadow-lg shadow-red-600/20 transition-transform active:scale-95"
              >
                <Skull size={14} /> EMERGENCY KILL
              </button>
            )}
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
            <button 
              onClick={() => reports.length > 0 && downloadReport(reports[0])}
              className="hidden sm:flex items-center gap-2 bg-sentrixa-gradient text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:brightness-110 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-30 disabled:shadow-none"
              disabled={reports.length === 0}
            >
              <Download size={14} /> EXPORT_REPORTS
            </button>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-8 bg-slate-50/30 dark:bg-sentrixa-dark-bg/50">
          {view === 'lab' ? (
            <>
              <DashboardStats 
                riskScore={session.riskScore} 
                totalEvents={session.telemetry.length}
                scamCategory={session.scamCategory}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-360px)] min-h-[550px]">
                <div className="lg:col-span-2 flex flex-col min-h-0">
                  <ChatInterface 
                    messages={session.messages} 
                    status={session.status} 
                    onStart={startSimulation}
                    isLoading={isLoading}
                  />
                </div>
                <div className="flex flex-col gap-8 min-h-0">
                  <div className="flex-1 min-h-0 shadow-2xl rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <TelemetryLog events={session.telemetry} searchQuery={searchQuery} />
                  </div>
                  <div className="bg-white dark:bg-sentrixa-dark-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sentrixa-gradient blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none" />
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-5 flex items-center gap-2 tracking-[0.2em] font-heading">
                      <Settings size={14} className="text-sentrixa-dark-primary" /> LAB_PARAM_METRICS
                    </h4>
                    <div className="space-y-5">
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-2 uppercase font-bold tracking-widest">
                          <span>Risk Propagation</span>
                          <span className={session.riskScore > 70 ? 'text-red-500' : 'text-sentrixa-dark-primary'}>{session.riskScore}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-sentrixa-dark-bg rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-sentrixa-gradient transition-all duration-1000 ease-out shadow-[0_0_10px_#38BDF8]"
                             style={{ width: `${session.riskScore}%` }}
                           />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-3 bg-slate-50 dark:bg-sentrixa-dark-bg rounded-2xl border border-slate-200/50 dark:border-slate-800 text-center group/node">
                            <span className="block text-[8px] text-slate-500 uppercase font-bold tracking-wider mb-1">Latency_Avg</span>
                            <span className="text-sm font-mono font-bold text-sentrixa-light-accent dark:text-sentrixa-dark-accent group-hover:animate-pulse">182ms</span>
                         </div>
                         <div className="p-3 bg-slate-50 dark:bg-sentrixa-dark-bg rounded-2xl border border-slate-200/50 dark:border-slate-800 text-center group/node">
                            <span className="block text-[8px] text-slate-500 uppercase font-bold tracking-wider mb-1">Neural_Load</span>
                            <span className="text-sm font-mono font-bold text-sentrixa-dark-primary group-hover:animate-pulse">42.8%</span>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ARCHIVE VIEW */
            <div className="space-y-8 animate-in fade-in duration-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold dark:text-white font-heading">Archived Security Incidents</h3>
                  <p className="text-slate-500 text-sm mt-1">Deep analysis records from previous synthetic sessions.</p>
                </div>
                <div className="px-5 py-2 bg-white dark:bg-sentrixa-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-400 shadow-sm">
                   TOTAL_RECORDS: <span className="text-sentrixa-dark-primary">{filteredReports.length}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-sentrixa-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      <th className="px-8 py-5">Incident_Ref</th>
                      <th className="px-8 py-5">Classification</th>
                      <th className="px-8 py-5">Risk_Vector</th>
                      <th className="px-8 py-5">Containment</th>
                      <th className="px-8 py-5">Timestamp</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-8 py-32 text-center text-slate-500 text-sm italic">
                          {searchQuery ? `No telemetry logs matching "${searchQuery}"` : 'Vault empty. Conduct research to populate logs.'}
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((report) => (
                        <tr key={report.incident_id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors group">
                          <td className="px-8 py-5 font-mono text-xs text-sentrixa-dark-primary font-bold">{report.incident_id}</td>
                          <td className="px-8 py-5 text-sm font-bold dark:text-slate-200">{report.summary.scam_category}</td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 w-12 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-sentrixa-gradient" style={{ width: `${report.summary.risk_score}%` }} />
                              </div>
                              <span className={`text-[10px] font-bold ${report.summary.risk_score > 75 ? 'text-red-500' : 'text-sentrixa-dark-primary'}`}>
                                {report.summary.risk_score}%
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-bold border uppercase tracking-widest ${
                              report.summary.containment_action === 'emergency_kill' 
                                ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                                : 'bg-green-500/10 border-green-500/20 text-green-500'
                            }`}>
                              {report.summary.containment_action.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-xs text-slate-500 font-mono">{new Date(report.generated_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => setSelectedReport(report)}
                                className="p-2.5 text-slate-400 hover:text-white hover:bg-sentrixa-gradient rounded-xl transition-all shadow-md active:scale-90"
                                title="Inspect Report"
                              >
                                <ExternalLink size={16} />
                              </button>
                              <button 
                                onClick={() => downloadReport(report)}
                                className="p-2.5 text-slate-400 hover:text-white hover:bg-sentrixa-dark-accent rounded-xl transition-all shadow-md active:scale-90"
                                title="Export JSON"
                              >
                                <Download size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* INCIDENT DETAIL MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in zoom-in duration-300">
          <div className="bg-white dark:bg-sentrixa-dark-card w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="px-10 py-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-6">
                <div className="bg-sentrixa-gradient p-4 rounded-[1.25rem] shadow-2xl shadow-indigo-500/20">
                  <FileText className="text-white" size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold dark:text-white font-heading tracking-tight">Security Post-Mortem</h3>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em] mt-1">{selectedReport.incident_id} • Behavioral Analysis Log</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedReport(null)} 
                className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all bg-slate-100 dark:bg-slate-800 rounded-2xl hover:rotate-90"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-12">
               {/* Summary Stats */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm group">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-3 tracking-widest">Classification</p>
                    <p className="text-xl font-bold font-heading dark:text-white group-hover:text-sentrixa-dark-primary transition-colors">{selectedReport.summary.scam_category}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm group">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-3 tracking-widest">Max Risk Level</p>
                    <div className="flex items-center gap-3">
                      <p className="text-3xl font-bold text-red-500 font-heading">{selectedReport.summary.risk_score}%</p>
                      <span className="text-[9px] text-white uppercase font-bold px-2 py-1 bg-red-500 rounded-lg animate-pulse">Critical</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm group">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-3 tracking-widest">Containment</p>
                    <p className="text-xl font-bold font-heading text-sentrixa-dark-accent">{selectedReport.summary.containment_action.toUpperCase()}</p>
                  </div>
               </div>

               {/* Timeline View */}
               <div>
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-8 tracking-[0.3em] flex items-center gap-3 font-heading">
                   <Activity size={16} className="text-sentrixa-dark-primary" /> SESSION_CHRONICLE
                 </h4>
                 <div className="space-y-6 border-l-2 border-slate-100 dark:border-slate-800 ml-3 pl-10 relative">
                    {selectedReport.timeline.map((msg, i) => (
                      <div key={i} className="relative group/time">
                         <div className={`absolute -left-[45px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-sentrixa-dark-card transition-all group-hover/time:scale-150 ${msg.sender === 'attacker' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-sentrixa-dark-primary shadow-[0_0_10px_rgba(56,189,248,0.5)]'}`} />
                         <div className="flex items-center gap-3 mb-2">
                           <span className={`text-[10px] font-bold uppercase tracking-widest ${msg.sender === 'attacker' ? 'text-red-400' : 'text-sentrixa-dark-primary'}`}>
                             {msg.sender === 'attacker' ? 'Attacker_Vector' : 'SENTRIXA_Core'}
                           </span>
                           <span className="text-[9px] font-mono text-slate-400">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                         </div>
                         <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                           {msg.content}
                         </div>
                      </div>
                    ))}
                    <div className="relative">
                       <div className="absolute -left-[45px] top-1 w-3 h-3 rounded-full bg-sentrixa-gradient shadow-lg animate-ping" />
                       <div className="absolute -left-[45px] top-1 w-3 h-3 rounded-full bg-sentrixa-gradient" />
                       <div className="text-[10px] font-bold text-transparent bg-clip-text bg-sentrixa-gradient uppercase tracking-widest">Automated Containment Success</div>
                    </div>
                 </div>
               </div>

               {/* JSON Payload */}
               <div className="group/json-box">
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-5 tracking-[0.3em] flex items-center justify-between font-heading">
                   <div className="flex items-center gap-3">
                     <Database size={16} className="text-sentrixa-dark-secondary" /> RAW_METADATA_STREAM
                   </div>
                   <span className="text-[8px] opacity-40">READ_ONLY</span>
                 </h4>
                 <div className="bg-sentrixa-dark-bg rounded-[1.5rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
                   <div className="absolute inset-0 bg-sentrixa-gradient opacity-0 group-hover/json-box:opacity-5 transition-opacity pointer-events-none" />
                   <pre className="text-[11px] text-sentrixa-dark-primary font-mono overflow-auto max-h-[300px] leading-relaxed scrollbar-hide">
                     {JSON.stringify(selectedReport, null, 4)}
                   </pre>
                 </div>
               </div>
            </div>

            <div className="p-10 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex gap-6">
              <button 
                onClick={() => downloadReport(selectedReport)}
                className="flex-1 bg-sentrixa-gradient text-white py-4 rounded-[1.25rem] text-sm font-bold flex items-center justify-center gap-4 hover:brightness-110 transition-all shadow-[0_10px_30px_rgba(129,140,248,0.3)] group"
              >
                <Download size={20} className="group-hover:-translate-y-1 transition-transform" /> Download Encrypted Incident Data
              </button>
              <button 
                onClick={() => setSelectedReport(null)}
                className="px-12 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-[1.25rem] text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-lg"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
