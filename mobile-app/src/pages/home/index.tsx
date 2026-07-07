import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh, useReachBottom } from '@tarojs/taro';
import styles from './index.module.scss';
import LogCard from '@/components/LogCard';
import EmptyState from '@/components/EmptyState';
import { authService } from '@/services/auth';
import { projectService } from '@/services/projects';
import { logService } from '@/services/logs';
import { Project, LogEntry } from '@/types';
import { mockProjects, mockLogs } from '@/data/mock';
import { useRenderDebug } from '@/utils/renderDebug';
import { logger } from '@/utils/logger';

type FilterType = 'all' | 'week' | 'today';

const HomePage: React.FC = () => {
  const renderCount = useRenderDebug('HomePage');

  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [useMock, setUseMock] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const loadProjects = useCallback(async () => {
    logger.debug('[Home] Loading projects');
    try {
      const data = await projectService.getProjects();
      setProjects(data);
      
      const stored = authService.getCurrentProject();
      if (stored) {
        const found = data.find(p => p.id === stored.id);
        if (found) {
          setCurrentProject(found);
          return;
        }
      }
      
      if (data.length > 0) {
        setCurrentProject(data[0]);
        authService.setCurrentProject({ id: data[0].id, name: data[0].name });
      }
    } catch (error: any) {
      logger.warn('[Home] Failed to load projects, using mock:', error.message);
      setUseMock(true);
      setProjects(mockProjects);
      if (mockProjects.length > 0) {
        setCurrentProject(mockProjects[0]);
      }
    }
  }, []);

  const loadLogs = useCallback(async (isRefresh = false) => {
    if (!currentProject) return;
    
    const currentPage = isRefresh ? 1 : page;
    
    if (!isRefresh && !hasMore) return;
    
    setLoading(true);
    logger.debug(`[Home] Loading logs, page: ${currentPage}`);
    
    try {
      if (useMock) {
        const filtered = mockLogs.filter(l => l.project_id === currentProject.id);
        setLogs(filtered);
        setTotalPages(1);
        setHasMore(false);
      } else {
        const response = await logService.getLogs(currentProject.id, currentPage, 10);
        if (isRefresh) {
          setLogs(response.logs);
        } else {
          setLogs(prev => [...prev, ...response.logs]);
        }
        setTotalPages(response.pagination.total_pages);
        setHasMore(currentPage < response.pagination.total_pages);
        setPage(currentPage + 1);
      }
    } catch (error: any) {
      logger.error('[Home] Failed to load logs:', error.message);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      if (isRefresh) {
        Taro.stopPullDownRefresh();
      }
    }
  }, [currentProject, page, hasMore, useMock]);

  const filteredLogs = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
    
    logger.debug(`[Home useMemo] filteredLogs calculating - filter: ${filter}, logs count: ${logs.length}`);

    let result = logs;
    if (filter === 'today') {
      result = logs.filter(log => new Date(log.created_at) >= todayStart);
    } else if (filter === 'week') {
      result = logs.filter(log => new Date(log.created_at) >= weekStart);
    }
    
    logger.debug(`[Home useMemo] filteredLogs result count: ${result.length}`);
    return result;
  }, [logs, filter]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

    const todayCount = logs.filter(log => new Date(log.created_at) >= todayStart).length;
    const weekCount = logs.filter(log => new Date(log.created_at) >= weekStart).length;
    const totalCount = logs.length;
    
    logger.debug(`[Home useMemo] stats calculated - total: ${totalCount}, week: ${weekCount}, today: ${todayCount}`);

    return { todayCount, weekCount, totalCount };
  }, [logs]);

  const handleFilterChange = (newFilter: FilterType) => {
    logger.debug(`[Home] Filter changed from ${filter} to ${newFilter}`);
    setFilter(newFilter);
  };

  useEffect(() => {
    logger.debug('[Home useEffect] Mount effect triggered');
    if (!authService.isAuthenticated()) {
      logger.debug('[Home useEffect] Not authenticated, redirecting to login');
      Taro.reLaunch({ url: '/pages/login/index' });
      return;
    }
    loadProjects();
  }, []);

  useEffect(() => {
    logger.debug('[Home useEffect] currentProject changed:', currentProject?.id, currentProject?.name);
    if (currentProject) {
      logger.debug('[Home useEffect] Resetting page and loading logs for project:', currentProject.id);
      setPage(1);
      setHasMore(true);
      setLogs([]);
      loadLogs(true);
    }
  }, [currentProject]);

  useDidShow(() => {
    logger.debug('[Home useDidShow] Page shown, currentProject:', currentProject?.id);
    if (currentProject && authService.isAuthenticated()) {
      logger.debug('[Home useDidShow] Refreshing logs');
      loadLogs(true);
    }
  });

  usePullDownRefresh(() => {
    logger.debug('[Home usePullDownRefresh] Pull down refresh triggered');
    setPage(1);
    setHasMore(true);
    loadLogs(true);
  });

  useReachBottom(() => {
    logger.debug('[Home useReachBottom] Reach bottom, loading:', loading, 'hasMore:', hasMore, 'filter:', filter);
    if (!loading && hasMore && filter === 'all') {
      loadLogs(false);
    }
  });

  const handleProjectSelect = () => {
    if (projects.length === 0) {
      Taro.showToast({ title: '请先创建项目', icon: 'none' });
      return;
    }
    
    const items = projects.map(p => `${p.name}${p.role === 'admin' ? ' (管理员)' : ''}`);
    
    Taro.showActionSheet({
      itemList: items,
      success: (res) => {
        const selected = projects[res.tapIndex];
        setCurrentProject(selected);
        authService.setCurrentProject({ id: selected.id, name: selected.name });
      }
    });
  };

  const handleAddLog = () => {
    if (!currentProject) {
      Taro.showToast({ title: '请先选择项目', icon: 'none' });
      return;
    }
    Taro.switchTab({ url: '/pages/log-create/index' });
  };

  const filterLabel = filter === 'all' ? '全部日志' : filter === 'week' ? '本周日志' : '今日日志';

  return (
    <View className={styles.container}>
      <View className={styles.projectHeader}>
        <View className={styles.projectSelector} onClick={handleProjectSelect}>
          <View className={styles.projectInfo}>
            <View className={styles.projectIcon}>
              <Text className={styles.projectIconText}>🏗️</Text>
            </View>
            <View>
              <Text className={styles.projectName}>
                {currentProject ? currentProject.name : '请选择项目'}
              </Text>
            </View>
          </View>
          <Text className={styles.projectArrow}>›</Text>
        </View>
        
        <View className={styles.statsRow}>
          <View 
            className={`${styles.statItem} ${filter === 'all' ? styles.statItemActive : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            <Text className={styles.statValue}>{stats.totalCount}</Text>
            <Text className={styles.statLabel}>总日志</Text>
          </View>
          <View 
            className={`${styles.statItem} ${filter === 'week' ? styles.statItemActive : ''}`}
            onClick={() => handleFilterChange('week')}
          >
            <Text className={styles.statValue}>{stats.weekCount}</Text>
            <Text className={styles.statLabel}>本周</Text>
          </View>
          <View 
            className={`${styles.statItem} ${filter === 'today' ? styles.statItemActive : ''}`}
            onClick={() => handleFilterChange('today')}
          >
            <Text className={styles.statValue}>{stats.todayCount}</Text>
            <Text className={styles.statLabel}>今日</Text>
          </View>
        </View>

        {filter !== 'all' && (
          <View className={styles.filterInfo}>
            <Text className={styles.filterInfoText}>
              显示：<Text className={styles.filterInfoLabel}>{filterLabel}</Text>
            </Text>
            <Text className={styles.filterInfoClear} onClick={() => handleFilterChange('all')}>
              清除筛选
            </Text>
          </View>
        )}
      </View>
      
      <ScrollView scrollY className={styles.logList}>
        {filteredLogs.length > 0 ? (
          filteredLogs.map(log => (
            <LogCard key={log.id} log={log} />
          ))
        ) : (
          <EmptyState
            icon="📝"
            title={filter === 'all' ? '暂无施工日志' : `暂无${filterLabel}`}
            desc={currentProject ? (filter === 'all' ? "点击右下角按钮新增日志" : "该时间段内暂无日志") : "请先选择或创建项目"}
          />
        )}
        
        {loading && (
          <View className={styles.loading}>
            <Text>加载中...</Text>
          </View>
        )}
        
        {!hasMore && filteredLogs.length > 0 && filter === 'all' && (
          <View className={styles.noMore}>
            <Text>— 没有更多了 —</Text>
          </View>
        )}
      </ScrollView>
      
      <View className={styles.fab} onClick={handleAddLog}>
        <Text className={styles.fabIcon}>+</Text>
      </View>
    </View>
  );
};

export default HomePage;
