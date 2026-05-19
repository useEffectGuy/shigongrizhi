import { request } from '@/utils/request';
import { LogEntry, LogListResponse, SyncResponse, WorkerEntry, MaterialEntry, EquipmentEntry } from '@/types';

export const logService = {
  async getLogs(projectId: number, page: number = 1, limit: number = 20): Promise<LogListResponse> {
    console.log(`[Log] Getting logs for project ${projectId}, page ${page}`);
    return request<LogListResponse>({
      url: `/logs/${projectId}?page=${page}&limit=${limit}`
    });
  },

  async getLogDetail(projectId: number, logId: number): Promise<LogEntry> {
    console.log(`[Log] Getting log detail: ${logId}`);
    return request<LogEntry>({
      url: `/logs/${projectId}/${logId}`
    });
  },

  async getLogById(logId: number): Promise<LogEntry> {
    console.log(`[Log] Getting log by id: ${logId}`);
    const project = JSON.parse(localStorage.getItem('currentProject') || '{"id":1}');
    return this.getLogDetail(project.id, logId);
  },

  async createLog(projectId: number, data: {
    content: string;
    weather?: string;
    temperature?: number;
    imageKeys?: string[];
    workers?: WorkerEntry[];
    materials?: MaterialEntry[];
    equipment?: EquipmentEntry[];
  }): Promise<LogEntry> {
    console.log(`[Log] Creating log for project ${projectId}`);
    return request<LogEntry>({
      url: `/logs/${projectId}`,
      method: 'POST',
      data: {
        content: data.content,
        weather: data.weather || null,
        temperature: data.temperature || null,
        imageKeys: data.imageKeys || [],
        workers: data.workers || [],
        materials: data.materials || [],
        equipment: data.equipment || []
      }
    });
  },

  async updateLog(projectId: number, logId: number, data: {
    content?: string;
    weather?: string;
    temperature?: number;
    imageKeys?: string[];
    workers?: WorkerEntry[];
    materials?: MaterialEntry[];
    equipment?: EquipmentEntry[];
  }): Promise<LogEntry> {
    console.log(`[Log] Updating log: ${logId}`);
    return request<LogEntry>({
      url: `/logs/${projectId}/${logId}`,
      method: 'PUT',
      data
    });
  },

  async deleteLog(projectId: number, logId: number): Promise<void> {
    console.log(`[Log] Deleting log: ${logId}`);
    await request({
      url: `/logs/${projectId}/${logId}`,
      method: 'DELETE'
    });
  },

  async syncLogs(projectId: number, lastSync?: string): Promise<SyncResponse> {
    const url = lastSync 
      ? `/logs/sync/${projectId}?lastSync=${encodeURIComponent(lastSync)}`
      : `/logs/sync/${projectId}`;
    console.log(`[Log] Syncing logs for project ${projectId}`);
    return request<SyncResponse>({ url });
  },

  async getStats(projectId: number): Promise<{
    total_logs: number;
    workers: { name: string; count: number; log_count: number }[];
    materials: { name: string; count: number; unit: string; log_count: number }[];
    equipment: { name: string; count: number; unit: string; log_count: number }[];
  }> {
    console.log(`[Log] Getting stats for project ${projectId}`);
    return request({
      url: `/logs/${projectId}/stats/summary`
    });
  }
};
