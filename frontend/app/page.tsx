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
      {/* Top Brand Header Banner */}
      <header className="border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md sticky top-0 z-40 py-4 sm:py-5 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center text-center gap-1">
          <span className="font-black text-3xl sm:text-4xl bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent tracking-tight cursor-default select-none">
            Skillo AI
          </span>
          <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-indigo-300/80 uppercase">
            Next-Gen • Career Roadmap • Assistant
          </span>
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
