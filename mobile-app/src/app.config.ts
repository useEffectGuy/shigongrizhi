export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/log-create/index',
    'pages/mine/index',
    'pages/login/index',
    'pages/register/index',
    'pages/log-detail/index',
    'pages/projects/index',
    'pages/stats/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#165DFF',
    navigationBarTitleText: '施工日志',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#165DFF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '日志'
      },
      {
        pagePath: 'pages/log-create/index',
        text: '新增'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
