'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, ArrowRight, ArrowLeft, CheckCircle, Search, Layers, User } from 'lucide-react';
import { Skill, fetchTaxonomy, saveProfile, parseGoal } from '../lib/api';

interface GoalInputProps {
  onComplete: (data: {
    learner_id: string;
    name: string;
    current_skills: string[];
    target_role: string;
    target_role_id: string;
    target_skills: string[];
  }) => void;
}

export default function GoalInput({ onComplete }: GoalInputProps) {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [learnerName, setLearnerName] = useState('Alex');
  const [goalText, setGoalText] = useState('I want to become a backend developer');
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['HTML', 'CSS', 'Python (basic)']);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<{ target_role?: string; target_skills?: string[] } | null>(null);

  useEffect(() => {
    fetchTaxonomy()
      .then((data) => {
        if (data.skills) setAllSkills(data.skills);
      })
      .catch((err) => console.log('Taxonomy load fallback:', err));
  }, []);

  const toggleSkill = (skillName: string) => {
    if (selectedSkills.includes(skillName)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skillName));
    } else {
      setSelectedSkills([...selectedSkills, skillName]);
    }
  };

  const getEffectiveLearnerId = () => {
    const clean = learnerName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    return clean ? `learner_${clean}` : 'learner_alex';
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!goalText.trim()) {
      setActiveStep(1); // Jump to aspiration step if empty
      return;
    }

    const effectiveId = getEffectiveLearnerId();
    const effectiveName = learnerName.trim() || 'Learner';

    setIsLoading(true);
    try {
      // 1. Parse Goal with LLM / Taxonomy
      const goalRes = await parseGoal(effectiveId, goalText);
      setParsedPreview(goalRes);

      // 2. Save Learner Profile
      await saveProfile(effectiveId, effectiveName, selectedSkills, goalRes.target_role_id);

      // 3. Trigger parent transition
      onComplete({
        learner_id: effectiveId,
        name: effectiveName,
        current_skills: selectedSkills,
        target_role: goalRes.target_role,
        target_role_id: goalRes.target_role_id,
        target_skills: goalRes.target_skills,
      });
    } catch (error) {
      console.error('Onboarding error:', error);
      // Fallback
      onComplete({
        learner_id: effectiveId,
        name: effectiveName,
        current_skills: selectedSkills,
        target_role: 'Backend Developer',
        target_role_id: 'role_backend_developer',
        target_skills: ['Python (advanced)', 'SQL & Relational Databases', 'REST APIs', 'Authentication & JWT', 'Git & GitHub', 'Docker & Containers'],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSkills = allSkills.filter(
    (s) => s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stepsMeta = [
    { title: 'Tell us about yourself', desc: 'Personalize your profile identity' },
    { title: 'Tell us about aspiration', desc: 'Describe your target career outcome' },
    { title: 'Tell us about your current skillset', desc: 'Select competencies you already understand' },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8 space-y-3">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
          AI Personalized Learning Assistant
        </h1>
        <div className="max-w-2xl mx-auto pt-1">
          <p className="text-base sm:text-lg font-medium text-slate-200 tracking-tight">
            Map your skills. <span className="bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent font-semibold">Chart your path.</span>
          </p>
          <p className="text-sm sm:text-base text-slate-400 mt-1">
            Our AI bridges the gap with an adaptive, milestone-driven roadmap.
          </p>
        </div>
      </div>

      {/* Wizard Progress Pills */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {stepsMeta.map((step, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveStep(idx)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeStep === idx
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : idx < activeStep
                ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900/60'
                : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
              activeStep === idx ? 'bg-white text-indigo-600 font-bold' : 'bg-slate-800 text-slate-300'
            }`}>
              {idx + 1}
            </span>
            <span className="hidden sm:inline">{idx === 0 ? 'Identity' : idx === 1 ? 'Aspiration' : 'Skillset'}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Single Dynamic Block Space */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800/80 min-h-[320px] flex flex-col justify-between shadow-2xl relative">
          
          {/* Section 1: Tell us about yourself */}
          {activeStep === 0 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 text-slate-100 font-bold text-lg">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span>Tell us about yourself</span>
              </div>
              <p className="text-xs text-slate-400">
                Enter your name or preferred moniker so we can personalize your learning journey and milestones.
              </p>
              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-300 mb-2">Your Name</label>
                <input
                  type="text"
                  value={learnerName}
                  onChange={(e) => setLearnerName(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                  placeholder="e.g. Alex"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Section 2: Tell us about aspiration */}
          {activeStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 text-slate-100 font-bold text-lg">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <span>Tell us about aspiration</span>
              </div>
              <p className="text-xs text-slate-400">
                Type your career objective freely. Our AI parses your natural-language intent and maps it to target roles.
              </p>
              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-300 mb-2">Career Goal & Desired Focus</label>
                <textarea
                  rows={4}
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors resize-none"
                  placeholder="e.g. I know basic Python and HTML, and I want to become a Backend Developer building scalable APIs."
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Section 3: Tell us about your current skillset */}
          {activeStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-slate-100 font-bold text-lg">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span>Tell us about your current skillset</span>
                </div>
                <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full font-medium border border-indigo-500/20">
                  {selectedSkills.length} selected
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Select the skills you already know. The engine calculates cosine similarity gap vectors against these.
              </p>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search taxonomy skills (e.g., Python, SQL, Docker)..."
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Skill Badges */}
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                {(filteredSkills.length > 0 ? filteredSkills : allSkills).map((skill) => {
                  const isSelected = selectedSkills.includes(skill.name);
                  return (
                    <button
                      key={skill.skill_id}
                      type="button"
                      onClick={() => toggleSkill(skill.name)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                          : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                      }`}
                    >
                      {isSelected && <CheckCircle className="w-3.5 h-3.5 text-indigo-200" />}
                      {skill.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3 Unified Action Buttons at the Bottom Right */}
        <div className="flex items-center justify-end gap-2.5 mt-5">
          {/* Button 1: Generate Personalized Roadmap */}
          <button
            type="submit"
            disabled={isLoading || !goalText.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/25 border border-indigo-400/30 transition-all transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analyzing & Building...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                <span>Generate Roadmap</span>
              </>
            )}
          </button>

          {/* Button 2: Previous Step Navigation */}
          <button
            type="button"
            onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
            disabled={activeStep === 0}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700/80 transition-all transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {/* Button 3: Next Step Navigation */}
          <button
            type="button"
            onClick={() => setActiveStep((prev) => Math.min(2, prev + 1))}
            disabled={activeStep === 2}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-200 hover:text-white font-semibold text-xs border border-indigo-500/40 transition-all transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}

