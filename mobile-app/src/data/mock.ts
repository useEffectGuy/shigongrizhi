import { Project, LogEntry, Device } from '@/types';

export const mockProjects: Project[] = [
  {
    id: 1,
    name: 'XX大厦主体工程',
    creator_id: 1,
    created_at: '2026-01-15T08:00:00.000Z',
    role: 'admin',
    log_count: 156
  },
  {
    id: 2,
    name: 'YY小区一期项目',
    creator_id: 1,
    created_at: '2026-02-20T10:30:00.000Z',
    role: 'member',
    log_count: 89
  },
  {
    id: 3,
    name: 'ZZ产业园基础设施',
    creator_id: 2,
    created_at: '2026-03-10T09:00:00.000Z',
    role: 'member',
    log_count: 234
  }
];

const today = new Date();
const formatDate = (d: Date) => {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}T08:00:00.000Z`;
};

const minusDays = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - days);
  return formatDate(d);
};

export const mockLogs: LogEntry[] = [
  {
    id: 1,
    project_id: 1,
    author_id: 1,
    author_name: '张工',
    content: '今日完成主体结构3层浇筑，共浇筑混凝土200方。施工人员15人，机械设备运行正常。',
    weather: '晴',
    temperature: 28.5,
    image_keys: [],
    workers: [
      { name: '钢筋工', count: 8 },
      { name: '木工', count: 6 },
      { name: '混凝土工', count: 12 }
    ],
    materials: [
      { name: '混凝土', count: 200, unit: '方' },
      { name: '钢筋', count: 5, unit: '吨' }
    ],
    equipment: [
      { name: '塔吊', count: 1, unit: '台' },
      { name: '混凝土泵车', count: 1, unit: '台' }
    ],
    created_at: minusDays(0),
    updated_at: minusDays(0)
  },
  {
    id: 2,
    project_id: 1,
    author_id: 2,
    author_name: '李工',
    content: '上午进行钢筋绑扎验收，下午开始模板安装。发现3处安全隐患已整改。',
    weather: '多云',
    temperature: 25.0,
    image_keys: [],
    workers: [
      { name: '钢筋工', count: 10 },
      { name: '木工', count: 8 }
    ],
    materials: [
      { name: '模板', count: 500, unit: '张' }
    ],
    equipment: [
      { name: '塔吊', count: 1, unit: '台' }
    ],
    created_at: minusDays(1),
    updated_at: minusDays(1)
  },
  {
    id: 3,
    project_id: 1,
    author_id: 1,
    author_name: '张工',
    content: '脚手架搭设完成100%，通过安全验收。明日开始外墙砌筑。',
    weather: '阴',
    temperature: 22.3,
    image_keys: [],
    workers: [
      { name: '架子工', count: 6 }
    ],
    materials: [
      { name: '钢管', count: 2000, unit: '米' },
      { name: '扣件', count: 5000, unit: '个' }
    ],
    equipment: [],
    created_at: minusDays(2),
    updated_at: minusDays(2)
  },
  {
    id: 4,
    project_id: 1,
    author_id: 3,
    author_name: '王工',
    content: '水电预埋完成，进行闭水试验。试验结果合格，无渗漏。',
    weather: '小雨',
    temperature: 20.0,
    image_keys: [],
    workers: [
      { name: '水电工', count: 5 }
    ],
    materials: [
      { name: 'PVC管', count: 500, unit: '米' },
      { name: '电线', count: 2000, unit: '米' }
    ],
    equipment: [],
    created_at: minusDays(3),
    updated_at: minusDays(3)
  },
  {
    id: 5,
    project_id: 1,
    author_id: 1,
    author_name: '张工',
    content: '地下室防水施工完成，已报验。等待监理验收后可进行下一道工序。',
    weather: '晴',
    temperature: 30.2,
    image_keys: [],
    workers: [
      { name: '防水工', count: 4 }
    ],
    materials: [
      { name: '防水卷材', count: 1000, unit: '平米' }
    ],
    equipment: [],
    created_at: minusDays(5),
    updated_at: minusDays(5)
  },
  {
    id: 6,
    project_id: 1,
    author_id: 1,
    author_name: '张工',
    content: '施工现场进行安全大检查，排查安全隐患并落实整改措施。',
    weather: '晴',
    temperature: 26.0,
    image_keys: [],
    workers: [
      { name: '安全员', count: 3 },
      { name: '测量员', count: 2 }
    ],
    materials: [],
    equipment: [],
    created_at: minusDays(8),
    updated_at: minusDays(8)
  },
  {
    id: 7,
    project_id: 2,
    author_id: 1,
    author_name: '张工',
    content: '地基与基础分部工程验收，质监站、监理、设计、施工四方到场。',
    weather: '多云',
    temperature: 24.0,
    image_keys: [],
    workers: [
      { name: '测量员', count: 2 },
      { name: '混凝土工', count: 4 }
    ],
    materials: [
      { name: '混凝土', count: 100, unit: '方' }
    ],
    equipment: [],
    created_at: minusDays(12),
    updated_at: minusDays(12)
  }
];

export const mockDevices: Device[] = [
  {
    device_id: 'abc123-def456',
    device_name: '小米手机',
    last_active: '2026-05-18T09:00:00.000Z'
  },
  {
    device_id: 'ghi789-jkl012',
    device_name: '办公室电脑',
    last_active: '2026-05-17T18:30:00.000Z'
  },
  {
    device_id: 'mno345-pqr678',
    device_name: 'iPad Pro',
    last_active: '2026-05-16T14:20:00.000Z'
  }
];

export const weatherOptions = ['晴', '多云', '阴', '小雨', '中雨', '大雨', '雷阵雨', '小雪', '中雪', '大雪', '雾', '霾'];

export const workerOptions = ['钢筋工', '木工', '混凝土工', '架子工', '水电工', '防水工', '瓦工', '油漆工', '测量员', '安全员', '电工', '焊工'];

export const unitOptions = ['个', '吨', '方', '米', '平米', '张', '卷', '套', '台', '辆', '个工时'];
