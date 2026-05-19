import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyStateProps {
  icon?: string;
  title?: string;
  desc?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📝',
  title = '暂无数据',
  desc = '快去创建第一条施工日志吧'
}) => {
  return (
    <View className={styles.container}>
      <View className={styles.icon}>
        <Text className={styles.iconText}>{icon}</Text>
      </View>
      <Text className={styles.title}>{title}</Text>
      <Text className={styles.desc}>{desc}</Text>
    </View>
  );
};

export default EmptyState;
