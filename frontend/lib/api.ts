import { getApiBaseUrl } from './env';

const API_BASE = getApiBaseUrl();

export type ApiErrorCode =
  | 'NETWORK_UNAVAILABLE'
  | 'BACKEND_TIMEOUT'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Structured diagnostic error class for all frontend API interactions.
 */
export class ApiError extends Error {
  public status: number;
  public code: ApiErrorCode;
  public details?: any;

  constructor(message: string, status: number = 0, code: ApiErrorCode = 'UNKNOWN_ERROR', details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Core centralized HTTP request executor with timeout enforcement,
 * structured error parsing, and graceful error categorization.
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = 25000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}`;

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers || {}),
      },
      signal: fetchOptions.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      let errPayload: any = null;
      try {
        errPayload = await res.json();
      } catch {
        errPayload = null;
      }

      const detailMsg = errPayload?.detail || (typeof errPayload === 'string' ? errPayload : null);

      if (res.status === 404) {
        throw new ApiError(
          detailMsg || 'Service endpoint not found (404). Check API connection or route.',
          404,
          'NOT_FOUND',
          errPayload
        );
      }
      if (res.status === 401) {
        throw new ApiError(
          detailMsg || 'Authentication failed. Please check your credentials.',
          401,
          'UNAUTHORIZED',
          errPayload
        );
      }
      if (res.status === 403) {
        throw new ApiError(
          detailMsg || 'Access forbidden.',
          403,
          'UNAUTHORIZED',
          errPayload
        );
      }
      if (res.status === 409) {
        throw new ApiError(
          detailMsg || 'An account with this email already exists. Please sign in instead.',
          409,
          'CONFLICT',
          errPayload
        );
      }
      if (res.status === 422) {
        throw new ApiError(
          detailMsg || 'Invalid request parameters.',
          422,
          'VALIDATION_ERROR',
          errPayload
        );
      }
      if (res.status >= 500) {
        throw new ApiError(
          detailMsg || 'Backend server encountered an error. Please try again.',
          res.status,
          'SERVER_ERROR',
          errPayload
        );
      }

      throw new ApiError(
        detailMsg || `Request failed with HTTP status ${res.status}.`,
        res.status,
        'UNKNOWN_ERROR',
        errPayload
      );
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return (await res.json()) as T;
    }
    return (await res.text()) as unknown as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) {
      throw err;
    }
    if (err.name === 'AbortError') {
      throw new ApiError(
        'Backend server request timed out. The server may be warming up — please try again in a few seconds.',
        408,
        'BACKEND_TIMEOUT'
      );
    }
    throw new ApiError(
      'Unable to connect to the backend service. Please check your network connection.',
      0,
      'NETWORK_UNAVAILABLE'
    );
  }
}

// ----------------------------------------------------------------------------
// Type Definitions
// ----------------------------------------------------------------------------

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
  type: 'course' | 'project' | 'assessment';
  is_remedial: boolean;
}

export interface RoadmapStep {
  step_id: string;
  step: number;
  skill_id: string;
  skill_name: string;
  resource: ResourceInfo;
  type: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skippable';
  explanation: string;
  is_remedial: boolean;
  prerequisites: string[];
  gap_score: number;
}

export interface GapSkillDetail {
  skill_id: string;
  name: string;
  similarity_score: number;
  status: 'missing' | 'matched';
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

export interface UserSession {
  user_id: string;
  name: string;
  email: string;
  learner_id: string;
  token: string;
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

// ----------------------------------------------------------------------------
// API Endpoints
// ----------------------------------------------------------------------------

export async function fetchTaxonomy() {
  return request<any>('/taxonomy');
}

export async function saveProfile(
  learner_id: string,
  name: string,
  current_skills: string[],
  target_role_id?: string
) {
  return request<any>('/profile', {
    method: 'POST',
    body: JSON.stringify({ learner_id, name, current_skills, target_role_id }),
  });
}

export async function parseGoal(learner_id: string, goal_text: string) {
  return request<any>('/goal', {
    method: 'POST',
    body: JSON.stringify({ learner_id, goal_text }),
  });
}

export async function fetchRoadmap(learner_id: string): Promise<RoadmapData> {
  return request<RoadmapData>('/recommend', {
    method: 'POST',
    body: JSON.stringify({ learner_id }),
  });
}

/** Always triggers a fresh roadmap generation (force recalculate from skills) */
export async function generateRoadmap(learner_id: string): Promise<RoadmapData> {
  return request<RoadmapData>('/recommend', {
    method: 'POST',
    body: JSON.stringify({ learner_id, force_regenerate: true }),
  });
}

export async function sendFeedback(
  learner_id: string,
  step_id: string,
  event: string,
  value?: number
) {
  return request<any>('/feedback', {
    method: 'POST',
    body: JSON.stringify({ learner_id, step_id, event, value }),
  });
}

export async function getStepExplanation(learner_id: string, step_id: string) {
  return request<any>(`/explain/${learner_id}/${step_id}`);
}

export async function signupUser(name: string, email: string, password: string): Promise<UserSession> {
  return request<UserSession>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
    timeoutMs: 20000,
  });
}

export async function loginUser(email: string, password: string): Promise<UserSession> {
  return request<UserSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    timeoutMs: 20000,
  });
}

export async function fetchHistory(learner_id: string): Promise<RoadmapHistoryItem[]> {
  try {
    const data = await request<RoadmapHistoryItem[]>(`/history/${learner_id}`, {
      timeoutMs: 7000,
    });
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('fetchHistory failed or timed out:', e);
    return [];
  }
}

export async function activateHistoryRoadmap(
  learner_id: string,
  history_id: string
): Promise<RoadmapData> {
  return request<RoadmapData>('/history/activate', {
    method: 'POST',
    body: JSON.stringify({ learner_id, history_id }),
  });
}

export async function deleteHistoryItem(learner_id: string, history_id: string): Promise<void> {
  await request<void>(`/history/${learner_id}/${history_id}`, {
    method: 'DELETE',
  });
}
