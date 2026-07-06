import React, { useState } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classNames from 'classnames';
import { authService } from '@/services/auth';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePassword = (pwd: string): string | null => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push('至少8个字符');
    if (!/[a-z]/.test(pwd)) errors.push('包含小写字母');
    if (!/[A-Z]/.test(pwd)) errors.push('包含大写字母');
    if (!/[0-9]/.test(pwd)) errors.push('包含数字');
    return errors.length === 0 ? null : errors.join('、');
  };

  const passwordError = validatePassword(password);
  const canRegister = username.trim().length >= 3 && !passwordError && password === confirmPassword && !loading;

  const handleRegister = async () => {
    if (!canRegister) {
      if (password !== confirmPassword) {
        Taro.showToast({ title: '两次密码不一致', icon: 'none' });
      } else if (username.trim().length < 3) {
        Taro.showToast({ title: '用户名至少3位', icon: 'none' });
      } else if (passwordError) {
        Taro.showToast({ title: `密码要求：${passwordError}`, icon: 'none' });
      }
      return;
    }
    
    setLoading(true);
    Taro.showLoading({ title: '注册中...' });
    
    try {
      await authService.register(username.trim(), password);
      Taro.hideLoading();
      Taro.showToast({ title: '注册成功，请登录', icon: 'success' });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (err: any) {
      console.error('[Register] Register failed:', err.message);
      Taro.hideLoading();
      Taro.showToast({ title: err.message || '注册失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className={styles.container}>
      <View className={styles.formItem}>
        <Text className={styles.label}>用户名</Text>
        <View className={classNames(styles.inputWrapper, { [styles.focused]: usernameFocused })}>
          <Text className={styles.inputIcon}>👤</Text>
          <Input
            className={styles.input}
            type="text"
            placeholder="请输入用户名（至少3位）"
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
        <Text className={styles.label}>密码</Text>
        <View className={classNames(styles.inputWrapper, { [styles.focused]: passwordFocused })}>
          <Text className={styles.inputIcon}>🔒</Text>
          <Input
            className={styles.input}
            type="password"
            placeholder="请输入密码（8位以上，含大小写字母和数字）"
            placeholderStyle={{ color: '#86909C' }}
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            maxlength={64}
          />
        </View>
      </View>
      
      <View className={styles.formItem}>
        <Text className={styles.label}>确认密码</Text>
        <View className={classNames(styles.inputWrapper, { [styles.focused]: confirmFocused })}>
          <Text className={styles.inputIcon}>🔒</Text>
          <Input
            className={styles.input}
            type="password"
            placeholder="请再次输入密码"
            placeholderStyle={{ color: '#86909C' }}
            value={confirmPassword}
            onInput={(e) => setConfirmPassword(e.detail.value)}
            onFocus={() => setConfirmFocused(true)}
            onBlur={() => setConfirmFocused(false)}
            maxlength={64}
          />
        </View>
      </View>
      
      <Button
        className={classNames(styles.submitBtn, { [styles.submitBtnDisabled]: !canRegister })}
        onClick={handleRegister}
      >
        {loading ? '注册中...' : '注册'}
      </Button>
      
      <View className={styles.agreement}>
        <Text className={styles.agreementText}>
          注册即表示您同意《用户协议》和《隐私政策》
        </Text>
      </View>
    </View>
  );
};

export default RegisterPage;
