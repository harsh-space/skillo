'use client';

import React, { useState } from 'react';
import GoalInput from '../components/GoalInput';
import Dashboard from '../components/Dashboard';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<'onboarding' | 'dashboard'>('onboarding');
  const [learnerData, setLearnerData] = useState<{
    learner_id: string;
    name: string;
    current_skills: string[];
    target_role: string;
    target_role_id: string;
    target_skills: string[];
  } | null>(null);

  const handleOnboardingComplete = (data: {
    learner_id: string;
    name: string;
    current_skills: string[];
    target_role: string;
    target_role_id: string;
    target_skills: string[];
  }) => {
    setLearnerData(data);
    setCurrentStep('dashboard');
  };

  const handleReset = () => {
    setCurrentStep('onboarding');
  };

  return (
    <main className="min-h-screen">
      {/* Top Brand Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center font-black text-white text-sm shadow-md shadow-indigo-500/20">
              P
            </div>
            <div>
              <span className="font-extrabold text-sm text-white tracking-tight">Pathfinder AI</span>
              <span className="text-[10px] text-indigo-400 font-medium ml-2 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                AMPlified 2026
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>FastAPI Backend Active</span>
            </div>
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              Swagger Docs
            </a>
          </div>
        </div>
      </header>

      {/* Main App Body */}
      {currentStep === 'onboarding' ? (
        <GoalInput onComplete={handleOnboardingComplete} />
      ) : learnerData ? (
        <Dashboard learnerData={learnerData} onReset={handleReset} />
      ) : null}
    </main>
  );
}
