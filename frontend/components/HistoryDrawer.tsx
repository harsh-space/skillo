'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plus,
  Compass,
  CheckCircle2,
  Trash2,
  Sparkles,
  RefreshCw,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import {
  RoadmapHistoryItem,
  fetchHistory,
  activateHistoryRoadmap,
  deleteHistoryItem,
  RoadmapData
} from '../lib/api';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  learnerId?: string;
  onSelectRoadmap: (data: RoadmapData) => void;
  onNewRoadmap: () => void;
}

export default function HistoryDrawer({
  isOpen,
  onClose,
  learnerId,
  onSelectRoadmap,
  onNewRoadmap
}: HistoryDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [historyItems, setHistoryItems] = useState<RoadmapHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getEffectiveLearnerId = (): string => {
    if (learnerId) return learnerId;
    try {
      if (typeof window !== 'undefined') {
        const s = localStorage.getItem('skillo_session');
        if (s) {
          const parsed = JSON.parse(s);
          if (parsed.learner_id) return parsed.learner_id;
        }
      }
    } catch {
      // ignore
    }
    return 'learner_alex_101';
  };

  const loadHistory = async () => {
    const targetId = getEffectiveLearnerId();
    setIsLoading(true);
    try {
      const data = await fetchHistory(targetId);
      setHistoryItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load roadmap history:', err);
      setHistoryItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, learnerId]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleItemClick = async (item: RoadmapHistoryItem) => {
    const targetId = getEffectiveLearnerId();
    setActivatingId(item.history_id);
    try {
      const activeData = await activateHistoryRoadmap(targetId, item.history_id);
      onSelectRoadmap(activeData);
      onClose();
    } catch (err) {
      console.error('Failed to activate historical roadmap:', err);
      // Fallback: construct RoadmapData directly from item
      onSelectRoadmap({
        learner_id: targetId,
        target_role: item.target_role,
        target_role_id: item.target_role_id,
        roadmap: item.steps,
        gap_summary: {
          missing_skills: item.steps.filter((s) => s.status !== 'completed').map((s) => s.skill_id),
          matched_skills: item.steps.filter((s) => s.status === 'completed').map((s) => s.skill_id),
          details: []
        },
        updated_at: item.updated_at
      });
      onClose();
    } finally {
      setActivatingId(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, historyId: string) => {
    e.stopPropagation();
    const targetId = getEffectiveLearnerId();
    try {
      await deleteHistoryItem(targetId, historyId);
      setHistoryItems((prev) => prev.filter((h) => h.history_id !== historyId));
    } catch (err) {
      console.error('Failed to delete history item:', err);
      // Optimistic removal
      setHistoryItems((prev) => prev.filter((h) => h.history_id !== historyId));
    }
  };

  if (!mounted) return null;

  const drawerContent = (
    <div
      className={`fixed inset-0 z-50 transition-visibility duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none delay-200'
      }`}
    >
      {/* Dark Blur Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* ChatGPT-style Sliding Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-full sm:w-80 md:w-88 bg-slate-950/95 border-r border-slate-800/90 shadow-2xl z-50 flex flex-col backdrop-blur-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              <Compass className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-white tracking-tight">Your Roadmaps</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={loadHistory}
              disabled={isLoading}
              title="Refresh"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>


        {/* Recent Roadmaps Chat-List */}
        <div className="px-3 pt-1 pb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
            Recent Paths
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5 min-h-0">
          {isLoading && historyItems.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading roadmaps...</p>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="py-12 text-center space-y-2 px-3">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
              <h4 className="text-xs font-bold text-slate-300">No Roadmaps Yet</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Click "+ New Career Roadmap" to create your first learning path.
              </p>
            </div>
          ) : (
            historyItems.map((item) => {
              const isActivatingThis = activatingId === item.history_id;
              const formattedDate = new Date(item.updated_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
              });

              return (
                <div
                  key={item.history_id}
                  onClick={() => handleItemClick(item)}
                  className={`group w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer relative flex items-center justify-between gap-2 ${
                    item.is_active
                      ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-950/20'
                      : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.is_active
                          ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/30'
                          : 'bg-slate-800 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-700'
                      }`}
                    >
                      {isActivatingThis ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Compass className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-white truncate block">
                          {item.target_role}
                        </span>
                        {item.is_active && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          {item.completed_tasks}/{item.total_tasks}
                        </span>
                        <span>•</span>
                        <span>{item.progress_percentage}%</span>
                        <span>•</span>
                        <span className="text-slate-500">{formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions on hover */}
                  <div className="flex items-center gap-1">
                    {!item.is_active && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, item.history_id)}
                        title="Delete roadmap"
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
