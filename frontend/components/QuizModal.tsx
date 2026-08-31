'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Award, AlertTriangle, CheckCircle, Flame, ArrowRight, Sparkles } from 'lucide-react';
import { RoadmapStep, sendFeedback } from '../lib/api';

interface QuizModalProps {
  learnerId: string;
  step: RoadmapStep;
  isOpen: boolean;
  onClose: () => void;
  onFeedbackApplied: (result: any) => void;
}

export default function QuizModal({ learnerId, step, isOpen, onClose, onFeedbackApplied }: QuizModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedScore, setSelectedScore] = useState<number>(40);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleScoreSubmit = async (score: number) => {
    setIsSubmitting(true);
    try {
      const res = await sendFeedback(learnerId, step.step_id, 'quiz_score', score);
      setFeedbackResult(res);
      onFeedbackApplied(res);
    } catch (err) {
      console.error('Quiz submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkComplete = async () => {
    setIsSubmitting(true);
    try {
      const res = await sendFeedback(learnerId, step.step_id, 'completed');
      setFeedbackResult(res);
      onFeedbackApplied(res);
    } catch (err) {
      console.error('Complete error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="glass-card w-full max-w-lg rounded-2xl border border-slate-700/90 p-5 sm:p-6 shadow-2xl shadow-black/90 relative max-h-[92vh] overflow-y-auto bg-slate-950/95 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close Quiz Simulator"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Header */}
        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
              Adaptive Feedback Simulator
            </h3>
            <p className="text-xs text-slate-400 truncate">
              Skill: <span className="text-indigo-300 font-semibold">{step.skill_name}</span>
            </p>
          </div>
        </div>

        {!feedbackResult ? (
          <div className="space-y-5">
            <p className="text-xs text-slate-300 leading-relaxed">
              Test how the recommendation engine adaptively recalibrates the remaining path when real learner assessment signals arrive.
            </p>

            {/* Quick Test Scenarios */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Select Benchmark Test Scenario:
              </span>

              {/* Scenario 1: Worked Scenario Score 40% (Fail -> Remedial) */}
              <button
                type="button"
                onClick={() => handleScoreSubmit(40)}
                disabled={isSubmitting}
                className="w-full text-left p-3 sm:p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-900/40 transition-all flex items-start gap-3 group cursor-pointer active:scale-[0.99]"
              >
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-amber-300">Worked Scenario: Score 40% (Needs Help)</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono shrink-0">Score &lt; 50%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Engine detects conceptual gap and dynamically inserts a remedial refresher step before downstream topics.
                  </p>
                </div>
              </button>

              {/* Scenario 2: Standard Pass Score 75% (Advance) */}
              <button
                type="button"
                onClick={() => handleScoreSubmit(75)}
                disabled={isSubmitting}
                className="w-full text-left p-3 sm:p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-900/40 transition-all flex items-start gap-3 group cursor-pointer active:scale-[0.99]"
              >
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 mt-0.5 shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-cyan-300">Standard Pass: Score 75%</span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono shrink-0">Score 50-89%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Marks milestone as completed, adds skill to learner profile vector, and activates next topological step.
                  </p>
                </div>
              </button>

              {/* Scenario 3: Mastery Score 95% (Fast-Track / Acceleration) */}
              <button
                type="button"
                onClick={() => handleScoreSubmit(95)}
                disabled={isSubmitting}
                className="w-full text-left p-3 sm:p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-900/40 transition-all flex items-start gap-3 group cursor-pointer active:scale-[0.99]"
              >
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 mt-0.5 shrink-0">
                  <Flame className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-purple-300">Fast-Track Mastery: Score 95%</span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono shrink-0">Score &ge; 90%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Accelerates learning trajectory by marking downstream easier steps as fast-track skippable.
                  </p>
                </div>
              </button>
            </div>

            {/* Custom Score Slider */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Custom Assessment Score:</span>
                <span className="font-mono font-bold text-indigo-400 text-sm">{selectedScore}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={selectedScore}
                onChange={(e) => setSelectedScore(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0% (Fail)</span>
                <span>50% (Pass)</span>
                <span>100% (Mastery)</span>
              </div>
              <button
                type="button"
                onClick={() => handleScoreSubmit(selectedScore)}
                disabled={isSubmitting}
                className="w-full mt-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                {isSubmitting ? 'Submitting Signal...' : `Submit Score (${selectedScore}%)`}
              </button>
            </div>

            {/* Alternative Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleMarkComplete}
                disabled={isSubmitting}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              >
                Mark complete without quiz &rarr;
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Feedback Result View */
          <div className="space-y-4 py-2 animate-in zoom-in-95 duration-200">
            <div className={`p-4 rounded-xl border ${
              feedbackResult.adaptation_applied === 'remedial_insertion'
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                : feedbackResult.adaptation_applied === 'fast_track'
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            }`}>
              <div className="flex items-center gap-2 font-semibold text-sm mb-1">
                {feedbackResult.adaptation_applied === 'remedial_insertion' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {feedbackResult.adaptation_applied === 'fast_track' && <Flame className="w-4 h-4 text-purple-400" />}
                {feedbackResult.adaptation_applied === 'step_completed' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                <span>Adaptive Re-Ranking Signal Applied:</span>
              </div>
              <p className="text-xs opacity-90 leading-relaxed">{feedbackResult.message}</p>
            </div>

            <p className="text-xs text-slate-400">
              The roadmap timeline has been re-computed and re-rendered in real time.
            </p>

            <button
              type="button"
              onClick={() => {
                setFeedbackResult(null);
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/25"
            >
              View Updated Roadmap <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
