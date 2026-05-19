import React, { useState } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { authService } from '@/services/auth';
import { User } from '@/types';

interface DeviceInfo {
  id: number;
  name: string;
  lastActive: string;
  isCurrent: boolean;
}

const menuItems = [
  { key: 'projects', label: '项目管理', icon: '📁', path: '/pages/projects/index' },
  { key: 'stats', label: '数据统计', icon: '📊', path: '/pages/stats/index' },
  { key: 'sync', label: '同步设置', icon: '🔄', path: null }
];

const MinePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [devices] = useState<DeviceInfo[]>([
    { id: 1, name: 'HUAWEI Mate 60 Pro', lastActive: '刚刚', isCurrent: true },
    { id: 2, name: 'iPhone 15 Pro Max', lastActive: '2 天前', isCurrent: false },
    { id: 3, name: 'Xiaomi 14 Ultra', lastActive: '1 周前', isCurrent: false }
  ]);

  useDidShow(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  });

  const handleMenuClick = (path: string | null) => {
    if (path) {
      Taro.navigateTo({ url: path });
    } else {
      Taro.showToast({ title: '功能开发中', icon: 'none' });
    }
  };

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      confirmColor: '#F53F3F'
    }).then((res) => {
      if (res.confirm) {
        authService.logout();
        Taro.reLaunch({ url: '/pages/login/index' });
      }
    });
  };

  const getInitial = (username: string) => {
    return username ? username.charAt(0).toUpperCase() : 'U';
  };

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.header}>
        <View className={styles.avatar}>
          <Text className={styles.avatarText}>
            {user ? getInitial(user.username) : 'U'}
          </Text>
        </View>
        <View className={styles.userInfo}>
          <Text className={styles.username}>
            {user?.username || '加载中...'}
          </Text>
          <Text className={styles.userId}>
            ID: {user?.id || '-'}
          </Text>
        </View>
      </View>
      
      <Text className={styles.sectionTitle}>功能菜单</Text>
      <View className={styles.section}>
        {menuItems.map(item => (
          <View
            key={item.key}
            className={styles.menuItem}
            onClick={() => handleMenuClick(item.path)}
          >
            <View className={styles.menuIcon}>
              <Text>{item.icon}</Text>
            </View>
            <Text className={styles.menuLabel}>{item.label}</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        ))}
      </View>
      
      <Text className={styles.sectionTitle}>在线设备 ({devices.length})</Text>
      <View className={styles.section}>
        {devices.map(device => (
          <View key={device.id} className={styles.deviceItem}>
            <Text className={styles.deviceIcon}>📱</Text>
            <View className={styles.deviceInfo}>
              <Text className={styles.deviceName}>{device.name}</Text>
              <Text className={styles.deviceTime}>最后活跃: {device.lastActive}</Text>
            </View>
            {device.isCurrent && (
              <Text className={styles.deviceCurrent}>当前设备</Text>
            )}
          </View>
        ))}
      </View>
      
      <View className={styles.section}>
        <View className={styles.menuItem} onClick={() => Taro.showToast({ title: '功能开发中', icon: 'none' })}>
          <View className={styles.menuIcon}>
            <Text>⚙️</Text>
          </View>
          <Text className={styles.menuLabel}>系统设置</Text>
          <Text className={styles.menuArrow}>›</Text>
        </View>
        <View className={styles.menuItem} onClick={() => Taro.showToast({ title: '功能开发中', icon: 'none' })}>
          <View className={styles.menuIcon}>
            <Text>📄</Text>
          </View>
          <Text className={styles.menuLabel}>关于我们</Text>
          <Text className={styles.menuArrow}>›</Text>
        </View>
      </View>
      
      <Button className={styles.logoutBtn} onClick={handleLogout}>
        退出登录
      </Button>
    </ScrollView>
  );
};

export default MinePage;
