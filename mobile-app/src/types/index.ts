export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface Device {
  device_id: string;
  device_name: string;
  last_active: string;
}

export interface Project {
  id: number;
  name: string;
  creator_id: number;
  created_at: string;
  role: 'admin' | 'member';
  log_count?: number;
}

export interface ProjectMember {
  id: number;
  username: string;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface WorkerEntry {
  name: string;
  count: number;
}

export interface MaterialEntry {
  name: string;
  count: number;
  unit: string;
}

export interface EquipmentEntry {
  name: string;
  count: number;
  unit: string;
}

export interface LogEntry {
  id: number;
  project_id: number;
  author_id: number;
  author_name: string;
  content: string;
  weather: string | null;
  temperature: number | null;
  image_keys: string[];
  workers: WorkerEntry[];
  materials: MaterialEntry[];
  equipment: EquipmentEntry[];
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  token: string;
  user_id: number;
  username: string;
  device_id: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  device_id: string | null;
  currentProject: Project | null;
  isAuthenticated: boolean;
}

export interface SyncResponse {
  logs: LogEntry[];
  server_time: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface LogListResponse {
  logs: LogEntry[];
  pagination: Pagination;
}
