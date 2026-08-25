'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, ArrowRight, CheckCircle, Search, Layers, User, Zap } from 'lucide-react';
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
  const [learnerId, setLearnerId] = useState('learner_alex');
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

  const applyPreset = (preset: 'alex' | 'sam') => {
    if (preset === 'alex') {
      setLearnerId('learner_alex');
      setLearnerName('Alex');
      setSelectedSkills(['HTML', 'CSS', 'Python (basic)']);
      setGoalText('I want to become a backend developer');
    } else {
      setLearnerId('learner_sam');
      setLearnerName('Sam');
      setSelectedSkills(['JavaScript', 'React', 'HTML', 'CSS']);
      setGoalText('I want to become a Full Stack Developer');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalText.trim()) return;

    setIsLoading(true);
    try {
      // 1. Parse Goal with LLM / Taxonomy
      const goalRes = await parseGoal(learnerId, goalText);
      setParsedPreview(goalRes);

      // 2. Save Learner Profile
      await saveProfile(learnerId, learnerName, selectedSkills, goalRes.target_role_id);

      // 3. Trigger parent transition
      onComplete({
        learner_id: learnerId,
        name: learnerName,
        current_skills: selectedSkills,
        target_role: goalRes.target_role,
        target_role_id: goalRes.target_role_id,
        target_skills: goalRes.target_skills,
      });
    } catch (error) {
      console.error('Onboarding error:', error);
      // Fallback
      onComplete({
        learner_id: learnerId,
        name: learnerName,
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
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          HCLTech AMPlified Hackathon · Round 2 Pathfinder
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent mb-3">
          AI Personalized Learning Assistant
        </h1>
        <p className="text-slate-400 text-base max-w-2xl mx-auto">
          Tell us where you are today and where you want to go. Our AI analyzes your skill gap, builds a DAG prerequisite roadmap, and adapts as you learn.
        </p>
      </div>

      {/* Preset Personas Bar */}
      <div className="glass-card rounded-2xl p-4 mb-8 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-slate-200">Worked Persona Scenarios:</span>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => applyPreset('alex')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              learnerId === 'learner_alex'
                ? 'bg-primary-600/30 border-primary-500 text-white shadow-sm shadow-primary-500/20'
                : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            🎯 Persona A (Alex): HTML + CSS + Python → Backend Dev
          </button>
          <button
            type="button"
            onClick={() => applyPreset('sam')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              learnerId === 'learner_sam'
                ? 'bg-primary-600/30 border-primary-500 text-white shadow-sm shadow-primary-500/20'
                : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            ⚡ Persona B (Sam): JS + React → Full Stack Dev
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Learner Info */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800/80">
          <div className="flex items-center gap-2 mb-4 text-slate-200 font-semibold">
            <User className="w-5 h-5 text-indigo-400" />
            <span>Learner Identity</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Learner ID</label>
              <input
                type="text"
                value={learnerId}
                onChange={(e) => setLearnerId(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="e.g. learner_alex"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
              <input
                type="text"
                value={learnerName}
                onChange={(e) => setLearnerName(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Alex"
              />
            </div>
          </div>
        </div>

        {/* Career Goal */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800/80">
          <div className="flex items-center gap-2 mb-2 text-slate-200 font-semibold">
            <Brain className="w-5 h-5 text-indigo-400" />
            <span>Natural Language Career Goal</span>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Type your aspiration freely. The LLM parses it into structured target skills constrained by our domain taxonomy.
          </p>
          <div className="relative">
            <textarea
              rows={3}
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              placeholder="e.g. I know basic Python and HTML, and I want to become a Backend Developer building scalable APIs."
            />
          </div>
        </div>

        {/* Current Skills Selector */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Current Competencies & Mastered Skills</span>
            </div>
            <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full font-medium">
              {selectedSkills.length} selected
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Select the skills you already understand. The engine calculates cosine similarity gap vectors against these.
          </p>

          {/* Search Box */}
          <div className="relative mb-4">
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
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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

        {/* Submit Action */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !goalText.trim()}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing Skill Gap & Building DAG Roadmap...
              </>
            ) : (
              <>
                Generate Personalized Roadmap
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
