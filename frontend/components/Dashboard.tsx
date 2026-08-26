'use client';

import React, { useState, useEffect } from 'react';
import { Target, RefreshCw, Compass, Award, Sparkles, ChevronLeft } from 'lucide-react';
import RoadmapTimeline from './RoadmapTimeline';
import SkillGraphVisualizer from './SkillGraphVisualizer';
import QuizModal from './QuizModal';
import XaiDrawer from './XaiDrawer';
import { RoadmapStep, RoadmapData, fetchRoadmap } from '../lib/api';

interface DashboardProps {
  learnerData: {
    learner_id: string;
    name: string;
    current_skills: string[];
    target_role: string;
    target_role_id: string;
    target_skills: string[];
  };
  onReset: () => void;
}

export default function Dashboard({ learnerData, onReset }: DashboardProps) {
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeExplainStep, setActiveExplainStep] = useState<RoadmapStep | null>(null);
  const [activeQuizStep, setActiveQuizStep] = useState<RoadmapStep | null>(null);

  const loadRoadmap = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRoadmap(learnerData.learner_id);
      setRoadmapData(data);
    } catch (err) {
      console.error('Roadmap fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoadmap();
  }, [learnerData.learner_id]);

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

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Back to Onboarding / Goal"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-400">Learner Profile:</span>
              <span className="text-xs font-bold text-white px-2 py-0.5 rounded bg-slate-800">
                {learnerData.name} ({learnerData.learner_id})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 flex items-center gap-2">
              <Compass className="w-6 h-6 text-indigo-400" />
              Target Role: <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">{roadmapData?.target_role || learnerData.target_role}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadRoadmap}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Path
          </button>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            New Goal
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-base font-bold text-white">Running Skill Gap Vector Analysis...</h3>
          <p className="text-xs text-slate-400 mt-1">Generating DAG topological sequence and XAI groundings</p>
        </div>
      ) : (
        /* Main Layout Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Roadmap Timeline (7 cols) */}
          <div className="lg:col-span-8">
            <RoadmapTimeline
              roadmap={roadmapData?.roadmap || []}
              targetRole={roadmapData?.target_role || learnerData.target_role}
              onExplainClick={(step) => setActiveExplainStep(step)}
              onQuizClick={(step) => setActiveQuizStep(step)}
            />
          </div>

          {/* Right Column: Visualizer & Gap Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <SkillGraphVisualizer
              roadmap={roadmapData?.roadmap || []}
              currentSkills={learnerData.current_skills}
              gapSummary={roadmapData?.gap_summary}
            />

            {/* Gap Analysis Summary Card */}
            {roadmapData?.gap_summary && (
              <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <span>Gap Analysis Summary</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1 font-medium">
                      Identified Competency Gaps:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {roadmapData.gap_summary.missing_skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[10px] font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {roadmapData.gap_summary.matched_skills.length > 0 && (
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1 font-medium">
                        Matched Prior Competencies:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {roadmapData.gap_summary.matched_skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[10px] font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* XAI Explain Modal / Drawer */}
      <XaiDrawer
        step={activeExplainStep}
        targetRole={roadmapData?.target_role || learnerData.target_role}
        isOpen={!!activeExplainStep}
        onClose={() => setActiveExplainStep(null)}
      />

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
