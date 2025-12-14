import React, { useState, useMemo } from 'react';
import { Layout } from './components/Layout';
import { products } from './data/product_database';
import { RFPAnalysis, MatchedItem, PricingResult, LogEntry } from './types';
import { RFPIdentificationAgent } from './agents/RFPIdentificationAgent';
import { ProductMatchingAgent } from './agents/ProductMatchingAgent';
import { PricingAgent } from './agents/PricingAgent';
import { ResponseGeneratorAgent } from './agents/ResponseGeneratorAgent';
import { AgentConsole } from './components/AgentConsole';
import { Play, Cpu, Database, Send, DollarSign, Globe, FileText, Search, Trophy, AlertCircle, FlaskConical, ShieldCheck, AlertTriangle } from 'lucide-react';

// --- Sub-components for Views ---

const PipelineView = () => (
  <div className="max-w-6xl mx-auto">
    <div className="mb-6 flex items-center justify-between">
      <h2 className="text-2xl font-bold text-white tracking-tight">RFP Pipeline</h2>
      <span className="text-sm bg-gray-800 text-gray-400 px-3 py-1 rounded-full border border-gray-700">3 Active Opportunities</span>
    </div>
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
      <table className="w-full text-left">
        <thead className="bg-gray-900/50 text-gray-400 text-xs font-bold uppercase tracking-wider">
          <tr>
            <th className="p-4 font-medium">ID</th>
            <th className="p-4 font-medium">Client</th>
            <th className="p-4 font-medium">Date Received</th>
            <th className="p-4 font-medium">Stage</th>
            <th className="p-4 font-medium text-right">Est. Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {[
            { id: 'RFP-8821', client: 'Apex Construction', date: 'Oct 12, 2023', status: 'Won', value: '$45,200', color: 'green' },
            { id: 'RFP-9923', client: 'Urban Living Devs', date: 'Nov 05, 2023', status: 'Review', value: '$12,500', color: 'yellow' },
            { id: 'RFP-9941', client: 'Gov Infrastructure', date: 'Nov 20, 2023', status: 'Drafting', value: '$118,000', color: 'blue' },
          ].map((row) => (
            <tr key={row.id} className="hover:bg-gray-700/30 transition-colors">
              <td className="p-4 text-blue-400 font-mono text-sm">{row.id}</td>
              <td className="p-4 font-medium text-gray-200">{row.client}</td>
              <td className="p-4 text-gray-400 text-sm">{row.date}</td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded text-xs font-bold bg-${row.color}-900/30 text-${row.color}-400 border border-${row.color}-500/20 uppercase`}>
                  {row.status}
                </span>
              </td>
              <td className="p-4 text-right font-mono text-gray-300">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const KnowledgeBaseView = () => (
  <div className="max-w-6xl mx-auto">
     <div className="mb-6">
      <h2 className="text-2xl font-bold text-white tracking-tight">Product Database</h2>
      <p className="text-gray-400 text-sm mt-1">Managed inventory reference for matching agent.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {products.map((p) => (
        <div key={p.id} className="bg-gray-800 border border-gray-700 p-5 rounded-xl hover:border-gray-600 transition-all hover:shadow-lg group">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-gray-100 text-lg group-hover:text-blue-400 transition-colors">{p.name}</h3>
            <span className="text-xs bg-gray-900 border border-gray-800 px-2 py-1 rounded text-gray-500 font-mono">{p.id}</span>
          </div>
          <p className="text-sm text-blue-400/80 mb-3 font-medium">{p.category}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {p.specs.map(spec => (
              <span key={spec} className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded border border-gray-600/50">{spec}</span>
            ))}
          </div>
          <div className="pt-3 border-t border-gray-700 flex justify-between items-center">
            <span className="text-xs text-gray-500">Unit Price</span>
            <div className="font-mono text-emerald-400 font-bold">
              ${p.unit_price}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- Main App Logic ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pipeline' | 'knowledge'>('dashboard');
  
  // Input State
  const [inputMode, setInputMode] = useState<'text' | 'url'>('text');
  const [urlInput, setUrlInput] = useState('https://portal.procurement-global.com/public-tenders');
  const [inputText, setInputText] = useState(`REQUEST FOR PROPOSAL (RFP) - ID: #99283
CLIENT DETAILS: Company: TechGlobal Solutions Inc. Contact: procurement@techglobal.com Project: HQ Campus Renovation (Phase 2) Location: Bangalore, India

PRODUCT REQUIREMENTS:

5000 Liters of Weather-Proof Exterior Emulsion (White) - For main facade.

2000 Liters of Interior Satin Finish (Color Code: TG-Blue) - Executive wings.

500 Liters of Primer (White) - Base coat for all interior walls.

200 Liters of Wood Varnish (Gloss) - For conference tables and trims.

100 Liters of Industrial Floor Coating - Server room durability.

SERVICE & COMPLIANCE CONSTRAINTS: 6. Anti-fungal certification required for all exterior paints. 7. Delivery must be completed in staggered batches starting Nov 1st. 8. On-site technical support required for application guidance (7 days). 9. 5-year warranty mandatory on all exterior coatings.

SUBMISSION DEADLINE: All proposals must be finalized by December 20th, 2023.`);
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [analysis, setAnalysis] = useState<RFPAnalysis | null>(null);
  const [matches, setMatches] = useState<MatchedItem[] | null>(null);
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [proposal, setProposal] = useState('');

  const addLog = (entry: LogEntry) => {
    setLogs(prev => [...prev, entry]);
  };

  const handleRun = async () => {
    setIsProcessing(true);
    setLogs([]);
    setAnalysis(null);
    setMatches(null);
    setPricing(null);
    setProposal('');

    const rfpAgent = new RFPIdentificationAgent(addLog);
    const matchAgent = new ProductMatchingAgent(addLog);
    const pricingAgent = new PricingAgent(addLog);
    const writerAgent = new ResponseGeneratorAgent(addLog);

    try {
      // Step 1: Identification (Text or URL)
      let rfpData: RFPAnalysis;
      
      if (inputMode === 'url') {
        rfpData = await rfpAgent.scanUrl(urlInput);
      } else {
        rfpData = await rfpAgent.analyze(inputText);
      }
      
      setAnalysis(rfpData);

      // Step 2: Matching
      const matchedItems = await matchAgent.match(rfpData.product_requirements);
      setMatches(matchedItems);

      // Step 3: Pricing
      const pricingData = await pricingAgent.calculate(matchedItems);
      setPricing(pricingData);

      // Step 4: Drafting
      const draft = await writerAgent.generateProposal(rfpData, pricingData);
      setProposal(draft);

    } catch (e) {
      console.error(e);
      addLog({
        timestamp: new Date().toLocaleTimeString(),
        agent: 'SYSTEM',
        message: 'CRITICAL ERROR: Process aborted.',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendEmail = () => {
    if (!analysis) return;
    const subject = encodeURIComponent(`Proposal for ${analysis.client_name}`);
    const body = encodeURIComponent(proposal);
    window.open(`mailto:${analysis.contact_email}?subject=${subject}&body=${body}`);
  };

  // Integrity Index Calculation
  const integrityIndex = useMemo(() => {
    if (!matches || matches.length === 0) return 0;

    // Filter to only items that have product matches (exclude services for spec calc)
    const productMatches = matches.filter(m => m.recommendations && m.recommendations.length > 0);
    
    if (productMatches.length === 0) return 0;

    const avgSpecMatch = productMatches.reduce((acc, curr) => acc + (curr.spec_match_score || 0), 0) / productMatches.length;
    
    // Constants from spec
    const pricingScore = 95;
    const confidenceScore = 90;

    // Formula: (0.4 * AvgSpec) + (0.3 * PricingScore) + (0.3 * Confidence)
    const index = (0.4 * avgSpecMatch) + (0.3 * pricingScore) + (0.3 * confidenceScore);
    
    return Math.round(index);
  }, [matches]);

  const renderDashboard = () => (
    <div className="grid grid-cols-12 gap-8 h-full">
      
      {/* LEFT COLUMN (Inputs & Reports) */}
      <div className="col-span-8 flex flex-col gap-6 pb-20">
        
        {/* Input Card */}
        <div className="bg-gray-800 p-1 rounded-xl border border-gray-700 shadow-lg flex flex-col relative group focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
          {/* Toggle Header */}
          <div className="bg-gray-900/50 px-4 py-3 rounded-t-lg border-b border-gray-700 flex justify-between items-center">
            <div className="flex gap-4">
               <button 
                 onClick={() => setInputMode('text')}
                 className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${inputMode === 'text' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
               >
                 <FileText size={14} /> Paste Text
               </button>
               <button 
                 onClick={() => setInputMode('url')}
                 className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${inputMode === 'url' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
               >
                 <Globe size={14} /> Scan URL
               </button>
            </div>
            
            {/* Show Activate Button Here only for Text Mode, for URL we put it inside */}
            {inputMode === 'text' && (
              <div className="flex gap-2">
                   <button 
                    onClick={handleRun}
                    disabled={isProcessing}
                    className={`text-xs px-3 py-1 rounded font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                      isProcessing 
                        ? 'bg-gray-700 text-gray-500 cursor-wait' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/25'
                    }`}
                   >
                     {isProcessing ? <Cpu size={12} className="animate-spin"/> : <Play size={12} fill="currentColor" />}
                     {isProcessing ? 'Processing...' : 'Activate System'}
                   </button>
              </div>
            )}
          </div>
          
          {/* Content Body */}
          <div className="bg-gray-800 rounded-b-lg p-0">
             {inputMode === 'text' ? (
                <textarea 
                  className="w-full h-64 bg-gray-800 text-gray-300 p-4 rounded-b-lg font-mono text-sm outline-none resize-none"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="// Paste raw RFP text here..."
                />
             ) : (
                <div className="h-64 flex flex-col items-center justify-center p-8 bg-gray-800 rounded-b-lg relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-transparent pointer-events-none"></div>
                   <div className="w-full max-w-lg z-10">
                      <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Target Portal URL</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          className="flex-1 bg-gray-900 border border-gray-700 text-blue-100 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                        />
                        <button 
                          onClick={handleRun}
                          disabled={isProcessing}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 whitespace-nowrap transition-all"
                        >
                          {isProcessing ? <Cpu size={16} className="animate-spin" /> : <Search size={16} />}
                          {isProcessing ? 'Scanning...' : 'Scan Website'}
                        </button>
                      </div>
                      <p className="mt-4 text-center text-gray-500 text-xs max-w-sm mx-auto">
                        Simulates a secure crawler that filters RFPs based on the 90-day deadline rule.
                      </p>
                   </div>
                </div>
             )}
          </div>
        </div>

        {/* 1. Sales Report (Blue Theme) */}
        {analysis && (
          <div className="bg-gray-800 p-6 rounded-xl border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)] animate-fade-in">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-blue-400 flex items-center gap-2">
                <Database size={20} /> Sales Agent Report
              </h3>
              <span className="bg-blue-900/30 text-blue-200 border border-blue-500/30 px-3 py-1 rounded-full text-sm font-mono font-bold">
                Score: {analysis.priority_score}/100
              </span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Client Entity</label>
                <div className="text-lg text-white font-medium mt-1">{analysis.client_name}</div>
              </div>
              <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Submission Deadline</label>
                <div className="text-lg text-white font-medium mt-1">{analysis.submission_deadline}</div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Technical Matches (Purple Theme) */}
        {matches && (
          <div className="bg-gray-800 p-6 rounded-xl border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)] animate-fade-in">
            <h3 className="text-xl font-bold text-purple-400 mb-6 flex items-center gap-2">
              <Cpu size={20} /> Technical Agent (Matches)
            </h3>
            <div className="overflow-hidden rounded-lg border border-gray-700">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-900 text-gray-400 font-mono uppercase text-xs">
                  <tr>
                    <th className="p-3 w-1/4">Requirement</th>
                    <th className="p-3 w-1/4">🏆 Top Match</th>
                    <th className="p-3 w-1/4">Alternatives (Rank 2 & 3)</th>
                    <th className="p-3 w-32 text-right">Spec Match %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 bg-gray-800/50">
                  {matches.map((m, idx) => (
                    <tr key={idx} className="hover:bg-gray-700/20">
                      {/* Req Column */}
                      <td className="p-3 align-top">
                        <div className="text-gray-300 font-medium line-clamp-2" title={m.requirement}>{m.requirement}</div>
                        {m.estimated_quantity > 0 && <div className="text-xs text-gray-500 mt-1">{m.estimated_quantity} units</div>}
                      </td>

                      {/* Rank 1 Column */}
                      <td className="p-3 align-top">
                        {m.recommendations.length > 0 ? (
                           <div className="bg-green-900/20 border border-green-500/30 rounded p-2">
                              <div className="flex items-center gap-2 mb-1">
                                <Trophy size={12} className="text-yellow-400" />
                                <span className="font-bold text-green-300 text-xs">Winner (Rank 1)</span>
                              </div>
                              <div className="text-white font-bold">{m.product_name}</div>
                              <div className="text-xs text-gray-400 mt-1">{m.product_id}</div>
                           </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-500 p-2 border border-gray-700/50 rounded bg-gray-900/30">
                             <AlertCircle size={14} />
                             <span className="text-xs">Service / No Product</span>
                          </div>
                        )}
                      </td>

                      {/* Rank 2/3 Column */}
                      <td className="p-3 align-top">
                         {m.recommendations.length > 1 ? (
                            <div className="space-y-2">
                               {m.recommendations.slice(1, 3).map((rec, rIdx) => (
                                  <div key={rIdx} className="flex justify-between items-center text-xs text-gray-400">
                                     <span className="truncate pr-2">{rec.product_name}</span>
                                     <span className="font-mono text-gray-600">{rec.spec_match_score}%</span>
                                  </div>
                               ))}
                            </div>
                         ) : (
                           <span className="text-xs text-gray-600 italic">No alternatives found</span>
                         )}
                      </td>

                      {/* Spec Match % Column */}
                      <td className="p-3 align-top text-right">
                        {m.spec_match_score ? (
                          <div className="flex flex-col items-end gap-1">
                             <span className="text-sm text-green-400 font-mono font-bold">{m.spec_match_score}%</span>
                             <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                               <div 
                                className="h-full bg-green-500 rounded-full" 
                                style={{ width: `${m.spec_match_score}%` }} 
                               />
                             </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-600">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Pricing (Green Theme) */}
        {pricing && (
          <div className="bg-gray-800 p-6 rounded-xl border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.1)] animate-fade-in">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-green-400 flex items-center gap-2">
                 <DollarSign size={20} /> Pricing Agent
               </h3>
               <div className="text-right">
                  <div className="text-xs text-green-400/70 uppercase font-bold tracking-wider mb-1">Total Estimated Value</div>
                  <div className="text-4xl font-bold text-white tracking-tight">\${pricing.total_cost.toLocaleString()}</div>
               </div>
            </div>
            
            <div className="overflow-hidden rounded-lg border border-gray-700">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-900 text-gray-400 font-mono uppercase text-xs">
                        <tr>
                            <th className="p-3">Description</th>
                            <th className="p-3 text-right">Qty</th>
                            <th className="p-3 text-right">Unit Price</th>
                            <th className="p-3 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700 bg-gray-800/50">
                        {pricing.line_items.map((item, i) => (
                            <tr key={i} className="hover:bg-gray-700/30">
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        {item.description.includes('QA Lab:') && (
                                            <span className="bg-purple-900/40 text-purple-300 p-1 rounded-full" title="Lab Testing Fee">
                                                <FlaskConical size={14} />
                                            </span>
                                        )}
                                        <div className="text-gray-200 font-medium">{item.description}</div>
                                    </div>
                                    {item.note && <div className="text-xs text-green-400 mt-1 font-mono">{item.note}</div>}
                                </td>
                                <td className="p-3 text-right font-mono text-gray-300">{item.quantity}</td>
                                <td className="p-3 text-right font-mono text-gray-300">${item.unit_price.toLocaleString()}</td>
                                <td className="p-3 text-right font-mono font-bold text-emerald-400">${item.total.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}

        {/* 4. Integrity Index (QA) */}
        {matches && pricing && (
           <div className="bg-gray-800 rounded-xl border border-cyan-500/30 p-6 flex items-center justify-between relative overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.1)] animate-fade-in">
              {/* Decorative Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              
              {/* Left: Text Content */}
              <div className="z-10 max-w-lg">
                <h3 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                   <ShieldCheck size={24} />
                   Quality Assurance: Integrity Index
                </h3>
                <p className="text-gray-400 text-sm mt-2">
                  Composite audit score based on <span className="text-gray-300">Technical Spec Match (40%)</span>, <span className="text-gray-300">Pricing Logic Check (30%)</span>, and <span className="text-gray-300">AI Confidence (30%)</span>.
                </p>
                
                {/* Status Badge */}
                <div className="mt-4">
                   {integrityIndex > 85 ? (
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-900/50 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                        ✅ PASSED: READY FOR SUBMISSION
                      </div>
                   ) : (
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-900/50 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(248,113,113,0.2)]">
                        ⚠️ LOW INTEGRITY: HUMAN REVIEW REQUIRED
                      </div>
                   )}
                </div>
              </div>
              
              {/* Right: Circular Gauge */}
              <div className="relative w-32 h-32 flex items-center justify-center z-10">
                 <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-700/50" />
                    <circle 
                      cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" 
                      className={integrityIndex > 85 ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]'}
                      strokeDasharray={351} 
                      strokeDashoffset={351 - (351 * integrityIndex) / 100}
                      strokeLinecap="round"
                    />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-white tracking-tighter">{integrityIndex}</span>
                    <span className="text-[10px] text-cyan-200/70 uppercase font-bold tracking-widest mt-1">Score</span>
                 </div>
              </div>
           </div>
        )}

        {/* 5. Email Editor (Yellow Theme) */}
        {proposal && (
          <div className="bg-gray-800 p-6 rounded-xl border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)] animate-fade-in">
            <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
              <Send size={20} /> Final Response Draft
            </h3>
            <div className="relative">
              <textarea 
                className="w-full h-80 p-6 bg-white text-gray-900 rounded-lg font-mono text-sm border-2 border-transparent focus:border-blue-500 outline-none shadow-inner leading-relaxed resize-none"
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
              />
              <div className="absolute bottom-4 right-4">
                 <button 
                  onClick={handleSendEmail} 
                  disabled={integrityIndex < 70}
                  className={`px-6 py-2 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2 ${
                    integrityIndex < 70 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-blue-500/40'
                  }`}
                 >
                   {integrityIndex < 70 ? '🔒 Review Required' : '🚀 Send via Email'}
                 </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar: Terminal */}
      <div className="col-span-4 h-full">
         <div className="sticky top-0 pt-1">
            <AgentConsole logs={logs} />
         </div>
      </div>
    </div>
  );

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'pipeline' && <PipelineView />}
      {activeTab === 'knowledge' && <KnowledgeBaseView />}
    </Layout>
  );
}