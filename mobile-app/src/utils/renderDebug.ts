import { useRef, useEffect } from 'react';

const renderCounts: Record<string, number> = {};
const renderTimestamps: Record<string, number[]> = {};

export function useRenderDebug(componentName: string) {
  const count = useRef(0);
  count.current++;
  
  const now = Date.now();
  
  if (!renderTimestamps[componentName]) {
    renderTimestamps[componentName] = [];
  }
  renderTimestamps[componentName].push(now);
  
  if (renderTimestamps[componentName].length > 20) {
    renderTimestamps[componentName].shift();
  }
  
  const timestamps = renderTimestamps[componentName];
  if (timestamps.length >= 10) {
    const duration = timestamps[timestamps.length - 1] - timestamps[0];
    const frequency = timestamps.length / (duration / 1000);
    
    if (frequency > 30) {
      console.error(`[LOOP DETECTED] ${componentName} is rendering too fast!`);
      console.error(`[LOOP DETECTED] Render frequency: ${frequency.toFixed(1)}/s`);
      console.error(`[LOOP DETECTED] Total renders: ${count.current}`);
    }
  }
  
  if (count.current > 0 && count.current % 10 === 0) {
    console.warn(`[Render Warning] ${componentName} has rendered ${count.current} times`);
  }
  
  if (count.current === 1) {
    console.log(`[Render] ${componentName} mounted`);
  }
  
  useEffect(() => {
    return () => {
      console.log(`[Render] ${componentName} unmounted, total renders: ${count.current}`);
    };
  }, []);
  
  return count.current;
}

export function logEffect(componentName: string, effectName: string, deps?: any[]) {
  const depsStr = deps ? JSON.stringify(deps) : '';
  console.log(`[Effect] ${componentName} - ${effectName} triggered ${depsStr}`);
}

export function resetRenderCounts() {
  Object.keys(renderCounts).forEach(key => {
    renderCounts[key] = 0;
  });
  Object.keys(renderTimestamps).forEach(key => {
    renderTimestamps[key] = [];
  });
  console.log('[Render Debug] All render counts reset');
}
