import React, { useEffect, useRef } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
// 全局样式
import './app.scss';

function App(props) {
  const renderCount = useRef(0);
  renderCount.current++;
  
  console.log(`[Render Count] App render #${renderCount.current}`);
  console.log(`[App] Time: ${new Date().toLocaleTimeString()}`);

  useEffect(() => {
    console.log('[App useEffect] Mount - App initialized');
    console.log('[App] - Checking for render loops...');
    
    const warnLoop = setInterval(() => {
      if (renderCount.current > 50) {
        console.warn('[App WARNING] High render count detected:', renderCount.current);
        console.warn('[App] - Possible infinite render loop!');
      }
    }, 5000);
    
    return () => clearInterval(warnLoop);
  }, []);

  useDidShow(() => {
    console.log('[App lifecycle] onShow - App came to foreground');
  });

  useDidHide(() => {
    console.log('[App lifecycle] onHide - App went to background');
  });

  return props.children;
}

export default App;
