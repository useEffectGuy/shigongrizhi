import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classNames from 'classnames';
import { authService } from '@/services/auth';

const LoginPage: React.FC = () => {
  const renderCount = useRef(0);
  renderCount.current++;
  
  console.log(`[Render Count] LoginPage render #${renderCount.current}`);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('[Login useEffect] Mount effect');
    if (authService.isAuthenticated()) {
      console.log('[Login useEffect] Already logged in, redirecting to home');
      Taro.switchTab({ url: '/pages/home/index' });
    }
  }, []);

  const canLogin = username.trim().length > 0 && password.length >= 4 && !loading;

  const handleLogin = async () => {
    if (!canLogin) return;
    
    setLoading(true);
    Taro.showLoading({ title: '登录中...' });
    
    try {
      await authService.login(username.trim(), password);
      Taro.hideLoading();
      Taro.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/home/index' });
      }, 1000);
    } catch (err: any) {
      console.error('[Login] Login failed:', err.message);
      Taro.hideLoading();
      Taro.showToast({ title: err.message || '登录失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoRegister = () => {
    Taro.navigateTo({ url: '/pages/register/index' });
  };

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.logoSection}>
        <View className={styles.logo}>
          <Text className={styles.logoIcon}>🏗️</Text>
        </View>
        <Text className={styles.appName}>施工日志</Text>
        <Text className={styles.appDesc}>记录每一天的建设足迹</Text>
      </View>
      
      <View className={styles.formCard}>
        <Text className={styles.formTitle}>欢迎登录</Text>
        
        <View className={styles.formItem}>
          <View className={classNames(styles.inputWrapper, { [styles.focused]: usernameFocused })}>
            <Text className={styles.inputIcon}>👤</Text>
            <Input
              className={styles.input}
              type="text"
              placeholder="请输入用户名"
              placeholderStyle={{ color: '#86909C' }}
              value={username}
              onInput={(e) => setUsername(e.detail.value)}
              onFocus={() => setUsernameFocused(true)}
              onBlur={() => setUsernameFocused(false)}
              maxlength={32}
            />
          </View>
        </View>
        
        <View className={styles.formItem}>
          <View className={classNames(styles.inputWrapper, { [styles.focused]: passwordFocused })}>
            <Text className={styles.inputIcon}>🔒</Text>
            <Input
              className={styles.input}
              type="password"
              placeholder="请输入密码"
              placeholderStyle={{ color: '#86909C' }}
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              maxlength={64}
            />
          </View>
        </View>
        
        <Button
          className={classNames(styles.loginBtn, { [styles.loginBtnDisabled]: !canLogin })}
          onClick={handleLogin}
        >
          {loading ? '登录中...' : '登录'}
        </Button>
        
        <View className={styles.registerLink}>
          <Text className={styles.registerText}>
            还没有账号？
            <Text className={styles.registerHighlight} onClick={handleGoRegister}>
              立即注册
            </Text>
          </Text>
        </View>
      </View>
      
      <View className={styles.demoTip}>
        <Text className={styles.demoTitle}>💡 快速体验</Text>
        <Text className={styles.demoText}>
          用户名：demo{'\n'}
          密  码：123456{'\n\n'}
          首次登录会自动创建演示数据，可直接体验完整功能。
        </Text>
      </View>
    </ScrollView>
  );
};

export default LoginPage;
