import { request } from '@/utils/request';
import { Project, ProjectMember } from '@/types';
import { logger } from '@/utils/logger';
import cache from '@/utils/cache';

export const projectService = {
  async getProjects(): Promise<Project[]> {
    logger.debug('[Project] Getting projects');
    
    // Try to get from cache first
    const cached = cache.get<Project[]>('/projects', 'GET');
    if (cached) {
      return cached;
    }
    
    const data = await request<Project[]>({ url: '/projects' });
    // Cache for 5 minutes
    cache.set('/projects', data, 'GET', 5 * 60 * 1000);
    return data;
  },

  async getProjectDetail(projectId: number): Promise<Project & { members: ProjectMember[] }> {
    logger.debug('[Project] Getting project detail:', projectId);
    return request({ url: `/projects/${projectId}` });
  },

  async createProject(name: string): Promise<Project> {
    logger.debug('[Project] Creating project:', name);
    const result = await request<Project>({
      url: '/projects',
      method: 'POST',
      data: { name }
    });
    // Clear projects cache after creating
    cache.clear('/projects');
    return result;
  },

  async updateProject(projectId: number, name: string): Promise<Project> {
    logger.debug('[Project] Updating project:', projectId);
    const result = await request<Project>({
      url: `/projects/${projectId}`,
      method: 'PUT',
      data: { name }
    });
    // Clear projects cache after updating
    cache.clear('/projects');
    return result;
  },

  async deleteProject(projectId: number): Promise<void> {
    logger.debug('[Project] Deleting project:', projectId);
    await request({
      url: `/projects/${projectId}`,
      method: 'DELETE'
    });
    // Clear projects cache after deleting
    cache.clear('/projects');
  },

  async addMember(projectId: number, username: string): Promise<ProjectMember> {
    logger.debug('[Project] Adding member:', username);
    const result = await request<ProjectMember>({
      url: `/projects/${projectId}/members`,
      method: 'POST',
      data: { username }
    });
    // Clear project detail cache
    cache.clear(`/projects/${projectId}`);
    return result;
  },

  async removeMember(projectId: number, userId: number): Promise<void> {
    logger.debug('[Project] Removing member:', userId);
    await request({
      url: `/projects/${projectId}/members/${userId}`,
      method: 'DELETE'
    });
    // Clear project detail cache
    cache.clear(`/projects/${projectId}`);
  }
};
