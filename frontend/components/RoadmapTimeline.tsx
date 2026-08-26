'use client';

import React from 'react';
import { 
  CheckCircle2, 
  Circle, 
  HelpCircle, 
  ExternalLink, 
  BookOpen, 
  Code2, 
  Award, 
  AlertTriangle,
  PlayCircle,
  Zap,
  ArrowRight
} from 'lucide-react';
import { RoadmapStep } from '../lib/api';

interface RoadmapTimelineProps {
  roadmap: RoadmapStep[];
  targetRole: string;
  onExplainClick: (step: RoadmapStep) => void;
  onQuizClick: (step: RoadmapStep) => void;
}

export default function RoadmapTimeline({
  roadmap,
  targetRole,
  onExplainClick,
  onQuizClick,
}: RoadmapTimelineProps) {
  if (!roadmap || roadmap.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center text-slate-400">
        No roadmap generated yet. Complete onboarding above to build your path.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Your Personalized Learning Path</h2>
          <p className="text-xs text-slate-400">
            Topologically ordered DAG respecting prerequisite dependencies
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          {roadmap.length} Milestones
        </span>
      </div>

      <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-cyan-500 before:to-emerald-500">
        {roadmap.map((step, idx) => {
          const isCompleted = step.status === 'completed';
          const isInProgress = step.status === 'in_progress';
          const isRemedial = step.is_remedial;

          return (
            <div key={step.step_id || idx} className="relative group">
              {/* Timeline Node Icon */}
              <div
                className={`absolute -left-6 sm:-left-8 top-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-transform group-hover:scale-110 shadow-lg ${
                  isCompleted
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-600/30'
                    : isRemedial
                    ? 'bg-amber-600 border-amber-400 text-white shadow-amber-600/30 animate-pulse'
                    : isInProgress
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-indigo-600/30'
                    : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isRemedial ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : isInProgress ? (
                  <PlayCircle className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-mono font-bold">{step.step}</span>
                )}
              </div>

              {/* Step Card */}
              <div
                className={`glass-card glass-card-hover rounded-2xl p-5 border transition-all ${
                  isRemedial
                    ? 'border-amber-500/50 bg-amber-950/20 shadow-lg shadow-amber-950/20'
                    : isInProgress
                    ? 'border-indigo-500/50 bg-indigo-950/20 shadow-lg shadow-indigo-950/20 ring-1 ring-indigo-500/30'
                    : isCompleted
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : 'border-slate-800/80 bg-slate-900/60'
                }`}
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                      Step {step.step}
                    </span>
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {step.skill_name}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {isRemedial && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Remedial Refresher
                      </span>
                    )}
                    {isInProgress && (
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                        In Progress
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                        Mastered
                      </span>
                    )}
                    {step.status === 'not_started' && !isRemedial && (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium">
                        Upcoming
                      </span>
                    )}
                  </div>
                </div>

                {/* Prerequisites Tags */}
                {step.prerequisites && step.prerequisites.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-medium">Prerequisites:</span>
                    {step.prerequisites.map((prereq, pIdx) => (
                      <span
                        key={pIdx}
                        className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300 text-[10px]"
                      >
                        {prereq}
                      </span>
                    ))}
                  </div>
                )}

                {/* Resource Card */}
                {step.resource && (
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                        {step.resource.type === 'project' ? (
                          <Code2 className="w-4 h-4" />
                        ) : (
                          <BookOpen className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold block">
                          {step.resource.type || 'Course'}
                        </span>
                        <a
                          href={step.resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-slate-200 hover:text-indigo-400 truncate block transition-colors"
                        >
                          {step.resource.title}
                        </a>
                      </div>
                    </div>

                    <a
                      href={step.resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Open Resource"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                  {/* Why this explanation trigger */}
                  <button
                    type="button"
                    onClick={() => onExplainClick(step)}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Why this recommendation?
                  </button>

                  {/* Adaptive Quiz & Feedback trigger */}
                  <button
                    type="button"
                    onClick={() => onQuizClick(step)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-200 text-xs font-medium transition-all cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-indigo-400" />
                    Test Quiz & Adaptive Signal
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
