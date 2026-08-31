'use client';

import React, { useState, useEffect } from 'react';
import GoalInput from '../components/GoalInput';
import Dashboard from '../components/Dashboard';
import OrbitBackground from '../components/OrbitBackground';
import AuthCard from '../components/AuthCard';
import { UserSession } from '../lib/api';
import { User, LogOut } from 'lucide-react';

export default function Home() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [currentStep, setCurrentStep] = useState<'auth' | 'onboarding' | 'dashboard'>('auth');
  const [learnerData, setLearnerData] = useState<{
    learner_id: string;
    name: string;
    current_skills: string[];
    target_role: string;
    target_role_id: string;
    target_skills: string[];
  } | null>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('skillo_session');
      if (stored) {
        const parsed: UserSession = JSON.parse(stored);
        if (parsed && parsed.name) {
          setSession(parsed);
          setCurrentStep('onboarding');
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleAuthSuccess = (newSession: UserSession) => {
    setSession(newSession);
    try {
      localStorage.setItem('skillo_session', JSON.stringify(newSession));
    } catch {
      // ignore
    }
    setCurrentStep('onboarding');
  };

  const handleLogout = () => {
    setSession(null);
    setLearnerData(null);
    try {
      localStorage.removeItem('skillo_session');
    } catch {
      // ignore
    }
    setCurrentStep('auth');
  };

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
    <main className={`min-h-screen relative overflow-x-hidden ${currentStep === 'onboarding' || currentStep === 'auth' ? 'overflow-y-hidden h-screen' : ''}`}>
      {/* Background Orbit & Starfield */}
      <OrbitBackground isDashboard={currentStep === 'dashboard'} />

      {/* Top Brand Header Banner */}
      <header className="border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md sticky top-0 z-40 py-3 sm:py-3.5 shadow-lg shadow-black/20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left spacer / empty container for perfect centering */}
          <div className="w-24 sm:w-36 hidden sm:block" />

          {/* Centered Brand Title */}
          <div className="flex flex-col items-center justify-center text-center gap-0.5 mx-auto">
            <span className="font-black text-2xl sm:text-3xl bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent tracking-tight cursor-default select-none">
              Skillo AI
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-indigo-300/80 uppercase">
              Next-Gen • Career Roadmap • Assistant
            </span>
          </div>

          {/* Right User Session & Logout Action */}
          <div className="w-auto sm:w-36 flex items-center justify-end">
            {session ? (
              <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-full px-2.5 py-1 text-xs">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                  {session.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-slate-200 font-medium hidden md:inline truncate max-w-[80px]">
                  {session.name}
                </span>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="text-slate-400 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-slate-800"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 w-full">
        {currentStep === 'auth' && (
          <div className="w-full flex items-center justify-center min-h-[calc(100vh-80px)] py-4">
            <AuthCard onAuthSuccess={handleAuthSuccess} />
          </div>
        )}

        {currentStep !== 'auth' && (
          <div className="w-full overflow-hidden">
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
                <GoalInput
                  userName={session?.name || 'Alex'}
                  learnerId={session?.learner_id}
                  onComplete={handleOnboardingComplete}
                />
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
        )}
      </div>
    </main>
  );
}
