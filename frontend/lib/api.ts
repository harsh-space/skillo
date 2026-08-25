const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export interface Skill {
  skill_id: string;
  name: string;
  description: string;
}

export interface Role {
  role_id: string;
  name: string;
  description: string;
  required_skills: string[];
}

export interface ResourceInfo {
  resource_id: string;
  title: string;
  url: string;
  type: "course" | "project" | "assessment";
  is_remedial: boolean;
}

export interface RoadmapStep {
  step_id: string;
  step: number;
  skill_id: string;
  skill_name: string;
  resource: ResourceInfo;
  type: string;
  status: "not_started" | "in_progress" | "completed" | "skippable";
  explanation: string;
  is_remedial: boolean;
  prerequisites: string[];
  gap_score: number;
}

export interface GapSkillDetail {
  skill_id: string;
  name: string;
  similarity_score: number;
  status: "missing" | "matched";
  closest_matched_skill?: string;
}

export interface GapSummary {
  missing_skills: string[];
  matched_skills: string[];
  details: GapSkillDetail[];
}

export interface RoadmapData {
  learner_id: string;
  target_role: string;
  target_role_id: string;
  roadmap: RoadmapStep[];
  gap_summary: GapSummary;
  updated_at: string;
}

export async function fetchTaxonomy() {
  const res = await fetch(`${API_BASE}/taxonomy`);
  if (!res.ok) throw new Error("Failed to fetch taxonomy");
  return res.json();
}

export async function saveProfile(learner_id: string, name: string, current_skills: string[], target_role_id?: string) {
  const res = await fetch(`${API_BASE}/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ learner_id, name, current_skills, target_role_id }),
  });
  if (!res.ok) throw new Error("Failed to save profile");
  return res.json();
}

export async function parseGoal(learner_id: string, goal_text: string) {
  const res = await fetch(`${API_BASE}/goal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ learner_id, goal_text }),
  });
  if (!res.ok) throw new Error("Failed to parse goal");
  return res.json();
}

export async function fetchRoadmap(learner_id: string): Promise<RoadmapData> {
  const res = await fetch(`${API_BASE}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ learner_id }),
  });
  if (!res.ok) throw new Error("Failed to generate recommendation");
  return res.json();
}

export async function sendFeedback(learner_id: string, step_id: string, event: string, value?: number) {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ learner_id, step_id, event, value }),
  });
  if (!res.ok) throw new Error("Failed to send feedback");
  return res.json();
}

export async function getStepExplanation(learner_id: string, step_id: string) {
  const res = await fetch(`${API_BASE}/explain/${learner_id}/${step_id}`);
  if (!res.ok) throw new Error("Failed to fetch explanation");
  return res.json();
}
