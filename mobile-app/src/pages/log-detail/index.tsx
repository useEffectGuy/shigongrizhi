import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { logService } from '@/services/logs';
import { fileService } from '@/services/files';
import { LogEntry } from '@/types';
import { formatDate, formatTime } from '@/utils/date';

const LogDetailPage: React.FC = () => {
  const [log, setLog] = useState<LogEntry | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogDetail();
  }, []);

  useDidShow(() => {
    if (!log) loadLogDetail();
  });

  const loadLogDetail = async () => {
    const logId = Taro.getStorageSync('currentLogId') || Taro.getCurrentInstance().router?.params?.id;
    
    if (!logId) {
      Taro.showToast({ title: '日志不存在', icon: 'none' });
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const logData = await logService.getLogById(Number(logId));
      if (logData) {
        setLog(logData);
        if (logData.image_keys && logData.image_keys.length > 0) {
          const urls: string[] = [];
          for (const key of logData.image_keys) {
            try {
              const url = await fileService.getFileUrl(key);
              urls.push(url);
            } catch {
              urls.push(key);
            }
          }
          setImageUrls(urls);
        }
      } else {
        Taro.showToast({ title: '日志不存在', icon: 'none' });
      }
    } catch (err: any) {
      console.error('[LogDetail] Load failed:', err.message);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewImage = (index: number) => {
    if (imageUrls.length > 0) {
      Taro.previewImage({
        current: imageUrls[index],
        urls: imageUrls
      });
    }
  };

  const totalWorkers = log?.workers?.reduce((sum, w) => sum + w.count, 0) || 0;

  if (loading) {
    return (
      <View className={styles.container}>
        <View className={styles.empty}>加载中...</View>
      </View>
    );
  }

  if (!log) {
    return (
      <View className={styles.container}>
        <View className={styles.empty}>日志不存在</View>
      </View>
    );
  }

  return (
    <View className={styles.container}>
      <ScrollView scrollY className={styles.scrollContainer}>
        <View className={styles.content}>
          <View className={styles.headerCard}>
            <Text className={styles.logDate}>
              📅 {formatDate(log.created_at)}
            </Text>
            <View className={styles.metaRow}>
              {log.weather && (
                <Text className={styles.metaItem}>
                  <Text className={styles.metaIcon}>🌤️</Text>
                  {log.weather}
                </Text>
              )}
              {log.temperature != null && (
                <Text className={styles.metaItem}>
                  <Text className={styles.metaIcon}>🌡️</Text>
                  {log.temperature}°C
                </Text>
              )}
              <Text className={styles.metaItem}>
                <Text className={styles.metaIcon}>🕐</Text>
                {formatTime(log.created_at)}
              </Text>
            </View>
          </View>
          
          <View className={styles.card}>
            <Text className={styles.cardTitle}>
              <Text className={styles.cardTitleIcon}>📝</Text>
              日志内容
            </Text>
            <Text className={styles.cardContent}>{log.content}</Text>
          </View>
          
          {imageUrls.length > 0 && (
            <View className={styles.card}>
              <Text className={styles.cardTitle}>
                <Text className={styles.cardTitleIcon}>📷</Text>
                现场照片 ({imageUrls.length})
              </Text>
              <View className={styles.imagesRow}>
                {imageUrls.map((url, index) => (
                  <View
                    key={index}
                    className={styles.imageItem}
                    onClick={() => handlePreviewImage(index)}
                  >
                    <Image
                      className={styles.imagePreview}
                      src={url}
                      mode="aspectFill"
                    />
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {log.workers && log.workers.length > 0 && (
            <View className={styles.card}>
              <Text className={styles.cardTitle}>
                <Text className={styles.cardTitleIcon}>👷</Text>
                施工人员 ({totalWorkers}人)
              </Text>
              <View className={styles.resourceList}>
                {log.workers.map((worker, index) => (
                  <View key={index} className={styles.resourceRow}>
                    <Text className={styles.resourceName}>{worker.name}</Text>
                    <Text className={styles.resourceCount}>{worker.count}人</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {log.materials && log.materials.length > 0 && (
            <View className={styles.card}>
              <Text className={styles.cardTitle}>
                <Text className={styles.cardTitleIcon}>🧱</Text>
                材料使用
              </Text>
              <View className={styles.resourceList}>
                {log.materials.map((material, index) => (
                  <View key={index} className={styles.resourceRow}>
                    <Text className={styles.resourceName}>{material.name}</Text>
                    <Text className={styles.resourceCount}>{material.count}{material.unit}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {log.equipment && log.equipment.length > 0 && (
            <View className={styles.card}>
              <Text className={styles.cardTitle}>
                <Text className={styles.cardTitleIcon}>🚜</Text>
                机械设备
              </Text>
              <View className={styles.resourceList}>
                {log.equipment.map((equip, index) => (
                  <View key={index} className={styles.resourceRow}>
                    <Text className={styles.resourceName}>{equip.name}</Text>
                    <Text className={styles.resourceCount}>{equip.count}{equip.unit}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          <View className={styles.card}>
            <Text className={styles.cardTitle}>
              <Text className={styles.cardTitleIcon}>ℹ️</Text>
              日志信息
            </Text>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>日志ID</Text>
              <Text className={styles.infoValue}>{log.id}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>创建人</Text>
              <Text className={styles.infoValue}>{log.author_name}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>创建时间</Text>
              <Text className={styles.infoValue}>
                {formatDate(log.created_at)} {formatTime(log.created_at)}
              </Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>更新时间</Text>
              <Text className={styles.infoValue}>
                {formatDate(log.updated_at)} {formatTime(log.updated_at)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default LogDetailPage;
