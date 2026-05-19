import React, { useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import classNames from 'classnames';
import { projectService } from '@/services/projects';
import { authService } from '@/services/auth';
import { Project } from '@/types';

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useDidShow(() => {
    loadProjects();
  });

  const loadProjects = async () => {
    setLoading(true);
    try {
      const list = await projectService.getProjects();
      setProjects(list);
      setCurrentProject(authService.getCurrentProject());
    } catch (err: any) {
      console.error('[Projects] Load failed:', err.message);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = (project: Project) => {
    authService.setCurrentProject(project);
    setCurrentProject(project);
    Taro.showToast({ title: `已切换到 ${project.name}`, icon: 'success' });
    setTimeout(() => {
      Taro.switchTab({ url: '/pages/home/index' });
    }, 1000);
  };

  const handleAddProject = () => {
    Taro.showModal({
      title: '创建新项目',
      editable: true,
      placeholderText: '请输入项目名称',
      confirmText: '创建'
    }).then(async (res) => {
      if (res.confirm && res.content) {
        try {
          const newProject = await projectService.createProject({
            name: res.content.trim(),
            description: ''
          });
          setProjects(prev => [...prev, newProject]);
          Taro.showToast({ title: '创建成功', icon: 'success' });
        } catch (err: any) {
          console.error('[Projects] Create failed:', err.message);
          Taro.showToast({ title: '创建失败', icon: 'none' });
        }
      }
    });
  };

  const getProjectInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'P';
  };

  if (loading) {
    return (
      <View className={styles.container}>
        <View className={styles.empty}>加载中...</View>
      </View>
    );
  }

  if (projects.length === 0) {
    return (
      <View className={styles.container}>
        <View className={styles.empty}>
          <Text className={styles.emptyIcon}>📁</Text>
          <Text className={styles.emptyText}>还没有项目，创建一个开始吧</Text>
          <View className={styles.emptyBtn} onClick={handleAddProject}>
            + 新建项目
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.container}>
      <View className={styles.list}>
        {projects.map(project => (
          <View
            key={project.id}
            className={classNames(styles.projectItem, {
              [styles.active]: currentProject?.id === project.id
            })}
            onClick={() => handleSelectProject(project)}
          >
            <View className={styles.projectHeader}>
              <View className={styles.projectIcon}>
                <Text className={styles.projectIconText}>
                  {getProjectInitial(project.name)}
                </Text>
              </View>
              <View className={styles.projectInfo}>
                <View style={{ display: 'flex', alignItems: 'center' }}>
                  <Text className={styles.projectName}>{project.name}</Text>
                  {currentProject?.id === project.id && (
                    <Text className={styles.activeBadge}>当前</Text>
                  )}
                </View>
                {project.description ? (
                  <Text className={styles.projectDesc}>{project.description}</Text>
                ) : (
                  <Text className={styles.projectDesc}>暂无描述</Text>
                )}
              </View>
            </View>
            <View className={styles.projectMeta}>
              <Text className={styles.metaItem}>
                <Text className={styles.metaIcon}>📋</Text>
                {project.logCount || 0} 条日志
              </Text>
            </View>
          </View>
        ))}
      </View>
      
      <View className={styles.addBtn} onClick={handleAddProject}>
        <Text className={styles.addBtnIcon}>+</Text>
        新建项目
      </View>
    </View>
  );
};

export default ProjectsPage;
