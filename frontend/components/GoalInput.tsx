'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, ArrowRight, ArrowLeft, CheckCircle, Search, Layers, User } from 'lucide-react';
import { Skill, fetchTaxonomy, saveProfile, parseGoal, generateRoadmap } from '../lib/api';

interface GoalInputProps {
  userName?: string;
  learnerId?: string;
  onComplete: (data: {
    learner_id: string;
    name: string;
    current_skills: string[];
    target_role: string;
    target_role_id: string;
    target_skills: string[];
  }) => void;
}

export default function GoalInput({ onComplete, userName, learnerId }: GoalInputProps) {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [learnerName, setLearnerName] = useState(userName || 'Alex');
  const [goalText, setGoalText] = useState('I want to become a backend developer');
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['HTML', 'CSS', 'Python (basic)']);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<{ target_role?: string; target_skills?: string[] } | null>(null);

  useEffect(() => {
    if (userName) {
      setLearnerName(userName);
    }
  }, [userName]);

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
    if (learnerId) return learnerId;
    const clean = learnerName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    return clean ? `learner_${clean}` : 'learner_alex';
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!goalText.trim()) {
      setActiveStep(0); // Jump to identity & aspiration step if empty
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

      // 3. Generate fresh roadmap for the newly chosen role
      await generateRoadmap(effectiveId);

      // 4. Trigger parent transition
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

  return (
    <div className="max-w-4xl mx-auto pt-10 sm:pt-14 md:pt-18 pb-8 px-4">
      {/* Header */}
      <div className="text-center mb-6 space-y-1">
        <div className="max-w-2xl mx-auto">
          <p className="text-lg sm:text-xl font-semibold text-slate-200 tracking-tight">
            Map your skills. <span className="bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent font-bold">Chart your path.</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>

        {/* Fixed-height card — all sections + buttons share same box */}
        <div className="glass-card rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden flex flex-col" style={{height: '340px'}}>

          {/* Content area — grows to fill card minus button strip */}
          <div className="flex-1 p-5 sm:p-6 min-h-0 flex flex-col">

            {/* Screen 1 (Step 0): Aspiration & Goal */}
            {activeStep === 0 && (
              <div className="flex flex-col gap-3 h-full animate-in fade-in duration-200 justify-between">
                <div className="flex items-center gap-2.5 text-slate-100 font-bold text-lg">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span>Tell us about your aspiration &ldquo;{learnerName}&rdquo;</span>
                </div>

                <div className="flex-1 flex flex-col justify-center my-1">
                  <textarea
                    value={goalText}
                    onChange={(e) => setGoalText(e.target.value)}
                    className="w-full h-full min-h-[140px] bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors resize-none leading-relaxed"
                    placeholder="Describe what you want to achieve or learn (e.g., I want to become a backend developer building server systems and APIs)"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Screen 2 (Step 1): Current Skillset */}
            {activeStep === 1 && (
              <div className="flex flex-col gap-3 h-full animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-slate-100 font-bold text-lg">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span>Tell us about your current skillset</span>
                  </div>
                  <span className="text-[11px] text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full font-medium border border-indigo-500/20">
                    {selectedSkills.length} selected
                  </span>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter skills (e.g., Python, SQL, Docker)..."
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                {/* Skill badges — fill remaining height */}
                <div className="flex flex-wrap gap-1.5 overflow-y-auto pr-1 flex-1 content-start">
                  {(filteredSkills.length > 0 ? filteredSkills : allSkills).map((skill) => {
                    const isSelected = selectedSkills.includes(skill.name);
                    return (
                      <button
                        key={skill.skill_id}
                        type="button"
                        onClick={() => toggleSkill(skill.name)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer self-start ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                            : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                        }`}
                      >
                        {isSelected && <CheckCircle className="w-3 h-3 text-indigo-200" />}
                        {skill.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom strip — step indicator on bottom left, action buttons on right */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-3 border-t border-slate-800/60 bg-slate-950/30">
            <span className="text-xs text-slate-400 font-medium tracking-wide">
              Step {activeStep + 1} of 2
            </span>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isLoading || !goalText.trim()}
                title="Generate Personalized Roadmap"
                className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/25 border border-indigo-400/30 transition-all transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading
                  ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Sparkles className="w-3.5 h-3.5 text-indigo-100" />}
              </button>
              <button
                type="button"
                onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                disabled={activeStep === 0}
                title="Previous step"
                className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveStep((prev) => Math.min(1, prev + 1))}
                disabled={activeStep === 1}
                title="Next step"
                className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-200 hover:text-white border border-indigo-500/40 transition-all transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </form>

    </div>
  );
}

