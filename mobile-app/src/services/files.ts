import request from '@/utils/request';

class FileService {
  async getFileUrl(key: string): Promise<string> {
    try {
      const response = await request.get(`/files/url/${key}`);
      return response.data?.url || key;
    } catch (err: any) {
      console.warn('[FileService] Get URL failed:', err.message);
      return key;
    }
  }

  async uploadFile(filePath: string): Promise<{ key: string; url: string }> {
    return new Promise((resolve, reject) => {
      Taro.uploadFile({
        url: `${request.defaults.baseURL}/files/upload`,
        filePath,
        name: 'file',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token') || ''}`
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            if (data.data) {
              resolve(data.data);
            } else {
              reject(new Error(data.message || '上传失败'));
            }
          } catch {
            reject(new Error('解析响应失败'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const response = await request.delete(`/files/${key}`);
      return response.data?.success ?? true;
    } catch (err: any) {
      console.warn('[FileService] Delete failed:', err.message);
      return false;
    }
  }
}

export const fileService = new FileService();
