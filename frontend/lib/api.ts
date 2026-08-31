const rawBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1").trim().replace(/\/+$/, "");
const API_BASE = rawBase.endsWith("/api/v1") ? rawBase : `${rawBase}/api/v1`;

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

/** Always triggers a fresh roadmap generation (force recalculate from skills) */
export async function generateRoadmap(learner_id: string): Promise<RoadmapData> {
  const res = await fetch(`${API_BASE}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ learner_id, force_regenerate: true }),
  });
  if (!res.ok) throw new Error("Failed to generate roadmap");
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

export interface UserSession {
  user_id: string;
  name: string;
  email: string;
  learner_id: string;
  token: string;
}

export async function signupUser(name: string, email: string, password: string): Promise<UserSession> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to sign up. Please check your credentials.");
  }
  return res.json();
}

export async function loginUser(email: string, password: string): Promise<UserSession> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Invalid email or password.");
  }
  return res.json();
}

export interface RoadmapHistoryItem {
  history_id: string;
  learner_id: string;
  target_role: string;
  target_role_id: string;
  created_at: string;
  updated_at: string;
  total_tasks: number;
  completed_tasks: number;
  progress_percentage: number;
  steps: RoadmapStep[];
  is_active: boolean;
}

export async function fetchHistory(learner_id: string): Promise<RoadmapHistoryItem[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(`${API_BASE}/history/${learner_id}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) {
      console.warn(`fetchHistory returned status ${res.status}`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn("fetchHistory failed or timed out:", e);
    return [];
  }
}

export async function activateHistoryRoadmap(learner_id: string, history_id: string): Promise<RoadmapData> {
  const res = await fetch(`${API_BASE}/history/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ learner_id, history_id }),
  });
  if (!res.ok) throw new Error("Failed to switch roadmap");
  return res.json();
}

export async function deleteHistoryItem(learner_id: string, history_id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/history/${learner_id}/${history_id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete history item");
}
