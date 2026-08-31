'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Target, 
  RefreshCw, 
  Compass, 
  Sparkles, 
  ChevronLeft, 
  CheckCircle2, 
  Clock, 
  Network, 
  X,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import RoadmapTimeline from './RoadmapTimeline';
import QuizModal from './QuizModal';
import XaiDrawer from './XaiDrawer';
import { RoadmapStep, RoadmapData, generateRoadmap, fetchRoadmap } from '../lib/api';

interface DashboardProps {
  learnerData: {
    learner_id: string;
    name: string;
    current_skills: string[];
    target_role: string;
    target_role_id: string;
    target_skills: string[];
  };
  initialRoadmapData?: RoadmapData | null;
  onReset: () => void;
}

export default function Dashboard({ learnerData, initialRoadmapData, onReset }: DashboardProps) {
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(initialRoadmapData || null);
  const [isLoading, setIsLoading] = useState(!initialRoadmapData);
  const [activeExplainStep, setActiveExplainStep] = useState<RoadmapStep | null>(null);
  const [activeQuizStep, setActiveQuizStep] = useState<RoadmapStep | null>(null);
  
  // State for active floating flyout panel ('mastered' | 'gap' | 'trajectory' | null)
  const [activeFloatingPanel, setActiveFloatingPanel] = useState<'mastered' | 'gap' | 'trajectory' | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const loadRoadmap = async () => {
    setIsLoading(true);
    try {
      // Read the persisted roadmap from DB (preserves all quiz status changes)
      const data = await fetchRoadmap(learnerData.learner_id);
      setRoadmapData(data);
    } catch (err) {
      console.error('Roadmap fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshRoadmap = async () => {
    setIsLoading(true);
    try {
      // Force-regenerate fresh roadmap from current skills (wipes quiz status)
      const data = await generateRoadmap(learnerData.learner_id);
      setRoadmapData(data);
    } catch (err) {
      console.error('Roadmap refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialRoadmapData && initialRoadmapData.target_role_id === learnerData.target_role_id) {
      setRoadmapData(initialRoadmapData);
      setIsLoading(false);
    } else {
      loadRoadmap();
    }
  }, [learnerData.learner_id, learnerData.target_role_id, initialRoadmapData]);

  // Click outside to close active panel
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setActiveFloatingPanel(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFeedbackApplied = (feedbackResponse: any) => {
    if (feedbackResponse?.updated_roadmap) {
      setRoadmapData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          roadmap: feedbackResponse.updated_roadmap,
          updated_at: new Date().toISOString(),
        };
      });
    } else {
      loadRoadmap();
    }
  };

  const roadmap = roadmapData?.roadmap || [];
  const completedCount = roadmap.filter((s) => s.status === 'completed').length;
  const totalSteps = roadmap.length;
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
  const masteredTotal = learnerData.current_skills.length + completedCount;
  const remainingGapCount = totalSteps - completedCount;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 relative pb-24">
      {/* Top Header Information */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Back to Onboarding / Goal"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-400">Learner Profile:</span>
              <span className="text-xs font-bold text-white px-2 py-0.5 rounded bg-slate-800">
                {learnerData.name}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 flex items-center gap-2">
              <Compass className="w-6 h-6 text-indigo-400" />
              Target Role: <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">{roadmapData?.target_role || learnerData.target_role}</span>
            </h1>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-base font-bold text-white">Running Skill Gap Vector Analysis...</h3>
          <p className="text-xs text-slate-400 mt-1">Generating DAG topological sequence and XAI groundings</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Horizontal Action Bar / Stats Ribbon directly above roadmap */}
          <div ref={toolbarRef} className="relative z-20">
            <div className="glass-card rounded-2xl p-2.5 sm:p-3 border border-slate-800/90 shadow-xl backdrop-blur-xl bg-slate-950/80 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
              {/* Left Group: Metric & Expandable Stats */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {/* 1. % Completed Indicator (Non-expandable) */}
                <div 
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2 cursor-default select-none shadow-inner"
                  title={`Mastery Progress: ${progressPct}% (${completedCount}/${totalSteps} skills)`}
                >
                  <span className="text-xs sm:text-sm font-mono font-bold bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                    {progressPct}%
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Done
                  </span>
                </div>

                {/* 2. Mastered (Click to expand) */}
                <button
                  type="button"
                  onClick={() => setActiveFloatingPanel((prev) => (prev === 'mastered' ? null : 'mastered'))}
                  className={`px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                    activeFloatingPanel === 'mastered'
                      ? 'bg-emerald-600/30 border border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900/80 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 text-emerald-400'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Mastered</span>
                  <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                    {masteredTotal}
                  </span>
                  {activeFloatingPanel === 'mastered' ? <ChevronUp className="w-3.5 h-3.5 opacity-70" /> : <ChevronDown className="w-3.5 h-3.5 opacity-70" />}
                </button>

                {/* 3. Remaining Gap (Click to expand) */}
                <button
                  type="button"
                  onClick={() => setActiveFloatingPanel((prev) => (prev === 'gap' ? null : 'gap'))}
                  className={`px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                    activeFloatingPanel === 'gap'
                      ? 'bg-rose-600/30 border border-rose-400 text-rose-300 shadow-md shadow-rose-500/20'
                      : 'bg-slate-900/80 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-rose-400'
                  }`}
                >
                  <Clock className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Remaining Gap</span>
                  <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                    {remainingGapCount}
                  </span>
                  {activeFloatingPanel === 'gap' ? <ChevronUp className="w-3.5 h-3.5 opacity-70" /> : <ChevronDown className="w-3.5 h-3.5 opacity-70" />}
                </button>

                {/* 4. DAG Trajectory (Click to expand) */}
                <button
                  type="button"
                  onClick={() => setActiveFloatingPanel((prev) => (prev === 'trajectory' ? null : 'trajectory'))}
                  className={`px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                    activeFloatingPanel === 'trajectory'
                      ? 'bg-indigo-600/30 border border-indigo-400 text-indigo-300 shadow-md shadow-indigo-500/20'
                      : 'bg-slate-900/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 text-indigo-400'
                  }`}
                >
                  <Network className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="hidden sm:inline">DAG Trajectory</span>
                  <span className="sm:hidden">DAG</span>
                  {activeFloatingPanel === 'trajectory' ? <ChevronUp className="w-3.5 h-3.5 opacity-70" /> : <ChevronDown className="w-3.5 h-3.5 opacity-70" />}
                </button>
              </div>

              {/* Right Group: Action Buttons */}
              <div className="flex items-center gap-2">
                {/* 5. Refresh Path Button */}
                <button
                  type="button"
                  onClick={refreshRoadmap}
                  disabled={isLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 group"
                  title="Recalculate Path from scratch"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-300 group-hover:text-white transition-transform ${isLoading ? 'animate-spin' : 'group-hover:rotate-45'}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                {/* 6. New Goal Button */}
                <button
                  type="button"
                  onClick={onReset}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-95 group"
                  title="New Goal / Reset"
                >
                  <Sparkles className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>New Goal</span>
                </button>
              </div>
            </div>

            {/* Expandable Dropdown Flyout Panel (Positioned directly below the toolbar) */}
            {activeFloatingPanel && (
              <div className="mt-3 glass-card rounded-2xl p-5 border border-slate-700/80 shadow-2xl shadow-black/70 animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-white">
                    {activeFloatingPanel === 'mastered' && (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Mastered Competencies ({masteredTotal} acquired)</span>
                      </>
                    )}
                    {activeFloatingPanel === 'gap' && (
                      <>
                        <Clock className="w-4 h-4 text-rose-400" />
                        <span>Skill Gap Breakdown ({remainingGapCount} remaining to complete)</span>
                      </>
                    )}
                    {activeFloatingPanel === 'trajectory' && (
                      <>
                        <Network className="w-4 h-4 text-indigo-400" />
                        <span>Topological Trajectory Sequence</span>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveFloatingPanel(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Mastered Panel Content */}
                {activeFloatingPanel === 'mastered' && (
                  <div className="space-y-3">
                    <span className="text-xs text-slate-400 block font-medium">Acquired Prior & Mastered Roadmapped Skills:</span>
                    <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-1">
                      {learnerData.current_skills.map((skill, idx) => (
                        <span
                          key={`curr_${idx}`}
                          className="px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {skill} <span className="text-[10px] opacity-70">(Prior)</span>
                        </span>
                      ))}
                      {roadmap
                        .filter((s) => s.status === 'completed')
                        .map((s, idx) => (
                          <span
                            key={`comp_${idx}`}
                            className="px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            {s.skill_name}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Gap Analysis Panel Content */}
                {activeFloatingPanel === 'gap' && (
                  <div className="space-y-3">
                    <span className="text-xs text-slate-400 block font-medium">
                      Skill Gap Trajectory for {roadmapData?.target_role || learnerData.target_role}:
                    </span>
                    <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-1">
                      {/* 1. Remaining Incomplete Steps */}
                      {roadmap
                        .filter((s) => s.status !== 'completed')
                        .map((s, idx) => (
                          <span
                            key={`rem_${idx}`}
                            className={`px-3 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 ${
                              s.is_remedial
                                ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                                : s.status === 'in_progress'
                                ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300'
                                : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                            }`}
                          >
                            <Clock className="w-3 h-3 text-rose-400" />
                            {s.skill_name}
                            <span className="text-[10px] opacity-70">
                              ({s.is_remedial ? 'Remedial' : s.status === 'in_progress' ? 'In Progress' : 'Pending'})
                            </span>
                          </span>
                        ))}

                      {/* 2. Completed Steps from Gap */}
                      {roadmap
                        .filter((s) => s.status === 'completed')
                        .map((s, idx) => (
                          <span
                            key={`comp_gap_${idx}`}
                            className="px-3 py-1 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1.5 opacity-80"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span className="line-through opacity-80">{s.skill_name}</span>
                            <span className="text-[10px] text-emerald-400 font-semibold">(Mastered)</span>
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Trajectory Panel Content */}
                {activeFloatingPanel === 'trajectory' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                    {roadmap.map((s, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          s.status === 'completed'
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                            : s.is_remedial
                            ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                            : s.status === 'in_progress'
                            ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-200'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            #{s.step}
                          </span>
                          <span className="font-semibold truncate">{s.skill_name}</span>
                        </div>
                        <span className="text-[10px] capitalize shrink-0 ml-2 font-mono">
                          {s.is_remedial ? 'Remedial' : s.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Main Roadmap Timeline & Inline XAI Side-Panel */}
          <div className={`w-full transition-all duration-300 ${activeExplainStep ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start' : ''}`}>
            <div className={activeExplainStep ? 'lg:col-span-7 xl:col-span-8' : 'w-full'}>
              <RoadmapTimeline
                roadmap={roadmap}
                targetRole={roadmapData?.target_role || learnerData.target_role}
                onExplainClick={(step) => {
                  // Toggle if clicking same step, otherwise switch
                  if (activeExplainStep?.step_id === step.step_id || activeExplainStep?.step === step.step) {
                    setActiveExplainStep(null);
                  } else {
                    setActiveExplainStep(step);
                  }
                }}
                onQuizClick={(step) => setActiveQuizStep(step)}
              />
            </div>

            {/* Right Column: Compact XAI pop-up card occupying the empty right area */}
            {activeExplainStep && (
              <div className="lg:col-span-5 xl:col-span-4 animate-in fade-in slide-in-from-right-3 duration-200">
                <XaiDrawer
                  step={activeExplainStep}
                  targetRole={roadmapData?.target_role || learnerData.target_role}
                  isOpen={!!activeExplainStep}
                  onClose={() => setActiveExplainStep(null)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Adaptive Quiz & Feedback Modal */}
      {activeQuizStep && (
        <QuizModal
          learnerId={learnerData.learner_id}
          step={activeQuizStep}
          isOpen={!!activeQuizStep}
          onClose={() => setActiveQuizStep(null)}
          onFeedbackApplied={handleFeedbackApplied}
        />
      )}
    </div>
  );
}
