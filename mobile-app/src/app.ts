import { useDidShow, useDidHide } from '@tarojs/taro';
import './app.scss';

function App(props) {
  useDidShow(() => {
    console.log('[App lifecycle] onShow - App came to foreground');
  });

  useDidHide(() => {
    console.log('[App lifecycle] onHide - App went to background');
  });

  return props.children;
}

export default App;
