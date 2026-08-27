'use client';

import React from 'react';
import { X, Sparkles, Network, Target, CheckCircle2, ShieldCheck } from 'lucide-react';
import { RoadmapStep } from '../lib/api';

interface XaiDrawerProps {
  step: RoadmapStep | null;
  targetRole: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function XaiDrawer({ step, targetRole, isOpen, onClose }: XaiDrawerProps) {
  if (!isOpen || !step) return null;

  return (
    /* Compact Sticky Card fitting directly into the column area beside the roadmap */
    <div className="sticky top-24 glass-card rounded-2xl p-4 sm:p-5 border border-indigo-500/40 shadow-2xl shadow-black/80 backdrop-blur-xl bg-slate-950/85 animate-in fade-in slide-in-from-top-3 duration-200 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Explainable AI (XAI)</h3>
            <span className="text-[10px] text-slate-400 font-medium">Step #{step.step} Recommendation</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close Pop-up"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Skill Milestone Title */}
      <div>
        <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full font-bold inline-block ${
          step.is_remedial ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
        }`}>
          {step.is_remedial ? 'Remedial Module' : `Step ${step.step} Milestone`}
        </span>
        <h2 className="text-lg font-extrabold text-white mt-1 tracking-tight truncate">{step.skill_name}</h2>
      </div>

      {/* Grounded Plain-Language Explanation */}
      <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-950/30 shadow-inner">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300 mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>Grounded Justification:</span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-sans">
          {step.explanation || "Recommended to satisfy prerequisite dependencies and close core competency gaps identified from your goal."}
        </p>
      </div>

      {/* Fact Matrix */}
      <div className="space-y-2 text-xs">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Underlying Signals:
        </h4>

        {/* Target Role */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[9px] text-slate-400 block">Target Role</span>
            <span className="text-xs font-semibold text-white truncate block">{targetRole}</span>
          </div>
        </div>

        {/* Prerequisites */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2">
          <Network className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="text-[9px] text-slate-400 block">Prerequisites</span>
            {step.prerequisites && step.prerequisites.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {step.prerequisites.map((p, idx) => (
                  <span key={idx} className="px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px] font-medium">
                    {p}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[10px] text-slate-300 font-medium">Foundational</span>
            )}
          </div>
        </div>

        {/* Gap Score */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[9px] text-slate-400 block">Skill Gap Similarity</span>
            <span className="text-xs font-semibold text-white">
              {step.gap_score ? `${(step.gap_score * 100).toFixed(0)}% Profile Similarity` : "0% Prior Coverage"}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
      >
        Dismiss
      </button>
    </div>
  );
}
