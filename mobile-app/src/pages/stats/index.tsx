import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import { authService } from '@/services/auth';
import { logService } from '@/services/logs';
import { Project } from '@/types';

interface WorkerStat {
  name: string;
  count: number;
  log_count: number;
}

interface MaterialStat {
  name: string;
  count: number;
  unit: string;
  log_count: number;
}

interface EquipmentStat {
  name: string;
  count: number;
  unit: string;
  log_count: number;
}

interface StatsData {
  total_logs: number;
  workers: WorkerStat[];
  materials: MaterialStat[];
  equipment: EquipmentStat[];
}

const StatsPage: React.FC = () => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'workers' | 'materials' | 'equipment'>('workers');

  const loadStats = useCallback(async () => {
    if (!currentProject) return;
    
    setLoading(true);
    try {
      const data = await logService.getStats(currentProject.id);
      setStats(data);
    } catch (err: any) {
      console.error('[Stats] Load failed:', err.message);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, [currentProject]);

  useEffect(() => {
    const project = authService.getCurrentProject();
    if (!project) {
      Taro.showToast({ title: '请先选择项目', icon: 'none' });
      setTimeout(() => Taro.switchTab({ url: '/pages/home/index' }), 1500);
      return;
    }
    setCurrentProject(project);
  }, []);

  useEffect(() => {
    if (currentProject) {
      loadStats();
    }
  }, [currentProject, loadStats]);

  useDidShow(() => {
    if (currentProject) {
      loadStats();
    }
  });

  usePullDownRefresh(() => {
    loadStats();
  });

  const totalWorkers = stats?.workers?.reduce((sum, w) => sum + w.count, 0) || 0;
  const totalMaterials = stats?.materials?.reduce((sum, m) => sum + m.count, 0) || 0;
  const totalEquipment = stats?.equipment?.reduce((sum, e) => sum + e.count, 0) || 0;

  const workerLabels = stats?.workers?.slice(0, 5).map(w => w.name) || [];
  const workerValues = stats?.workers?.slice(0, 5).map(w => w.count) || [];
  const maxWorkerValue = Math.max(...workerValues, 1);

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.projectInfo}>
          <Text className={styles.projectName}>
            📊 {currentProject?.name || '请选择项目'}
          </Text>
          <Text className={styles.projectSubtitle}>数据统计</Text>
        </View>
      </View>

      <View className={styles.summaryRow}>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryValue}>{stats?.total_logs || 0}</Text>
          <Text className={styles.summaryLabel}>总日志数</Text>
        </View>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryValue}>{stats?.workers?.length || 0}</Text>
          <Text className={styles.summaryLabel}>工种类型</Text>
        </View>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryValue}>{totalWorkers}</Text>
          <Text className={styles.summaryLabel}>总人次</Text>
        </View>
      </View>

      <View className={styles.tabRow}>
        <Text
          className={styles.tabItem(activeTab === 'workers')}
          onClick={() => setActiveTab('workers')}
        >
          👷 人员
        </Text>
        <Text
          className={styles.tabItem(activeTab === 'materials')}
          onClick={() => setActiveTab('materials')}
        >
          🧱 材料
        </Text>
        <Text
          className={styles.tabItem(activeTab === 'equipment')}
          onClick={() => setActiveTab('equipment')}
        >
          🚜 机械
        </Text>
      </View>

      <ScrollView scrollY className={styles.scrollContent}>
        {loading ? (
          <View className={styles.empty}>加载中...</View>
        ) : activeTab === 'workers' ? (
          <View className={styles.content}>
            {stats?.workers && stats.workers.length > 0 ? (
              <>
                <View className={styles.chartCard}>
                  <Text className={styles.chartTitle}>人员分布（TOP 5）</Text>
                  {workerValues.map((value, index) => (
                    <View key={index} className={styles.chartBarRow}>
                      <Text className={styles.chartLabel}>{workerLabels[index]}</Text>
                      <View className={styles.chartBar}>
                        <View 
                          className={styles.chartBarFill}
                          style={{ width: `${(value / maxWorkerValue) * 100}%` }}
                        />
                      </View>
                      <Text className={styles.chartValue}>{value}人</Text>
                    </View>
                  ))}
                </View>

                <View className={styles.listCard}>
                  <Text className={styles.listTitle}>详细列表</Text>
                  {stats.workers.map((worker, index) => (
                    <View key={index} className={styles.listRow}>
                      <View className={styles.listRank}>
                        <Text className={styles.listRankText(index < 3)}>{index + 1}</Text>
                      </View>
                      <View className={styles.listInfo}>
                        <Text className={styles.listName}>{worker.name}</Text>
                        <Text className={styles.listSub}>出现 {worker.log_count} 次</Text>
                      </View>
                      <View className={styles.listRight}>
                        <Text className={styles.listValue}>{worker.count}</Text>
                        <Text className={styles.listUnit}>人</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View className={styles.empty}>
                <Text className={styles.emptyIcon}>👷</Text>
                <Text className={styles.emptyText}>暂无人员统计数据</Text>
                <Text className={styles.emptySubtip}>请先创建包含施工人员的日志</Text>
              </View>
            )}
          </View>
        ) : activeTab === 'materials' ? (
          <View className={styles.content}>
            {stats?.materials && stats.materials.length > 0 ? (
              <View className={styles.listCard}>
                <Text className={styles.listTitle}>材料使用统计</Text>
                {stats.materials.map((material, index) => (
                  <View key={index} className={styles.listRow}>
                    <View className={styles.listRank}>
                      <Text className={styles.listRankText(index < 3)}>{index + 1}</Text>
                    </View>
                    <View className={styles.listInfo}>
                      <Text className={styles.listName}>{material.name}</Text>
                      <Text className={styles.listSub}>出现 {material.log_count} 次</Text>
                    </View>
                    <View className={styles.listRight}>
                      <Text className={styles.listValue}>{material.count}</Text>
                      <Text className={styles.listUnit}>{material.unit}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className={styles.empty}>
                <Text className={styles.emptyIcon}>🧱</Text>
                <Text className={styles.emptyText}>暂无材料统计数据</Text>
                <Text className={styles.emptySubtip}>请先创建包含材料的日志</Text>
              </View>
            )}
          </View>
        ) : (
          <View className={styles.content}>
            {stats?.equipment && stats.equipment.length > 0 ? (
              <View className={styles.listCard}>
                <Text className={styles.listTitle}>机械设备统计</Text>
                {stats.equipment.map((equip, index) => (
                  <View key={index} className={styles.listRow}>
                    <View className={styles.listRank}>
                      <Text className={styles.listRankText(index < 3)}>{index + 1}</Text>
                    </View>
                    <View className={styles.listInfo}>
                      <Text className={styles.listName}>{equip.name}</Text>
                      <Text className={styles.listSub}>出现 {equip.log_count} 次</Text>
                    </View>
                    <View className={styles.listRight}>
                      <Text className={styles.listValue}>{equip.count}</Text>
                      <Text className={styles.listUnit}>{equip.unit}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className={styles.empty}>
                <Text className={styles.emptyIcon}>🚜</Text>
                <Text className={styles.emptyText}>暂无机械统计数据</Text>
                <Text className={styles.emptySubtip}>请先创建包含机械的日志</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default StatsPage;
