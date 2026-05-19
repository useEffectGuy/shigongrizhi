import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { LogEntry } from '@/types';

interface LogCardProps {
  log: LogEntry;
  onClick?: () => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const mins = Math.floor(diff / (1000 * 60));
      return mins <= 0 ? '刚刚' : `${mins}分钟前`;
    }
    return `${hours}小时前`;
  } else if (days === 1) {
    return '昨天';
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  }
}

const LogCard: React.FC<LogCardProps> = ({ log, onClick }) => {
  const initial = log.author_name?.charAt(0) || '记';
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/log-detail/index?id=${log.id}&projectId=${log.project_id}`
      });
    }
  };
  
  return (
    <View className={styles.container} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.authorInfo}>
          <View className={styles.avatar}>
            <Text className={styles.avatarText}>{initial}</Text>
          </View>
          <View>
            <Text className={styles.authorName}>{log.author_name}</Text>
            <Text className={styles.time}>{formatDate(log.created_at)}</Text>
          </View>
        </View>
        
        <View className={styles.tags}>
          {log.weather && (
            <Text className={`${styles.tag} ${styles.weatherTag}`}>{log.weather}</Text>
          )}
          {log.temperature !== null && log.temperature !== undefined && (
            <Text className={`${styles.tag} ${styles.tempTag}`}>{log.temperature}°C</Text>
          )}
        </View>
      </View>
      
      <Text className={styles.content}>{log.content}</Text>
      
      {log.image_keys && log.image_keys.length > 0 && (
        <View className={styles.images}>
          {log.image_keys.slice(0, 3).map((key, idx) => (
            <View key={idx} className={styles.imageItem}>
              <Image
                src={`http://localhost:3000/api/files/${encodeURIComponent(key)}`}
                mode="aspectFill"
                style={{ width: '100%', height: '100%' }}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default LogCard;
