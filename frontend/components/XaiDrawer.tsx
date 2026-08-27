'use client';

import React, { useEffect, useState } from 'react';
import { X, Sparkles, Network, Target, CheckCircle2, ShieldCheck } from 'lucide-react';
import { RoadmapStep } from '../lib/api';

interface XaiDrawerProps {
  step: RoadmapStep | null;
  targetRole: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function XaiDrawer({ step, targetRole, isOpen, onClose }: XaiDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<RoadmapStep | null>(step);

  useEffect(() => {
    if (isOpen && step) {
      setCurrentStep(step);
      setMounted(true);
      const timer = requestAnimationFrame(() => {
        requestAnimationFrame(() => setActive(true));
      });
      return () => cancelAnimationFrame(timer);
    } else {
      setActive(false);
      const timer = setTimeout(() => {
        setMounted(false);
        setCurrentStep(null);
      }, 300); // Match CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, step]);

  if (!mounted && !isOpen) return null;

  const displayStep = step || currentStep;
  if (!displayStep) return null;

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-50 flex items-center justify-end transition-all duration-300 ease-in-out ${
        active
          ? 'bg-black/60 backdrop-blur-sm opacity-100 pointer-events-auto'
          : 'bg-black/0 backdrop-blur-none opacity-0 pointer-events-none'
      }`}
    >
      {/* 
        Width updated to w-full sm:w-[460px] lg:w-[480px] xl:w-[540px] 
        to EXACTLY cover the entire Topological Skill Trajectory / right sidebar section
      */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`glass-card w-full sm:w-[460px] lg:w-[480px] xl:w-[540px] h-full p-6 border-l border-slate-700/80 shadow-2xl flex flex-col justify-between overflow-y-auto transform transition-all duration-300 ease-out ${
          active ? 'translate-x-0 opacity-100 shadow-indigo-500/10' : 'translate-x-full opacity-0 shadow-none'
        }`}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Explainable AI (XAI)</h3>
                <span className="text-[11px] text-slate-400">Step #{displayStep.step} Recommendation Rationale</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Explanation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Skill Title */}
          <div className="mb-6">
            <span className={`text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full font-bold ${
              displayStep.is_remedial ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            }`}>
              {displayStep.is_remedial ? 'Remedial Refresher Module' : `Step ${displayStep.step} Milestone`}
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-2 tracking-tight">{displayStep.skill_name}</h2>
          </div>

          {/* Grounded Plain-Language Explanation */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-indigo-500/30 bg-indigo-950/30 mb-6 shadow-inner">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 mb-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Grounded Model Justification:</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {displayStep.explanation || "Recommended to satisfy prerequisite dependencies and close core competency gaps identified from your goal."}
            </p>
          </div>

          {/* Fact Matrix */}
          <div className="space-y-4 mb-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Underlying Graph & Gap Signals:
            </h4>

            {/* Target Role */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <Target className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Career Target Alignment</span>
                <span className="text-xs font-semibold text-white">{targetRole}</span>
              </div>
            </div>

            {/* Prerequisites */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <Network className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Direct Prerequisites in Graph</span>
                {displayStep.prerequisites && displayStep.prerequisites.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {displayStep.prerequisites.map((p, idx) => (
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
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Skill Gap Similarity Index</span>
                <span className="text-xs font-semibold text-white">
                  {displayStep.gap_score ? `${(displayStep.gap_score * 100).toFixed(0)}% Profile Similarity` : "0% Prior Coverage (Core Gap)"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
}
