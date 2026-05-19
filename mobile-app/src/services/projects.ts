import { request } from '@/utils/request';
import { Project, ProjectMember } from '@/types';

export const projectService = {
  async getProjects(): Promise<Project[]> {
    console.log('[Project] Getting projects');
    return request<Project[]>({ url: '/projects' });
  },

  async getProjectDetail(projectId: number): Promise<Project & { members: ProjectMember[] }> {
    console.log('[Project] Getting project detail:', projectId);
    return request({ url: `/projects/${projectId}` });
  },

  async createProject(name: string): Promise<Project> {
    console.log('[Project] Creating project:', name);
    return request<Project>({
      url: '/projects',
      method: 'POST',
      data: { name }
    });
  },

  async updateProject(projectId: number, name: string): Promise<Project> {
    console.log('[Project] Updating project:', projectId);
    return request<Project>({
      url: `/projects/${projectId}`,
      method: 'PUT',
      data: { name }
    });
  },

  async deleteProject(projectId: number): Promise<void> {
    console.log('[Project] Deleting project:', projectId);
    await request({
      url: `/projects/${projectId}`,
      method: 'DELETE'
    });
  },

  async addMember(projectId: number, username: string): Promise<ProjectMember> {
    console.log('[Project] Adding member:', username);
    return request<ProjectMember>({
      url: `/projects/${projectId}/members`,
      method: 'POST',
      data: { username }
    });
  },

  async removeMember(projectId: number, userId: number): Promise<void> {
    console.log('[Project] Removing member:', userId);
    await request({
      url: `/projects/${projectId}/members/${userId}`,
      method: 'DELETE'
    });
  }
};
