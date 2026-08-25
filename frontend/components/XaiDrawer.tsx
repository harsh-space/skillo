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
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="glass-card w-full max-w-md h-full p-6 border-l border-slate-700/80 shadow-2xl flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Explainable AI (XAI)</h3>
                <span className="text-[11px] text-slate-400">Step #{step.step} Recommendation Rationale</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Skill Title */}
          <div className="mb-6">
            <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-bold ${
              step.is_remedial ? 'bg-amber-500/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-300'
            }`}>
              {step.is_remedial ? 'Remedial Module' : `Step ${step.step} Milestone`}
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-1.5">{step.skill_name}</h2>
          </div>

          {/* Grounded Plain-Language Explanation */}
          <div className="glass-card rounded-xl p-4 border border-indigo-500/20 bg-indigo-950/20 mb-6">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Grounded Model Justification:</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {step.explanation || "Recommended to satisfy prerequisite dependencies and close core competency gaps identified from your goal."}
            </p>
          </div>

          {/* Fact Matrix */}
          <div className="space-y-4 mb-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Underlying Graph & Gap Signals:
            </h4>

            {/* Target Role */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <Target className="w-4 h-4 text-indigo-400 mt-0.5" />
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Career Target Alignment</span>
                <span className="text-xs font-semibold text-white">{targetRole}</span>
              </div>
            </div>

            {/* Prerequisites */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <Network className="w-4 h-4 text-cyan-400 mt-0.5" />
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Direct Prerequisites in Graph</span>
                {step.prerequisites && step.prerequisites.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {step.prerequisites.map((p, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px] font-medium">
                        {p}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-300 font-medium">Foundational (No direct prerequisites required)</span>
                )}
              </div>
            </div>

            {/* Gap Score */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Skill Gap Similarity Index</span>
                <span className="text-xs font-semibold text-white">
                  {step.gap_score ? `${(step.gap_score * 100).toFixed(0)}% Profile Similarity` : "0% Prior Coverage (Core Gap)"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
}
