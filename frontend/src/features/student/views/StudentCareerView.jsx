import React, { useState } from 'react';
import { Target, TrendingUp, Layers, ChevronRight, Activity, Zap, CheckCircle2, ChevronDown, ListEnd, Star } from 'lucide-react';
import useCareerCoach from '../hooks/useCareerCoach';

import CareerEmptyState from '../components/CareerEmptyState';
import CareerPathCard from '../components/CareerPathCard';
import CareerMatchDonut from '../components/CareerMatchDonut';
import CareerMarketTab from '../components/CareerMarketTab';
import CareerAllPathsModal from '../components/CareerAllPathsModal';
import CareerSectionHeading from '../components/CareerSectionHeading';

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
    market,
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
    <div className="p-6 lg:p-8 space-y-6 pb-24 h-full overflow-y-auto custom-scrollbar bg-[#fafafa]">
        {/* ── New Screenshot Design Implementation ── */}
        <div className="flex flex-col mb-4">
          <h1 className="text-[26px] font-extrabold text-gray-900 mb-1 leading-none">Choose Your Path</h1>
          <p className="text-[12px] text-gray-500 mb-6">Select a specialized trajectory to align your skill acquisition with global market demands. Each path is curated by AI intelligence and heritage expertise.</p>
          
          {/* Progress Banner */}
          {progression && (
            <div className="mb-6">
              {progression.first_run ? (
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm">
                  <h3 className="font-extrabold text-emerald-900 text-[14px] mb-1">Welcome to ASPIRE!</h3>
                  <p className="text-[12px] text-emerald-700">{progression.motivational_insight}</p>
                </div>
              ) : (
                <div className="bg-white border-2 border-gray-100 p-6 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-extrabold text-gray-900 text-[16px]">Your progress — {progression.chosen_career}</h3>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded">
                      +{progression.readiness_change}% since last report ({progression.days_since_last_report} days ago)
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
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
                      <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl">
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

          <div className="flex justify-between items-end border-b border-gray-200 pb-0">
            <div className="flex gap-8 font-bold text-[12px]">
              <span onClick={() => setActiveTab('Roadmap')} className={`cursor-pointer pb-3 px-1 border-b-[3px] transition-colors ${activeTab === 'Roadmap' ? 'text-[#bc1313] border-[#bc1313]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>Roadmap</span>
              <span onClick={() => setActiveTab('Insights')} className={`cursor-pointer pb-3 px-1 border-b-[3px] transition-colors ${activeTab === 'Insights' ? 'text-[#bc1313] border-[#bc1313]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>Insights</span>
              <span onClick={() => setActiveTab('AI Chat')} className={`cursor-pointer pb-3 px-1 border-b-[3px] transition-colors ${activeTab === 'AI Chat' ? 'text-[#bc1313] border-[#bc1313]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>AI Chat</span>
              <span onClick={() => setActiveTab('Market Trends')} className={`cursor-pointer pb-3 px-1 border-b-[3px] transition-colors ${activeTab === 'Market Trends' ? 'text-[#bc1313] border-[#bc1313]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>Market Trends</span>
            </div>
            <span className="text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer mb-3 font-semibold transition-colors">View All Trajectories</span>
          </div>
        </div>

        {/* Path Metadata Strip */}
        <div className="flex items-center gap-4 mb-4 mt-8">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Path:</span>
          <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer bg-white hover:bg-gray-50 transition-colors shadow-sm">
            <span className="text-[12px] font-bold text-gray-900">{careerMatches[selectedIndex]?.title || 'Embedded Systems Engineer'}</span>
            <ChevronDown size={14} className="text-gray-500" />
          </div>
          <button className="text-[12px] font-bold text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 shadow-sm transition-colors">
            View All Paths
          </button>
        </div>

        <div className="flex items-center gap-2 text-[12px] mb-6 border-b border-gray-100 pb-4">
          <span className="text-gray-500">Selected path:</span>
          <span className="font-extrabold text-gray-900 ml-1">{careerMatches[selectedIndex]?.title}</span>
          <span className={`${selectedIndex === optimalIndex ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} font-bold px-2 py-0.5 text-[11px] rounded flex items-center ml-1`}>
            {careerMatches[selectedIndex]?.match_score}% Match
          </span>
          <span className="text-[#bc1313] hover:text-[#9e1010] cursor-pointer font-semibold underline underline-offset-2 ml-1">Change path</span>
        </div>

        {/* Dynamic AI Recommendation Warning */}
        {selectedIndex !== optimalIndex && (
          <div className="bg-[#fff8f8] border border-[#fdd8d8] p-3.5 mb-6 rounded-lg flex items-start gap-3 shadow-sm">
            <div className="w-[18px] h-[18px] rounded-full bg-[#bc1313] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm text-[11px] font-extrabold italic">!</div>
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
        <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-8 mb-6 flex flex-col lg:flex-row items-center gap-10">
          
          {/* Left: Info Grid */}
          <div className="flex-1 space-y-4">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest border border-gray-200 rounded-full px-3 py-1 bg-gray-50">PRIMARY OBJECTIVE</span>
            <div>
              <h2 className="text-[22px] font-extrabold text-gray-900 leading-tight">Senior {careerMatches[selectedIndex]?.title || 'Embedded Systems Architect'}</h2>
              <p className="text-[12px] text-gray-500 mt-1 font-medium">{selectedIndex === 0 ? 'Specializing in Real-Time Systems & IoT Infrastructure' : 'Specializing in Engineering Analytics & Business Intelligence'}</p>
            </div>
            
            <div className="flex gap-3 pt-3">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex-1">
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-1">MARKET OUTLOOK</span>
                <span className="text-[13px] font-bold text-gray-900 flex items-center gap-1"><TrendingUp size={12} className="text-emerald-500" /> High Growth</span>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex-1">
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-1">MEDIAN TENURE</span>
                <span className="text-[13px] font-bold text-gray-900">{selectedIndex === 0 ? '4.1 Years' : '3.6 Years'}</span>
              </div>
            </div>
          </div>

          {/* Center: Donut */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center -mt-2">
             <div className="scale-125 mb-3"><CareerMatchDonut score={careerMatches[selectedIndex]?.match_score || 92} /></div>
             <p className="text-[9px] text-gray-400 font-medium text-center max-w-[120px] leading-tight mt-1">Based on ILO/SO attainment and GitHub activity</p>
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
        <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-8 mb-6 mt-10">
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
            <div className="absolute top-1/2 left-6 right-6 h-[2px] bg-gradient-to-r from-gray-200 via-gray-200 to-gray-100 -translate-y-1/2 z-0"></div>
            
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
          <div className="w-[3px] h-3.5 bg-[#bc1313] rounded-sm flex-shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 flex items-center gap-1.5"><Star size={12} className="text-[#bc1313]" fill="#bc1313" /> CURATED RECOMMENDATIONS</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer">
            <span className="text-[9px] font-bold text-[#bc1313] uppercase tracking-widest mb-3">ELECTIVE COURSE</span>
            <h4 className="text-[14px] font-extrabold text-gray-900 leading-snug mb-2">CPEN 315: Microcontrollers & Embedded</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed mb-6 flex-1">Closes RTOS gap with hands-on ARM Cortex-M firmware development.</p>
            <div className="flex justify-between items-end mt-auto text-gray-400">
               <span className="text-[10px] uppercase font-bold tracking-widest">Prof. Santos</span>
               <ChevronRight size={14} className="text-gray-300" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer">
            <span className="text-[9px] font-bold text-[#bc1313] uppercase tracking-widest mb-3">INDUSTRY PROJECT</span>
            <h4 className="text-[14px] font-extrabold text-gray-900 leading-snug mb-2">Arduino IoT Monitoring System</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed mb-6 flex-1">Validates embedded skills with a deployable hardware project.</p>
            <div className="flex justify-between items-end mt-auto text-gray-400">
               <span className="text-[10px] uppercase font-bold tracking-widest">GitHub Collaborative</span>
               <ChevronRight size={14} className="text-gray-300" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#7a0e0e] rounded-2xl shadow-md p-6 flex flex-col h-full text-white cursor-pointer relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#bc1313] opacity-50 blur-[50px] rounded-full group-hover:opacity-75 transition-opacity" />
            <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-3 relative z-10">CAREER SENTIMENT</span>
            <h4 className="text-[18px] font-medium leading-snug mb-2 relative z-10 pr-4 drop-shadow-sm">
               Demand for Embedded Engineers has grown <strong className="font-extrabold">18%</strong> this quarter.
            </h4>
            <p className="text-[11px] text-white/60 leading-relaxed mb-6 flex-1 relative z-10 pr-2">
               IoT and semiconductor sectors prioritize firmware expertise — aligned with your thesis direction.
            </p>
            <div className="flex justify-between items-center mt-auto relative z-10 w-full">
               <div className="flex -space-x-2">
                 <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center font-bold text-gray-700 text-[9px] border border-[#7a0e0e]">A</div>
                 <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-700 text-[9px] border border-[#7a0e0e]">B</div>
                 <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700 text-[9px] border border-[#7a0e0e]">C</div>
               </div>
               <span className="text-[9px] uppercase tracking-widest font-bold text-white/60 text-right">3 ADVISORS</span>
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
                <div key={i} className={`bg-white rounded-xl border p-5 shadow-sm relative ${selectedIndex === i ? 'border-red-200 bg-[#fff8f8]' : 'border-gray-200'}`}>
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
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
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
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex justify-between items-center">
                <div>
                  <h4 className="text-[13px] font-extrabold text-gray-900 mb-0.5">Database Systems (CPEN 405)</h4>
                  <p className="text-[11px] text-gray-500">Directly builds SQL proficiency — closes your largest skill gap.</p>
                </div>
                <span className="text-[9px] font-bold bg-[#fff0f0] text-[#bc1313] border border-red-100 px-2 py-1 rounded shrink-0">Missing skill</span>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex justify-between items-center">
                <div>
                  <h4 className="text-[13px] font-extrabold text-gray-900 mb-0.5">Data Science Elective</h4>
                  <p className="text-[11px] text-gray-500">Introduces data wrangling, Pandas, and visualization with Python.</p>
                </div>
                <span className="text-[9px] font-bold bg-[#fff0f0] text-[#bc1313] border border-red-100 px-2 py-1 rounded shrink-0">Missing skill</span>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex justify-between items-center">
                <div>
                  <h4 className="text-[13px] font-extrabold text-gray-900 mb-0.5">Practice: Kaggle Learn (SQL)</h4>
                  <p className="text-[11px] text-gray-500">Free micro-courses in Python, SQL, and Data Visualization.</p>
                </div>
                <span className="text-[9px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded shrink-0">Self-study</span>
              </div>
            </div>
          </>
        )}

        {/* --- MARKET TRENDS TAB CONTENT --- */}
        {activeTab === 'Market Trends' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
            {/* Job Demand Growth */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2">JOB DEMAND GROWTH</span>
              <h3 className="text-3xl font-extrabold text-gray-900 mb-1">18%</h3>
              <p className="text-[11px] text-gray-500 mb-3">Year-over-year in the Philippine tech sector</p>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1"><TrendingUp size={12} /> Above average</span>
            </div>
            
            {/* Average Monthly Salary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2">AVERAGE MONTHLY SALARY</span>
              <h3 className="text-3xl font-extrabold text-gray-900 mb-1">₱46K</h3>
              <p className="text-[11px] text-gray-500 mb-3">Mid-level {careerMatches[selectedIndex]?.title} in the Philippines</p>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1"><TrendingUp size={12} /> Growing</span>
            </div>

            {/* Median Tenure */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2">MEDIAN TENURE</span>
              <h3 className="text-3xl font-extrabold text-gray-900 mb-1">4.1 Years</h3>
              <p className="text-[11px] text-gray-500">Average time before first promotion in this career track</p>
            </div>

            {/* Market Outlook (Dark Red) */}
            <div className="bg-[#7a0e0e] rounded-xl shadow-md p-6 text-white relative overflow-hidden group flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#bc1313] opacity-40 blur-[60px] rounded-full" />
              <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest block mb-2 relative z-10">MARKET OUTLOOK</span>
              <h3 className="text-3xl font-extrabold text-white mb-2 relative z-10">High Growth</h3>
              <p className="text-[12px] text-white/70 mb-4 relative z-10">Based on current hiring trends aligned with your profile and trajectory</p>
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 relative z-10"><Zap size={12} fill="currentColor" /> AI Recommended</span>
            </div>
            
            {/* Top PH Locations */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2">TOP PH LOCATIONS</span>
              <p className="text-[13px] font-bold text-gray-900 mt-2">Laguna Technopark · Clark · Cebu</p>
            </div>

            {/* Your Readiness Score */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2">YOUR READINESS SCORE</span>
              <h3 className="text-3xl font-extrabold text-gray-900 mb-1">{careerMatches[selectedIndex]?.match_score}%</h3>
              <p className="text-[11px] text-gray-500">Combined ILO/SO attainment, GitHub analytics, and academic trajectory</p>
            </div>
          </div>
        )}

        {/* --- AI CHAT TAB CONTENT --- */}
        {activeTab === 'AI Chat' && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-[3px] h-3.5 bg-[#bc1313] rounded-sm flex-shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">AI CAREER ASSISTANT</span>
            </div>

            {/* Pill Recommendations */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-[11px] font-medium rounded hover:bg-gray-50 cursor-pointer shadow-sm">How do I improve my match score?</span>
              <span className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-[11px] font-medium rounded hover:bg-gray-50 cursor-pointer shadow-sm">What should I focus on first?</span>
              <span className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-[11px] font-medium rounded hover:bg-gray-50 cursor-pointer shadow-sm">Which path fits me best?</span>
              <span className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-[11px] font-medium rounded hover:bg-gray-50 cursor-pointer shadow-sm">Show me my skill gaps</span>
            </div>

            {/* Chat History Box */}
            <div className="flex items-start gap-4 mb-6 pt-2">
              <div className="w-8 h-8 rounded-full bg-[#bc1313] text-white flex items-center justify-center text-[12px] font-bold shrink-0 shadow-sm mt-1">A</div>
              <div className="bg-white border border-gray-200 p-4 rounded-xl rounded-tl-none shadow-sm text-[13px] text-gray-700 leading-relaxed max-w-[85%]">
                Hello Don Maxwell! I've analyzed your ILO/SO attainment and GitHub activity. You're aligned with <strong>{careerMatches[selectedIndex]?.title}</strong> ({careerMatches[selectedIndex]?.match_score}% match). Your strongest fit is <strong>{careerMatches[optimalIndex]?.title}</strong> at {careerMatches[optimalIndex]?.match_score}%. What would you like to explore?
              </div>
            </div>

            {/* Input Box */}
            <div className="relative mt-12 mb-12">
              <input 
                type="text" 
                placeholder="Ask about your career, skills, roadmap..." 
                className="w-full bg-white border border-gray-200 text-[13px] text-gray-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-[#bc1313] focus:border-[#bc1313] shadow-sm pr-20 transition-all font-medium placeholder:text-gray-400 placeholder:font-normal"
              />
              <button className="absolute right-1.5 top-1.5 bottom-1.5 bg-[#bc1313] hover:bg-[#9e1010] text-white text-[12px] font-bold px-5 rounded-lg transition-colors">
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
