'use client';

import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Sparkles, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { signupUser, loginUser, UserSession } from '../lib/api';

interface AuthCardProps {
  onAuthSuccess: (session: UserSession) => void;
}

export default function AuthCard({ onAuthSuccess }: AuthCardProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please provide both email and password.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'signup') {
        const session = await signupUser(name.trim(), email.trim(), password);
        onAuthSuccess(session);
      } else {
        const session = await loginUser(email.trim(), password);
        onAuthSuccess(session);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      // Fast demo login for instant frictionless experience
      const demoEmail = 'alex.learner@skillo.ai';
      const demoPassword = 'Password123!';
      try {
        const session = await loginUser(demoEmail, demoPassword);
        onAuthSuccess(session);
      } catch {
        // If demo user doesn't exist yet, sign them up automatically
        const session = await signupUser('Alex', demoEmail, demoPassword);
        onAuthSuccess(session);
      }
    } catch (err: any) {
      // Fallback local session if offline
      onAuthSuccess({
        user_id: 'user_alex_demo',
        name: 'Alex',
        email: 'alex.learner@skillo.ai',
        learner_id: 'learner_alex',
        token: 'token_demo_local'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto py-4 px-4 animate-in fade-in zoom-in-95 duration-200">
      {/* Title & Slogan */}
      <div className="text-center mb-4 space-y-1">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
          {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-xs text-slate-400">
          {mode === 'signin'
            ? 'Sign in to access your personalized learning roadmaps'
            : 'Get started on your tech career roadmap'}
        </p>
      </div>

      {/* Auth Card Container */}
      <div className="glass-card rounded-2xl border border-slate-800/90 shadow-2xl p-5 sm:p-6 relative overflow-hidden backdrop-blur-xl bg-slate-950/60">
        
        {/* Mode Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-900/80 rounded-xl border border-slate-800/80 mb-4">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(null); }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
              mode === 'signin'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(null); }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2 text-xs text-red-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div className="space-y-1 animate-in fade-in duration-150">
              <label className="text-[11px] font-semibold text-slate-300 pl-0.5">Full Name</label>
              <div className="relative">
                <UserIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Harsh"
                  className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                  required={mode === 'signup'}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300 pl-0.5">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300 pl-0.5">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 rounded-lg pl-9 pr-9 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                required
                minLength={4}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-1.5 py-2.5 px-4 rounded-lg font-semibold text-xs text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-md shadow-indigo-500/20 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'signin' ? 'Sign In to Skillo' : 'Create Skillo Account'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-3.5 flex items-center justify-center">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-950 px-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider absolute">
            Or
          </span>
        </div>

        {/* Guest / Demo Quick Button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={isLoading}
          className="w-full py-2 px-3 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Quick Demo Login (Alex Persona)</span>
        </button>
      </div>
    </div>
  );
}
