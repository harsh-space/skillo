'use client';

import React from 'react';
import { Network, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { RoadmapStep, GapSummary } from '../lib/api';

interface SkillGraphVisualizerProps {
  roadmap: RoadmapStep[];
  currentSkills: string[];
  gapSummary?: GapSummary;
}

export default function SkillGraphVisualizer({
  roadmap,
  currentSkills,
  gapSummary,
}: SkillGraphVisualizerProps) {
  const completedCount = roadmap.filter((s) => s.status === 'completed').length;
  const inProgressCount = roadmap.filter((s) => s.status === 'in_progress').length;
  const totalSteps = roadmap.length;
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-bold">
          <Network className="w-5 h-5 text-indigo-400" />
          <span>Competency & DAG Trajectory</span>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
          {progressPct}% Completion
        </span>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
          <span>Mastery Progress</span>
          <span className="text-white font-semibold">{completedCount} of {totalSteps} skills</span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 rounded-full transition-all duration-500 shadow-sm shadow-indigo-500/50"
            style={{ width: `${Math.max(5, progressPct)}%` }}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium mb-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Mastered</span>
          </div>
          <span className="text-xl font-bold text-white">
            {currentSkills.length + completedCount}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">skills acquired</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Remaining Gap</span>
          </div>
          <span className="text-xl font-bold text-white">
            {totalSteps - completedCount}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">skills to complete</span>
        </div>
      </div>

      {/* Skill Nodes Flow */}
      <div>
        <span className="text-xs font-semibold text-slate-300 block mb-3 uppercase tracking-wider">
          Topological Skill Trajectory:
        </span>
        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
          {roadmap.map((s, idx) => {
            const isCompleted = s.status === 'completed';
            const isInProgress = s.status === 'in_progress';
            const isRemedial = s.is_remedial;

            return (
              <div
                key={s.step_id || idx}
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : isRemedial
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                    : isInProgress
                    ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-200 shadow-sm shadow-indigo-500/10'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300">
                    #{s.step}
                  </span>
                  <span className="font-semibold truncate">{s.skill_name}</span>
                </div>

                <span className="text-[10px] font-mono capitalize shrink-0 ml-2">
                  {isRemedial ? 'Remedial' : s.status.replace('_', ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
