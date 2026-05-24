# 施工日志 - Kotlin 安卓端

基于 Kotlin 语言开发的原生安卓应用，用于施工日志管理。

## 项目结构

```
android-app/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/com/shigongrizhi/app/
│   │       │   ├── MyApplication.kt
│   │       │   ├── data/
│   │       │   │   ├── model/
│   │       │   │   │   ├── User.kt
│   │       │   │   │   ├── Project.kt
│   │       │   │   │   └── LogEntry.kt
│   │       │   │   ├── network/
│   │       │   │   │   ├── RetrofitClient.kt
│   │       │   │   │   └── ApiService.kt
│   │       │   │   └── local/
│   │       │   │       └── AppPreferences.kt
│   │       │   └── ui/
│   │       │       ├── login/
│   │       │       │   └── LoginActivity.kt
│   │       │       ├── main/
│   │       │       │   ├── MainActivity.kt
│   │       │       │   └── LogAdapter.kt
│   │       │       ├── log/
│   │       │       │   ├── AddLogActivity.kt
│   │       │       │   └── LogDetailActivity.kt
│   │       │       └── settings/
│   │       │           └── SettingsActivity.kt
│   │       └── res/
│   │           ├── values/
│   │           │   ├── colors.xml
│   │           │   ├── strings.xml
│   │           │   └── themes.xml
│   │           └── ...
│   ├── build.gradle.kts
│   └── proguard-rules.pro
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
└── README.md
```

## 技术栈

- **语言**: Kotlin
- **UI**: XML + ViewBinding
- **网络**: Retrofit2 + OkHttp3
- **JSON**: Gson
- **异步**: Coroutines
- **架构**: MVVM 轻量级实现

## 功能特性

### 已实现
- ✅ 用户登录/注册
- ✅ 项目列表与切换
- ✅ 日志列表（支持筛选：全部/本周/今日）
- ✅ 新建日志（天气、温度、施工内容、人员、材料、机械）
- ✅ 日志详情查看
- ✅ 修改密码
- ✅ 管理员功能入口

### 待完成
- ⏳ XML 布局文件（需要补充完整）
- ⏳ 用户管理完整功能
- ⏳ 项目管理完整功能
- ⏳ 数据统计图表
- ⏳ 文件上传/图片查看

## 开发环境

- Android Studio Hedgehog (2023.1.1) 或更高版本
- JDK 17
- Android SDK 34
- Gradle 8.x

## 配置说明

### 修改 API 地址

编辑 `MyApplication.kt` 中的 `API_BASE_URL`:

```kotlin
const val API_BASE_URL = "http://你的服务器地址:8519/api/"
```

### 注意事项

1. **后端服务**: 需要配合后端服务使用，后端地址：`http://localhost:8519`
2. **网络权限**: 已在 AndroidManifest.xml 中添加 `INTERNET` 权限
3. **明文 HTTP**: 如果使用 HTTP 而非 HTTPS，需要在 AndroidManifest.xml 中配置 `android:usesCleartextTraffic="true"`

## 补充资源文件

由于 ViewBinding 需要完整的 XML 布局文件，请在 Android Studio 中创建以下布局文件：

### 必须的布局文件

1. `res/layout/activity_login.xml` - 登录/注册页面
2. `res/layout/activity_main.xml` - 主页面
3. `res/layout/activity_add_log.xml` - 新建日志页面
4. `res/layout/activity_log_detail.xml` - 日志详情页面
5. `res/layout/activity_settings.xml` - 设置页面
6. `res/layout/item_log.xml` - 日志列表项
7. `res/layout/item_spinner_project.xml` - 项目选择下拉项
8. `res/layout/dialog_add_item.xml` - 添加人员/材料/机械对话框
9. `res/layout/dialog_change_password.xml` - 修改密码对话框

### 必须的资源文件

1. `res/drawable/bg_stat.xml` - 统计卡片普通背景
2. `res/drawable/bg_stat_active.xml` - 统计卡片选中背景
3. `res/menu/menu_main.xml` - 主页面菜单
4. `res/xml/backup_rules.xml` - 备份规则
5. `res/xml/data_extraction_rules.xml` - 数据提取规则

## 导入步骤

1. 打开 Android Studio
2. 选择 "Open" 或 "Open an existing project"
3. 选择 `android-app` 目录
4. 等待 Gradle 同步完成
5. 补充缺失的 XML 布局文件
6. 修改 API 地址
7. 连接后端服务并运行

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| demo | 123456 | 普通用户 |
| admin | admin123 | 管理员 |

## 版本信息

- 版本号: 1.1.0
- 最小 SDK: 24 (Android 7.0)
- 目标 SDK: 34 (Android 14)
