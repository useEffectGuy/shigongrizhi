import Taro from '@tarojs/taro';

const API_BASE = 'http://localhost:8519/api';

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  needAuth?: boolean;
}

let authToken: string | null = null;

export function setToken(token: string | null) {
  authToken = token;
  if (token) {
    Taro.setStorageSync('auth_token', token);
  } else {
    Taro.removeStorageSync('auth_token');
  }
}

export function getToken(): string | null {
  if (authToken) return authToken;
  return Taro.getStorageSync('auth_token') || null;
}

export async function request<T = any>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, header = {}, needAuth = true } = options;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...header
  };
  
  if (needAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  console.log(`[API] ${method} ${API_BASE}${url}`);
  
  try {
    const response = await Taro.request({
      url: `${API_BASE}${url}`,
      method,
      data,
      header: headers,
      timeout: 10000
    });
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return response.data as T;
    }
    
    if (response.statusCode === 401) {
      setToken(null);
      Taro.reLaunch({ url: '/pages/login/index' });
      throw new Error('登录已过期，请重新登录');
    }
    
    const errorData = response.data as any;
    throw new Error(errorData?.error || `请求失败: ${response.statusCode}`);
  } catch (error: any) {
    console.error(`[API Error] ${method} ${url}:`, error.message);
    throw error;
  }
}

export async function uploadFile(filePath: string): Promise<{ key: string; url: string }> {
  const token = getToken();
  if (!token) {
    throw new Error('请先登录');
  }
  
  console.log(`[API Upload] ${filePath}`);
  
  try {
    const response = await Taro.uploadFile({
      url: `${API_BASE}/files/upload`,
      filePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = JSON.parse(response.data);
    return data;
  } catch (error: any) {
    console.error('[API Upload Error]:', error.message);
    throw error;
  }
}
