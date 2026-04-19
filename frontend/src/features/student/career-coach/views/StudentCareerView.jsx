import React, { useState, useRef, useEffect } from 'react';
import { Target, TrendingUp, Layers, ChevronRight, Activity, Zap, CheckCircle2, ChevronDown, ListEnd, Star } from 'lucide-react';
import useCareerCoach from '../hooks/useCareerCoach';
import { chatService } from '../../../../services/chatService';

import CareerEmptyState from '../components/CareerEmptyState';
import CareerPathCard from '../components/CareerPathCard';
import CareerMatchDonut from '../components/CareerMatchDonut';
import CareerAllPathsModal from '../components/CareerAllPathsModal';
import CareerSectionHeading from '../components/CareerSectionHeading';

const CHAT_SUGGESTIONS = [
  'How do I improve my match score?',
  'What should I focus on first?',
  'Which path fits me best?',
  'Show me my skill gaps',
];

export default function StudentCareerView({ user }) {
  const [showAllPaths, setShowAllPaths] = useState(false);
  const [activeTab, setActiveTab] = useState('Roadmap');

  const {
    pipelineData,
    loading,
    error,
    careerMatches,
    selectedPath,
    selectedIndex,
    setSelectedIndex,
    optimalIndex,
    gaps,
    skills,
    insights,
    runPipeline,
    pipelineStatus,
    isRunning,
    progression,
    chosenCareer,
    setChosenCareer,
    careerLoading,
  } = useCareerCoach(user.id);

  // ── AI Chat state ──────────────────────────────────────────────────────────
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatMessages, chatSending]);

  const sendChat = async (textOverride) => {
    const text = (textOverride ?? chatInput).trim();
    if (!text || chatSending) return;
    const nextMessages = [...chatMessages, { role: 'user', content: text }];
    setChatMessages(nextMessages);
    setChatInput('');
    setChatError(null);
    setChatSending(true);
    try {
      const { reply } = await chatService.sendCareerMessage(
        nextMessages,
        {
          career_matches: careerMatches,
          skill_profile: pipelineData?.skill_profile,
          gap_analysis: pipelineData?.gap_analysis,
          summary: pipelineData?.summary,
          chosen_career: chosenCareer,
        },
      );
      setChatMessages([...nextMessages, { role: 'assistant', content: reply }]);
    } catch (e) {
      setChatError(e.message || 'Failed to reach the AI coach.');
    } finally {
      setChatSending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-gray-200 rounded-full mb-4 px-8"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // If pipeline hasn't run yet or data is completely missing
  if (!pipelineData || careerMatches.length === 0) {
    return (
      <CareerEmptyState 
        onGenerate={runPipeline} 
        isRunning={isRunning} 
        pipelineStatus={pipelineStatus} 
        error={error}
      />
    );
  }

  const optimalPath = careerMatches[optimalIndex];

  return (
    <div className="p-6 lg:p-8 space-y-6 pb-24 h-full overflow-y-auto custom-scrollbar bg-linear-to-br from-[#fff8f8] via-[#fffdfd] to-[#fdf2f2] rounded-3xl border border-[#f2dfdf] shadow-[0_22px_55px_-35px_rgba(188,19,19,0.35)]">
        {/* ── New Screenshot Design Implementation ── */}
        <div className="flex flex-col mb-4">
          <h1 className="text-[26px] font-extrabold text-gray-900 mb-1 leading-none">Choose Your Path</h1>
          <p className="text-[12px] text-gray-500 mb-6">Select a specialized trajectory to align your skill acquisition with global market demands. Each path is curated by AI intelligence and heritage expertise.</p>
          
          {/* Progress Banner */}
          {progression && (
            <div className="mb-6">
              {progression.first_run ? (
                <div className="bg-emerald-50/90 border border-emerald-200 p-5 rounded-2xl shadow-[0_10px_24px_-16px_rgba(16,185,129,0.35)]">
                  <h3 className="font-extrabold text-emerald-900 text-[14px] mb-1">Welcome to ASPIRE!</h3>
                  <p className="text-[12px] text-emerald-700">{progression.motivational_insight}</p>
                </div>
              ) : (
                <div className="bg-linear-to-br from-white via-[#fffbfb] to-[#fff3f3] border border-[#f1d7d7] p-6 rounded-2xl shadow-[0_12px_30px_-18px_rgba(188,19,19,0.45)]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-extrabold text-gray-900 text-[16px]">Your progress — {progression.chosen_career}</h3>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded border border-emerald-200">
                      +{progression.readiness_change}% since last report ({progression.days_since_last_report} days ago)
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 bg-[#f4e8e8] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#bc1313] h-full" style={{ width: `${Math.max(0, Math.min(100, progression.career_readiness_score))}%` }}></div>
                    </div>
                    <span className="text-[12px] font-bold text-gray-900">{progression.career_readiness_score}% career ready</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      {progression.closed_gaps?.map((gap, i) => (
                        <div key={i} className="flex items-center gap-2 mb-1.5 text-[12px] text-gray-700">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span><strong>{gap}</strong> — gap closed</span>
                        </div>
                      ))}
                      {progression.improved_skills?.map((sk, i) => (
                        <div key={i} className="flex items-center gap-2 mb-1.5 text-[12px] text-gray-700">
                          <TrendingUp size={14} className="text-blue-500" />
                          <span><strong>{sk.skill}</strong> +{sk.change}% ({sk.previous_score}% → {sk.current_score}%)</span>
                        </div>
                      ))}
                    </div>
                    {progression.next_milestone ? (
                      <div className="bg-[#fff6f6] border border-[#efd7d7] p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Next milestone: Learn {progression.next_milestone.skill}</span>
                        <p className="text-[11px] text-gray-700 font-medium mt-1">→ {progression.next_milestone.impact}</p>
                      </div>
                    ) : null}
                  </div>
                  
                  <div className="text-[12px] font-medium text-gray-600 italic border-l-2 border-gray-300 pl-3">
                    "{progression.motivational_insight}"
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-end border-b border-[#ead4d4] pb-0">
            <div className="flex gap-8 font-bold text-[12px]">
              <span onClick={() => setActiveTab('Roadmap')} className={`cursor-pointer pb-3 px-1 border-b-[3px] transition-colors ${activeTab === 'Roadmap' ? 'text-[#bc1313] border-[#bc1313]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>Roadmap</span>
              <span onClick={() => setActiveTab('Insights')} className={`cursor-pointer pb-3 px-1 border-b-[3px] transition-colors ${activeTab === 'Insights' ? 'text-[#bc1313] border-[#bc1313]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>Insights</span>
              <span onClick={() => setActiveTab('AI Chat')} className={`cursor-pointer pb-3 px-1 border-b-[3px] transition-colors ${activeTab === 'AI Chat' ? 'text-[#bc1313] border-[#bc1313]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>AI Chat</span>
            </div>
            <span className="text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer mb-3 font-semibold transition-colors">View All Trajectories</span>
          </div>
        </div>

        {/* Path Metadata Strip */}
        <div className="flex items-center gap-4 mb-4 mt-8">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Path:</span>
          <div className="flex items-center gap-3 border border-[#ead4d4] rounded-lg px-3 py-2 cursor-pointer bg-white/80 hover:bg-[#fff4f4] transition-colors shadow-[0_10px_24px_-20px_rgba(188,19,19,0.45)]">
            <span className="text-[12px] font-bold text-gray-900">{careerMatches[selectedIndex]?.title || 'Embedded Systems Engineer'}</span>
            <ChevronDown size={14} className="text-gray-500" />
          </div>
          <button className="text-[12px] font-bold text-[#6f4a4a] bg-white/80 border border-[#ead4d4] rounded-lg px-4 py-2 hover:bg-[#fff4f4] shadow-[0_10px_24px_-20px_rgba(188,19,19,0.45)] transition-colors">
            View All Paths
          </button>
        </div>

        <div className="flex items-center gap-2 text-[12px] mb-6 border-b border-[#f1dfdf] pb-4">
          <span className="text-gray-500">Selected path:</span>
          <span className="font-extrabold text-gray-900 ml-1">{careerMatches[selectedIndex]?.title}</span>
          <span className={`${selectedIndex === optimalIndex ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} font-bold px-2 py-0.5 text-[11px] rounded flex items-center ml-1`}>
            {careerMatches[selectedIndex]?.match_score}% Match
          </span>
          <span className="text-[#bc1313] hover:text-[#9e1010] cursor-pointer font-semibold underline underline-offset-2 ml-1">Change path</span>
        </div>

        {/* Dynamic AI Recommendation Warning */}
        {selectedIndex !== optimalIndex && (
          <div className="bg-[#fff4f4] border border-[#f2cdcd] p-3.5 mb-6 rounded-lg flex items-start gap-3 shadow-[0_10px_24px_-18px_rgba(188,19,19,0.45)]">
            <div className="w-4.5 h-4.5 rounded-full bg-[#bc1313] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm text-[11px] font-extrabold italic">!</div>
            <p className="text-[12px] text-gray-800 leading-relaxed">
              <strong>AI Recommendation:</strong> Your academic data shows stronger performance in hardware-related subjects (<strong className="text-[#bc1313]">{careerMatches[optimalIndex]?.title}</strong> match: {careerMatches[optimalIndex]?.match_score}%). To succeed in <strong className="text-[#bc1313]">{careerMatches[selectedIndex]?.title}</strong>, focus on: <strong>SQL Databases</strong> and <strong>Data Visualization</strong>. Check Learning Recommendations below.
            </p>
          </div>
        )}

        {/* Path Cards Box */}
        <div className="relative mb-8 mt-4">
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
            {careerMatches.map((match, idx) => (
               <CareerPathCard
                 key={idx}
                 match={match}
                 index={idx}
                 selected={selectedIndex === idx}
                 optimal={idx === optimalIndex}
                 onSelect={setSelectedIndex}
                 isChosenGoal={chosenCareer === match.title}
                 onSetAsGoal={() => setChosenCareer(match.title)}
                 careerLoading={careerLoading}
               />
            ))}
          </div>
        </div>

        {/* --- ROADMAP TAB CONTENT --- */}
        {activeTab === 'Roadmap' && (
          <>
            {/* PRIMARY OBJECTIVE */}
        <CareerSectionHeading title="PRIMARY OBJECTIVE" />
        <div className="bg-linear-to-br from-white via-[#fffbfb] to-[#fff3f3] rounded-2xl border border-[#f1d7d7] shadow-[0_12px_30px_-18px_rgba(188,19,19,0.45)] p-8 mb-6 flex flex-col lg:flex-row items-center gap-10">
          
          {/* Left: Info Grid */}
          <div className="flex-1 space-y-4">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest border border-[#eed8d8] rounded-full px-3 py-1 bg-[#fff3f3]">PRIMARY OBJECTIVE</span>
            <div>
              <h2 className="text-[22px] font-extrabold text-gray-900 leading-tight">Senior {careerMatches[selectedIndex]?.title || 'Embedded Systems Architect'}</h2>
              <p className="text-[12px] text-gray-500 mt-1 font-medium">{selectedIndex === 0 ? 'Specializing in Real-Time Systems & IoT Infrastructure' : 'Specializing in Engineering Analytics & Business Intelligence'}</p>
            </div>
            
            <div className="flex gap-3 pt-3">
              <div className="bg-[#fff5f5] border border-[#efd8d8] rounded-xl p-3 flex-1">
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-1">MEDIAN TENURE</span>
                <span className="text-[13px] font-bold text-gray-900">{selectedIndex === 0 ? '4.1 Years' : '3.6 Years'}</span>
              </div>
            </div>
          </div>

          {/* Center: Donut */}
          <div className="shrink-0 flex flex-col items-center justify-center -mt-2">
             <div className="scale-125 mb-3"><CareerMatchDonut score={careerMatches[selectedIndex]?.match_score || 92} /></div>
             <p className="text-[9px] text-gray-400 font-medium text-center max-w-30 leading-tight mt-1">Based on ILO/SO attainment and GitHub activity</p>
          </div>

          {/* Right: Gap Analysis */}
          <div className="flex-[1.5] w-full flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">GAP ANALYSIS</span>
            
            <div className="space-y-4 mb-8">
              {/* Acquired 1 */}
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-[12px] font-extrabold text-gray-900">Circuit Analysis</span>
                  <span className="text-[11px] font-bold text-emerald-600">Acquired</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full"><div className="bg-emerald-600 h-full rounded-full w-full"></div></div>
              </div>
              
              {/* Acquired 2 */}
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-[12px] font-extrabold text-gray-900">Embedded C/C++</span>
                  <span className="text-[11px] font-bold text-emerald-600">Acquired</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full"><div className="bg-emerald-600 h-full rounded-full w-[88%]"></div></div>
              </div>
              
              {/* Developing */}
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-[12px] font-extrabold text-gray-900">RTOS Concepts</span>
                  <span className="text-[11px] font-bold text-amber-500">Developing</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full"><div className="bg-amber-400 h-full rounded-full w-[65%]"></div></div>
              </div>
              
              {/* Critical Gap */}
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-[12px] font-extrabold text-gray-900">FPGA/VHDL</span>
                  <span className="text-[11px] font-bold text-[#bc1313]">Critical Gap</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full"><div className="bg-[#bc1313] h-full rounded-full w-[15%]"></div></div>
              </div>
            </div>

            <button className="w-full py-2.5 border-2 border-gray-200 text-gray-800 text-[11px] font-extrabold uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-colors">
              EXPORT REPORT
            </button>
          </div>
        </div>

        {/* ACADEMIC JOURNEY VISUALIZATION */}
        <div className="bg-linear-to-br from-white via-[#fffbfb] to-[#fff3f3] rounded-2xl border border-[#f1d7d7] shadow-[0_12px_30px_-18px_rgba(188,19,19,0.45)] p-8 mb-6 mt-10">
          <div className="flex justify-between items-start mb-12">
            <div>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2">ACADEMIC JOURNEY VISUALIZATION</span>
              <h2 className="text-[18px] font-extrabold text-gray-900">Scholastic Milestones Remaining</h2>
            </div>
            <div className="flex items-center gap-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
               <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-gray-900 rounded-full"/> COMPLETED</span>
               <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-white border-2 border-gray-300 rounded-full"/> PROJECTED</span>
            </div>
          </div>
          
          <div className="relative flex justify-between items-center px-6">
            {/* Horizontal Line Connector */}
            <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-linear-to-r from-gray-200 via-gray-200 to-gray-100 -translate-y-1/2 z-0"></div>
            
            {/* Nodes */}
            <div className="relative z-10 flex flex-col items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-[#1a0505] flex items-center justify-center shadow-md text-white"><CheckCircle2 size={16} /></div>
               <div className="text-center absolute top-12 whitespace-nowrap"><p className="text-[11px] font-bold text-gray-900">CORE CURRICULUM</p><p className="text-[9px] text-gray-400">Finished Sem 1, 2024</p></div>
            </div>
            
            <div className="relative z-10 flex flex-col items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-[#1a0505] flex items-center justify-center shadow-md text-white"><CheckCircle2 size={16} /></div>
               <div className="text-center absolute top-12 whitespace-nowrap"><p className="text-[11px] font-bold text-gray-900">DIGITAL ELECTRONICS</p><p className="text-[9px] text-gray-400">Finished Sem 2, 2024</p></div>
            </div>
            
            <div className="relative z-10 flex flex-col items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-red-50 border-[3px] border-[#bc1313] flex items-center justify-center shadow-lg"><span className="w-3 h-3 rounded-full bg-[#bc1313] animate-pulse"></span></div>
               <div className="text-center absolute top-12 whitespace-nowrap mt-1"><p className="text-[11px] font-extrabold text-[#bc1313] uppercase tracking-wider">MICROPROCESSORS LAB</p><p className="text-[9px] text-gray-500 font-medium">In progress (Est. Dec 2024)</p></div>
            </div>
            
            <div className="relative z-10 flex flex-col items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center"></div>
               <div className="text-center absolute top-12 whitespace-nowrap"><p className="text-[11px] font-bold text-gray-600">EMBEDDED SYSTEMS</p><p className="text-[9px] text-gray-400">Projected Sum 2025</p></div>
            </div>
            
            <div className="relative z-10 flex flex-col items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center"></div>
               <div className="text-center absolute top-12 whitespace-nowrap"><p className="text-[11px] font-bold text-gray-600">CAPSTONE DESIGN</p><p className="text-[9px] text-gray-400">Projected Dec 2025</p></div>
            </div>
          </div>
          <div className="h-20"></div> {/* Spacer for absolute text */}
        </div>

        {/* CURATED RECOMMENDATIONS */}
        <div className="flex items-center gap-2 mb-4 mt-12">
          <div className="w-0.75 h-3.5 bg-[#bc1313] rounded-sm shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 flex items-center gap-1.5"><Star size={12} className="text-[#bc1313]" fill="#bc1313" /> CURATED RECOMMENDATIONS</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="bg-linear-to-br from-white via-[#fffbfb] to-[#fff3f3] rounded-2xl border border-[#f1d7d7] shadow-[0_12px_30px_-18px_rgba(188,19,19,0.4)] p-6 hover:shadow-[0_16px_34px_-18px_rgba(188,19,19,0.5)] transition-shadow flex flex-col h-full cursor-pointer">
            <span className="text-[9px] font-bold text-[#bc1313] uppercase tracking-widest mb-3">ELECTIVE COURSE</span>
            <h4 className="text-[14px] font-extrabold text-gray-900 leading-snug mb-2">CPEN 315: Microcontrollers & Embedded</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed mb-6 flex-1">Closes RTOS gap with hands-on ARM Cortex-M firmware development.</p>
            <div className="flex justify-between items-end mt-auto text-gray-400">
               <span className="text-[10px] uppercase font-bold tracking-widest">Prof. Santos</span>
               <ChevronRight size={14} className="text-gray-300" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-linear-to-br from-white via-[#fffbfb] to-[#fff3f3] rounded-2xl border border-[#f1d7d7] shadow-[0_12px_30px_-18px_rgba(188,19,19,0.4)] p-6 hover:shadow-[0_16px_34px_-18px_rgba(188,19,19,0.5)] transition-shadow flex flex-col h-full cursor-pointer">
            <span className="text-[9px] font-bold text-[#bc1313] uppercase tracking-widest mb-3">INDUSTRY PROJECT</span>
            <h4 className="text-[14px] font-extrabold text-gray-900 leading-snug mb-2">Arduino IoT Monitoring System</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed mb-6 flex-1">Validates embedded skills with a deployable hardware project.</p>
            <div className="flex justify-between items-end mt-auto text-gray-400">
               <span className="text-[10px] uppercase font-bold tracking-widest">GitHub Collaborative</span>
               <ChevronRight size={14} className="text-gray-300" />
            </div>
          </div>

        </div>
        </>
        )}

        {/* --- INSIGHTS TAB CONTENT --- */}
        {activeTab === 'Insights' && (
          <>
            <CareerSectionHeading title="CAREER MATCH RESULTS" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {careerMatches.slice(0, 4).map((match, i) => (
                <div key={i} className={`rounded-xl border p-5 shadow-[0_12px_30px_-20px_rgba(188,19,19,0.4)] relative ${selectedIndex === i ? 'border-red-200 bg-[#fff4f4]' : 'border-[#f1d7d7] bg-linear-to-br from-white via-[#fffbfb] to-[#fff3f3]'}`}>
                   <h4 className="text-[13px] font-extrabold text-gray-900 mb-1">{match.title}</h4>
                   <div className={`text-[18px] font-bold mb-3 ${i === 0 ? 'text-emerald-700' : 'text-[#bc1313]'}`}>{match.match_score}%</div>
                   <div className="w-full bg-gray-100 h-1.5 rounded-full mb-3">
                     <div className={`h-full rounded-full ${i === 0 ? 'bg-emerald-600' : 'bg-[#bc1313]'}`} style={{ width: `${match.match_score}%` }}></div>
                   </div>
                   {i === optimalIndex && <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded">Best fit</span>}
                   {i === selectedIndex && i !== optimalIndex && <span className="text-[9px] font-bold bg-red-50 text-[#bc1313] px-2 py-1 rounded border border-red-100">Selected</span>}
                </div>
              ))}
            </div>

            <CareerSectionHeading title="SKILL GAP ANALYSIS" />
            <div className="bg-linear-to-br from-white via-[#fffbfb] to-[#fff3f3] rounded-xl border border-[#f1d7d7] p-6 shadow-[0_12px_30px_-18px_rgba(188,19,19,0.4)] mb-8">
              <div className="flex gap-4 text-[10px] font-bold text-gray-500 mb-8">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-600"></div> Strong</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Needs Improvement</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#bc1313]"></div> Missing</span>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'Mathematics/Stats', val: 90, status: 'Strong', color: 'bg-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-700' },
                  { name: 'Excel / Sheets', val: 70, status: 'Needs Improvement', color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
                  { name: 'Python Scripting', val: 55, status: 'Needs Improvement', color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
                  { name: 'SQL Databases', val: 5, status: 'Missing', color: 'bg-[#bc1313]', bg: 'bg-[#fff0f0]', text: 'text-[#bc1313]' },
                  { name: 'Data Visualization', val: 10, status: 'Missing', color: 'bg-[#bc1313]/60', bg: 'bg-[#fff0f0]', text: 'text-[#bc1313]' },
                  { name: 'Power BI / Tableau', val: 0, status: 'Missing', color: 'bg-[#bc1313]/40', bg: 'bg-[#fff0f0]', text: 'text-[#bc1313]' },
                ].map(sk => (
                   <div key={sk.name} className="flex items-center justify-between gap-4">
                     <span className="w-36 text-[11px] font-extrabold text-gray-900 shrink-0">{sk.name}</span>
                     <div className="flex-1 bg-white h-1.5 rounded-full"><div className={`${sk.color} h-full rounded-full`} style={{ width: `${Math.max(sk.val, 2)}%` }}></div></div>
                     <span className={`w-8 text-right text-[11px] font-bold ${sk.text}`}>{sk.val}%</span>
                     <span className={`w-28 text-center text-[9px] font-bold px-2 py-0.5 rounded ${sk.bg} ${sk.text}`}>{sk.status}</span>
                   </div>
                ))}
              </div>
            </div>

            <CareerSectionHeading title="AI INSIGHTS & RECOMMENDATIONS" />
            <div className="bg-linear-to-br from-white via-[#fffbfb] to-[#fff3f3] rounded-xl border border-[#f1d7d7] shadow-[0_12px_30px_-18px_rgba(188,19,19,0.4)] overflow-hidden mb-8">
              <div className="p-4 border-b border-gray-100 flex gap-3 items-center">
                <span className="text-emerald-600 shrink-0 font-bold">✓</span>
                <p className="text-[11px] text-gray-600">Your <strong className="text-gray-900">Mathematics score (90%)</strong> is the strongest prerequisite for data analyst roles.</p>
              </div>
              <div className="p-4 border-b border-gray-100 flex gap-3 items-center">
                <strong className="text-[#bc1313] shrink-0 font-extrabold">!</strong>
                <p className="text-[11px] text-gray-600 flex items-center gap-2">Learning <strong className="text-gray-900">SQL basics</strong> will increase your Data Analyst match by +18%. <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold text-[9px]">+18%</span></p>
              </div>
              <div className="p-4 flex gap-3 items-center">
                <span className="text-amber-500 shrink-0 font-[10px]">△</span>
                <p className="text-[11px] text-gray-600">Data Visualization tools are absent from your ILO attainment. Self-study via Kaggle recommended.</p>
              </div>
            </div>

            <CareerSectionHeading title="LEARNING RECOMMENDATIONS" />
            <div className="space-y-3 mb-12">
              <div className="bg-linear-to-br from-white via-[#fffbfb] to-[#fff3f3] rounded-xl border border-[#f1d7d7] p-5 shadow-[0_12px_30px_-20px_rgba(188,19,19,0.4)] flex justify-between items-center">
                <div>
                  <h4 className="text-[13px] font-extrabold text-gray-900 mb-0.5">Database Systems (CPEN 405)</h4>
                  <p className="text-[11px] text-gray-500">Directly builds SQL proficiency — closes your largest skill gap.</p>
                </div>
                <span className="text-[9px] font-bold bg-[#fff0f0] text-[#bc1313] border border-red-100 px-2 py-1 rounded shrink-0">Missing skill</span>
              </div>
              <div className="bg-linear-to-br from-white via-[#fffbfb] to-[#fff3f3] rounded-xl border border-[#f1d7d7] p-5 shadow-[0_12px_30px_-20px_rgba(188,19,19,0.4)] flex justify-between items-center">
                <div>
                  <h4 className="text-[13px] font-extrabold text-gray-900 mb-0.5">Data Science Elective</h4>
                  <p className="text-[11px] text-gray-500">Introduces data wrangling, Pandas, and visualization with Python.</p>
                </div>
                <span className="text-[9px] font-bold bg-[#fff0f0] text-[#bc1313] border border-red-100 px-2 py-1 rounded shrink-0">Missing skill</span>
              </div>
              <div className="bg-linear-to-br from-white via-[#fffbfb] to-[#fff3f3] rounded-xl border border-[#f1d7d7] p-5 shadow-[0_12px_30px_-20px_rgba(188,19,19,0.4)] flex justify-between items-center">
                <div>
                  <h4 className="text-[13px] font-extrabold text-gray-900 mb-0.5">Practice: Kaggle Learn (SQL)</h4>
                  <p className="text-[11px] text-gray-500">Free micro-courses in Python, SQL, and Data Visualization.</p>
                </div>
                <span className="text-[9px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded shrink-0">Self-study</span>
              </div>
            </div>
          </>
        )}


        {/* --- AI CHAT TAB CONTENT --- */}
        {activeTab === 'AI Chat' && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-0.75 h-3.5 bg-[#bc1313] rounded-sm shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">AI CAREER ASSISTANT</span>
            </div>

            {/* Pill Recommendations */}
            <div className="flex flex-wrap gap-2 mb-6">
              {CHAT_SUGGESTIONS.map(q => (
                <button
                  key={q}
                  type="button"
                  disabled={chatSending}
                  onClick={() => sendChat(q)}
                  className="px-3 py-1.5 bg-white/80 border border-[#ead4d4] text-[#6f4a4a] text-[11px] font-medium rounded hover:bg-[#fff4f4] cursor-pointer shadow-[0_10px_24px_-20px_rgba(188,19,19,0.45)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Chat History */}
            <div className="flex flex-col gap-4 mb-6 pt-2 max-h-[420px] overflow-y-auto pr-1">
              {/* Initial greeting (always shown first) */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#bc1313] text-white flex items-center justify-center text-[12px] font-bold shrink-0 shadow-sm mt-1">A</div>
                <div className="bg-linear-to-br from-white via-[#fffbfb] to-[#fff3f3] border border-[#f1d7d7] p-4 rounded-xl rounded-tl-none shadow-[0_12px_30px_-20px_rgba(188,19,19,0.4)] text-[13px] text-gray-700 leading-relaxed max-w-[85%]">
                  Hello {user?.full_name?.split(' ')[0] || 'there'}! I've analyzed your ILO/SO attainment and GitHub activity. You're aligned with <strong>{careerMatches[selectedIndex]?.title}</strong> ({careerMatches[selectedIndex]?.match_score}% match). Your strongest fit is <strong>{careerMatches[optimalIndex]?.title}</strong> at {careerMatches[optimalIndex]?.match_score}%. What would you like to explore?
                </div>
              </div>

              {chatMessages.map((m, i) => (
                m.role === 'user' ? (
                  <div key={i} className="flex items-start gap-4 justify-end">
                    <div className="bg-[#bc1313] text-white p-4 rounded-xl rounded-tr-none text-[13px] leading-relaxed max-w-[85%] shadow-[0_12px_30px_-20px_rgba(188,19,19,0.4)]">
                      {m.content}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[12px] font-bold shrink-0 shadow-sm mt-1">
                      {user?.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#bc1313] text-white flex items-center justify-center text-[12px] font-bold shrink-0 shadow-sm mt-1">A</div>
                    <div className="bg-linear-to-br from-white via-[#fffbfb] to-[#fff3f3] border border-[#f1d7d7] p-4 rounded-xl rounded-tl-none shadow-[0_12px_30px_-20px_rgba(188,19,19,0.4)] text-[13px] text-gray-700 leading-relaxed max-w-[85%] whitespace-pre-wrap">
                      {m.content}
                    </div>
                  </div>
                )
              ))}

              {chatSending && (
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#bc1313] text-white flex items-center justify-center text-[12px] font-bold shrink-0 shadow-sm mt-1">A</div>
                  <div className="bg-white/80 border border-[#f1d7d7] p-4 rounded-xl rounded-tl-none text-[13px] text-gray-500 italic">
                    Thinking…
                  </div>
                </div>
              )}

              {chatError && (
                <div className="text-[12px] text-red-600 px-2">{chatError}</div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Box */}
            <div className="relative mt-8 mb-12">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendChat();
                  }
                }}
                disabled={chatSending}
                placeholder="Ask about your career, skills, roadmap..."
                className="w-full bg-white/90 border border-[#ead4d4] text-[13px] text-gray-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-[#bc1313] focus:border-[#bc1313] shadow-[0_10px_24px_-20px_rgba(188,19,19,0.45)] pr-20 transition-all font-medium placeholder:text-gray-400 placeholder:font-normal disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => sendChat()}
                disabled={chatSending || !chatInput.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 bg-[#bc1313] hover:bg-[#9e1010] text-white text-[12px] font-bold px-5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {chatSending ? '...' : 'Send'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
