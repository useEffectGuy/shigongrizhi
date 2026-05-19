import Taro from '@tarojs/taro';
import { request, setToken, getToken } from '@/utils/request';
import { User, Device, LoginResponse } from '@/types';

const STORAGE_KEYS = {
  USER: 'auth_user',
  DEVICE_ID: 'auth_device_id',
  CURRENT_PROJECT: 'current_project'
};

export const authService = {
  async register(username: string, password: string): Promise<{ success: boolean; user_id: number }> {
    console.log('[Auth] Registering user:', username);
    const result = await request({
      url: '/auth/register',
      method: 'POST',
      data: { username, password },
      needAuth: false
    });
    return result;
  },

  async login(username: string, password: string, deviceName: string = 'Android手机'): Promise<LoginResponse> {
    console.log('[Auth] Logging in:', username);
    const result = await request<LoginResponse>({
      url: '/auth/login',
      method: 'POST',
      data: { username, password, device_name: deviceName },
      needAuth: false
    });
    
    setToken(result.token);
    Taro.setStorageSync(STORAGE_KEYS.USER, { id: result.user_id, username: result.username });
    Taro.setStorageSync(STORAGE_KEYS.DEVICE_ID, result.device_id);
    
    return result;
  },

  async logout(): Promise<void> {
    console.log('[Auth] Logging out');
    try {
      await request({
        url: '/auth/logout',
        method: 'POST'
      });
    } catch (error) {
      console.warn('[Auth] Server logout failed, proceeding with local logout');
    }
    
    setToken(null);
    Taro.removeStorageSync(STORAGE_KEYS.USER);
    Taro.removeStorageSync(STORAGE_KEYS.DEVICE_ID);
    Taro.removeStorageSync(STORAGE_KEYS.CURRENT_PROJECT);
  },

  async getCurrentUser(): Promise<User> {
    console.log('[Auth] Getting current user');
    return request<User>({ url: '/auth/me' });
  },

  async getDevices(): Promise<Device[]> {
    console.log('[Auth] Getting devices');
    return request<Device[]>({ url: '/auth/devices' });
  },

  async removeDevice(deviceId: string): Promise<void> {
    console.log('[Auth] Removing device:', deviceId);
    await request({
      url: `/auth/devices/${deviceId}`,
      method: 'DELETE'
    });
  },

  getStoredUser(): User | null {
    try {
      return Taro.getStorageSync(STORAGE_KEYS.USER) || null;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!getToken();
  },

  getCurrentProject(): { id: number; name: string } | null {
    try {
      return Taro.getStorageSync(STORAGE_KEYS.CURRENT_PROJECT) || null;
    } catch {
      return null;
    }
  },

  setCurrentProject(project: { id: number; name: string } | null): void {
    if (project) {
      Taro.setStorageSync(STORAGE_KEYS.CURRENT_PROJECT, project);
    } else {
      Taro.removeStorageSync(STORAGE_KEYS.CURRENT_PROJECT);
    }
  }
};
