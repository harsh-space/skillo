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
          <div className="flex items-center gap-2">
            <span className="font-black text-lg bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent tracking-tight">
              Skillo AI
            </span>
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
