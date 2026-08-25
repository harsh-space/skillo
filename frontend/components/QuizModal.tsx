'use client';

import React, { useState } from 'react';
import { X, Award, AlertTriangle, CheckCircle, Flame, ArrowRight } from 'lucide-react';
import { RoadmapStep, sendFeedback } from '../lib/api';

interface QuizModalProps {
  learnerId: string;
  step: RoadmapStep;
  isOpen: boolean;
  onClose: () => void;
  onFeedbackApplied: (result: any) => void;
}

export default function QuizModal({ learnerId, step, isOpen, onClose, onFeedbackApplied }: QuizModalProps) {
  const [selectedScore, setSelectedScore] = useState<number>(40);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState<any>(null);

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="glass-card w-full max-w-lg rounded-2xl border border-slate-700/80 p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Adaptive Feedback Simulator</h3>
            <p className="text-xs text-slate-400">Skill: <span className="text-indigo-300 font-semibold">{step.skill_name}</span></p>
          </div>
        </div>

        {!feedbackResult ? (
          <div className="space-y-6">
            <p className="text-xs text-slate-300 leading-relaxed">
              Test how the recommendation engine adaptively recalibrates the remaining path when real learner assessment signals arrive.
            </p>

            {/* Quick Test Scenarios */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Benchmark Test Scenario:
              </span>

              {/* Scenario 1: Worked Scenario Score 40% (Fail -> Remedial) */}
              <button
                type="button"
                onClick={() => handleScoreSubmit(40)}
                disabled={isSubmitting}
                className="w-full text-left p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-900/40 transition-all flex items-start gap-3 group"
              >
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-300">Worked Scenario: Score 40% (Needs Help)</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">Score &lt; 50%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Engine detects conceptual gap and dynamically inserts a remedial refresher step before downstream topics.
                  </p>
                </div>
              </button>

              {/* Scenario 2: Score 75% (Pass) */}
              <button
                type="button"
                onClick={() => handleScoreSubmit(75)}
                disabled={isSubmitting}
                className="w-full text-left p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-900/40 transition-all flex items-start gap-3 group"
              >
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-300">Standard Pass: Score 75%</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">Score 50-89%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Marks skill as mastered, updates profile vector, and activates next topological step.
                  </p>
                </div>
              </button>

              {/* Scenario 3: Score 95% (Fast-Track) */}
              <button
                type="button"
                onClick={() => handleScoreSubmit(95)}
                disabled={isSubmitting}
                className="w-full text-left p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-900/40 transition-all flex items-start gap-3 group"
              >
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 mt-0.5">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-300">Mastery: Score 95% (Fast-Track)</span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono">Score &ge; 90%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Marks skill complete and flags downstream easier steps as fast-track skippable.
                  </p>
                </div>
              </button>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-800">
              <button
                type="button"
                onClick={handleMarkComplete}
                disabled={isSubmitting}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              >
                Or mark complete without quiz score &rarr;
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Feedback Result View */
          <div className="space-y-4 py-2 animate-in zoom-in-95">
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
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              View Updated Roadmap <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
