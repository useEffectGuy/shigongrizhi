import React, { useState, useEffect } from 'react';
import { View, Text, Textarea, Input, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import classNames from 'classnames';
import { authService } from '@/services/auth';
import { logService } from '@/services/logs';
import { uploadFile } from '@/utils/request';
import { weatherOptions, workerOptions, unitOptions } from '@/data/mock';
import { WorkerEntry, MaterialEntry, EquipmentEntry } from '@/types';

interface UploadedImage {
  localPath: string;
  key: string;
  url: string;
}

const LogCreatePage: React.FC = () => {
  const [content, setContent] = useState('');
  const [weather, setWeather] = useState<string>('');
  const [temperature, setTemperature] = useState<string>('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [workers, setWorkers] = useState<WorkerEntry[]>([]);
  const [materials, setMaterials] = useState<MaterialEntry[]>([]);
  const [equipment, setEquipment] = useState<EquipmentEntry[]>([]);
  const [currentProject, setCurrentProject] = useState<{ id: number; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showWorkerPicker, setShowWorkerPicker] = useState(false);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [showEquipmentPicker, setShowEquipmentPicker] = useState(false);

  useEffect(() => {
    const project = authService.getCurrentProject();
    setCurrentProject(project);
    if (!project) {
      Taro.showToast({ title: '请先选择项目', icon: 'none' });
      setTimeout(() => Taro.switchTab({ url: '/pages/home/index' }), 1500);
    }
  }, []);

  useDidShow(() => {
    const project = authService.getCurrentProject();
    setCurrentProject(project);
  });

  const handleWeatherSelect = (w: string) => {
    setWeather(weather === w ? '' : w);
  };

  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 9 - images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });
      
      const tempPaths = res.tempFilePaths;
      const newImages: UploadedImage[] = [];
      
      Taro.showLoading({ title: '上传中...' });
      
      for (const path of tempPaths) {
        try {
          const result = await uploadFile(path);
          newImages.push({
            localPath: path,
            key: result.key,
            url: result.url
          });
        } catch (err: any) {
          console.error('[LogCreate] Upload failed:', err.message);
          newImages.push({
            localPath: path,
            key: '',
            url: path
          });
        }
      }
      
      setImages(prev => [...prev, ...newImages]);
      Taro.hideLoading();
    } catch (err: any) {
      console.warn('[LogCreate] Choose image failed:', err.message);
      Taro.hideLoading();
    }
  };

  const handlePreviewImage = (img: UploadedImage) => {
    const urls = images.map(i => i.localPath || i.url);
    const current = img.localPath || img.url;
    Taro.previewImage({ current, urls });
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddWorker = () => {
    Taro.showActionSheet({
      itemList: workerOptions,
      success: (res) => {
        const selectedName = workerOptions[res.tapIndex];
        const existing = workers.find(w => w.name === selectedName);
        if (existing) {
          setWorkers(prev => prev.map(w => 
            w.name === selectedName ? { ...w, count: w.count + 1 } : w
          ));
        } else {
          setWorkers(prev => [...prev, { name: selectedName, count: 1 }]);
        }
      }
    });
  };

  const handleUpdateWorkerCount = (index: number, delta: number) => {
    setWorkers(prev => prev.map((w, i) => {
      if (i === index) {
        const newCount = Math.max(0, w.count + delta);
        return { ...w, count: newCount };
      }
      return w;
    }).filter(w => w.count > 0));
  };

  const handleRemoveWorker = (index: number) => {
    setWorkers(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddMaterial = () => {
    Taro.showModal({
      title: '添加材料',
      editable: true,
      placeholderText: '材料名称，如：混凝土',
      success: (res) => {
        if (res.confirm && res.content) {
          setMaterials(prev => [...prev, { name: res.content, count: 0, unit: '方' }]);
        }
      }
    });
  };

  const handleUpdateMaterial = (index: number, field: 'count' | 'unit', value: string) => {
    setMaterials(prev => prev.map((m, i) => {
      if (i === index) {
        if (field === 'count') {
          return { ...m, count: parseFloat(value) || 0 };
        } else {
          return { ...m, unit: value };
        }
      }
      return m;
    }));
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterials(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddEquipment = () => {
    Taro.showModal({
      title: '添加机械',
      editable: true,
      placeholderText: '机械名称，如：塔吊',
      success: (res) => {
        if (res.confirm && res.content) {
          setEquipment(prev => [...prev, { name: res.content, count: 0, unit: '台' }]);
        }
      }
    });
  };

  const handleUpdateEquipment = (index: number, field: 'count' | 'unit', value: string) => {
    setEquipment(prev => prev.map((e, i) => {
      if (i === index) {
        if (field === 'count') {
          return { ...e, count: parseFloat(value) || 0 };
        } else {
          return { ...e, unit: value };
        }
      }
      return e;
    }));
  };

  const handleRemoveEquipment = (index: number) => {
    setEquipment(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Taro.showToast({ title: '请输入日志内容', icon: 'none' });
      return;
    }
    
    if (!currentProject) {
      Taro.showToast({ title: '请先选择项目', icon: 'none' });
      return;
    }
    
    setSubmitting(true);
    Taro.showLoading({ title: '提交中...' });
    
    try {
      await logService.createLog(currentProject.id, {
        content: content.trim(),
        weather: weather || undefined,
        temperature: temperature ? parseFloat(temperature) : undefined,
        imageKeys: images.filter(i => i.key).map(i => i.key),
        workers: workers,
        materials: materials.filter(m => m.count > 0),
        equipment: equipment.filter(e => e.count > 0)
      });
      
      Taro.hideLoading();
      Taro.showToast({ title: '提交成功', icon: 'success' });
      
      setContent('');
      setWeather('');
      setTemperature('');
      setImages([]);
      setWorkers([]);
      setMaterials([]);
      setEquipment([]);
      
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/home/index' });
      }, 1500);
    } catch (err: any) {
      console.error('[LogCreate] Submit failed:', err.message);
      Taro.hideLoading();
      Taro.showToast({ title: err.message || '提交失败', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = content.trim().length > 0 && !submitting;
  const totalWorkers = workers.reduce((sum, w) => sum + w.count, 0);

  return (
    <View className={styles.container}>
      <ScrollView scrollY className={styles.scrollContainer}>
        <View className={styles.form}>
          {currentProject && (
            <View className={styles.formItem}>
              <Text className={styles.label}>当前项目</Text>
              <Text style={{ color: '#4E5969', fontSize: '28rpx' }}>
                📍 {currentProject.name}
              </Text>
            </View>
          )}
          
          <View className={styles.formItem}>
            <Text className={styles.label}>日志内容 <Text style={{ color: '#F53F3F' }}>*</Text></Text>
            <Textarea
              className={styles.textarea}
              placeholder="请输入今天的施工内容、进展情况、遇到的问题等..."
              placeholderStyle={{ color: '#86909C' }}
              value={content}
              onInput={(e) => setContent(e.detail.value)}
              maxlength={2000}
              showConfirmBar={false}
              autoHeight
            />
          </View>
          
          <View className={styles.formItem}>
            <Text className={styles.label}>天气情况</Text>
            <View className={styles.weatherRow}>
              {weatherOptions.map(w => (
                <Text
                  key={w}
                  className={classNames(styles.weatherItem, { [styles.active]: weather === w })}
                  onClick={() => handleWeatherSelect(w)}
                >
                  {w}
                </Text>
              ))}
            </View>
          </View>
          
          <View className={styles.formItem}>
            <Text className={styles.label}>当前温度</Text>
            <View className={styles.tempRow}>
              <Input
                className={styles.tempInput}
                type="digit"
                placeholder="输入温度，如 28"
                placeholderStyle={{ color: '#86909C' }}
                value={temperature}
                onInput={(e) => setTemperature(e.detail.value)}
              />
              <Text className={styles.tempUnit}>°C</Text>
            </View>
          </View>
          
          <View className={styles.formItem}>
            <View className={styles.labelRow}>
              <Text className={styles.label}>现场照片 ({images.length}/9)</Text>
              <Text className={styles.tipText}>点击上传，点击图片可放大查看</Text>
            </View>
            <View className={styles.imageGrid}>
              {images.map((img, index) => (
                <View key={index} className={styles.imageItem}>
                  <Image
                    className={styles.imagePreview}
                    src={img.localPath || img.url}
                    mode="aspectFill"
                    onClick={() => handlePreviewImage(img)}
                  />
                  <Text
                    className={styles.imageRemove}
                    onClick={() => handleRemoveImage(index)}
                  >
                    ×
                  </Text>
                </View>
              ))}
              {images.length < 9 && (
                <View className={styles.addImage} onClick={handleChooseImage}>
                  <Text className={styles.addIcon}>+</Text>
                  <Text className={styles.addText}>上传照片</Text>
                </View>
              )}
            </View>
          </View>
          
          <View className={styles.formItem}>
            <View className={styles.labelRow}>
              <Text className={styles.label}>施工人员 ({totalWorkers}人)</Text>
            </View>
            <View className={styles.resourceList}>
              {workers.map((worker, index) => (
                <View key={index} className={styles.resourceItem}>
                  <Text className={styles.resourceName}>{worker.name}</Text>
                  <View className={styles.counterRow}>
                    <Text 
                      className={styles.counterBtn} 
                      onClick={() => handleUpdateWorkerCount(index, -1)}
                    >
                      -
                    </Text>
                    <Text className={styles.counterValue}>{worker.count}</Text>
                    <Text 
                      className={styles.counterBtn} 
                      onClick={() => handleUpdateWorkerCount(index, 1)}
                    >
                      +
                    </Text>
                  </View>
                  <Text 
                    className={styles.resourceDelete} 
                    onClick={() => handleRemoveWorker(index)}
                  >
                    删除
                  </Text>
                </View>
              ))}
              <View className={styles.addResource} onClick={handleAddWorker}>
                <Text className={styles.addIcon}>+</Text>
                <Text className={styles.addResourceText}>添加人员</Text>
              </View>
            </View>
          </View>
          
          <View className={styles.formItem}>
            <Text className={styles.label}>材料使用</Text>
            <View className={styles.resourceList}>
              {materials.map((material, index) => (
                <View key={index} className={styles.materialItem}>
                  <View className={styles.materialRow}>
                    <Text className={styles.materialName}>{material.name}</Text>
                    <Text 
                      className={styles.resourceDelete} 
                      onClick={() => handleRemoveMaterial(index)}
                    >
                      删除
                    </Text>
                  </View>
                  <View className={styles.materialInputRow}>
                    <Input
                      className={styles.materialInput}
                      type="digit"
                      placeholder="数量"
                      value={material.count > 0 ? String(material.count) : ''}
                      onInput={(e) => handleUpdateMaterial(index, 'count', e.detail.value)}
                    />
                    <View className={styles.unitSelector}>
                      <Text className={styles.unitText}>{material.unit}</Text>
                    </View>
                  </View>
                </View>
              ))}
              <View className={styles.addResource} onClick={handleAddMaterial}>
                <Text className={styles.addIcon}>+</Text>
                <Text className={styles.addResourceText}>添加材料</Text>
              </View>
            </View>
          </View>
          
          <View className={styles.formItem}>
            <Text className={styles.label}>机械设备</Text>
            <View className={styles.resourceList}>
              {equipment.map((equip, index) => (
                <View key={index} className={styles.materialItem}>
                  <View className={styles.materialRow}>
                    <Text className={styles.materialName}>{equip.name}</Text>
                    <Text 
                      className={styles.resourceDelete} 
                      onClick={() => handleRemoveEquipment(index)}
                    >
                      删除
                    </Text>
                  </View>
                  <View className={styles.materialInputRow}>
                    <Input
                      className={styles.materialInput}
                      type="digit"
                      placeholder="数量"
                      value={equip.count > 0 ? String(equip.count) : ''}
                      onInput={(e) => handleUpdateEquipment(index, 'count', e.detail.value)}
                    />
                    <View className={styles.unitSelector}>
                      <Text className={styles.unitText}>{equip.unit}</Text>
                    </View>
                  </View>
                </View>
              ))}
              <View className={styles.addResource} onClick={handleAddEquipment}>
                <Text className={styles.addIcon}>+</Text>
                <Text className={styles.addResourceText}>添加机械</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View className={styles.submitBar}>
        <Button className={classNames(styles.submitBtn, { [styles.submitBtnDisabled]: !canSubmit })} onClick={handleSubmit}>
          {submitting ? '提交中...' : '提交日志'}
        </Button>
      </View>
    </View>
  );
};

export default LogCreatePage;
