'use client';

import React, { useState } from 'react';
import GoalInput from '../components/GoalInput';
import Dashboard from '../components/Dashboard';
import OrbitBackground from '../components/OrbitBackground';

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
    <main className={`min-h-screen relative overflow-x-hidden ${currentStep === 'onboarding' ? 'overflow-y-hidden h-screen' : ''}`}>
      {/* Background Orbit & Starfield */}
      <OrbitBackground isDashboard={currentStep === 'dashboard'} />

      {/* Top Brand Header Banner */}
      <header className="border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md sticky top-0 z-40 py-3 sm:py-4 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center text-center gap-0.5">
          <span className="font-black text-2xl sm:text-3xl bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent tracking-tight cursor-default select-none">
            Skillo AI
          </span>
          <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-indigo-300/80 uppercase">
            Next-Gen • Career Roadmap • Assistant
          </span>
        </div>
      </header>

      {/* Main Content — Synchronized Dual-Panel Slide Track */}
      <div className="relative z-10 w-full overflow-hidden">
        <div
          className={`flex items-start w-[200%] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            currentStep === 'dashboard' ? '-translate-x-1/2' : 'translate-x-0'
          }`}
        >
          {/* Panel 1: Onboarding Wizard */}
          <div
            className={`w-1/2 flex-shrink-0 transition-opacity duration-500 ${
              currentStep === 'dashboard' ? 'opacity-0 pointer-events-none h-0 overflow-hidden' : 'opacity-100'
            }`}
          >
            <GoalInput onComplete={handleOnboardingComplete} />
          </div>

          {/* Panel 2: Roadmap Dashboard */}
          <div
            className={`w-1/2 flex-shrink-0 transition-opacity duration-700 ${
              currentStep === 'dashboard' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none h-0 overflow-hidden'
            }`}
          >
            {learnerData ? (
              <Dashboard learnerData={learnerData} onReset={handleReset} />
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
