# 股票研究看板

> 个人 A 股/港股投资研究工具 — 行业分析 · 实时行情 · K 线图 · 宏观数据 · 个股池管理

---

## 🚀 快速启动

### Windows
双击 `start.bat`，浏览器访问 http://localhost:3000

### macOS / Linux
```bash
bash start.sh
```

### 桌面应用（Electron）
```bash
# 开发模式
npm run electron:dev

# 打包安装包
npm run electron:build:win    # Windows (.exe)
npm run electron:build:mac    # macOS (.dmg)
npm run electron:build:linux  # Linux (.AppImage / .deb)
```

---

## 📊 功能

| 页面 | 功能 |
|------|------|
| 🌐 宏观 | 7 大 A 股指数、市场情绪、CPI/PPI/PMI/M2/GDP、LPR、美联储利率、全球市场 |
| 🏭 行业 | AI 算力 / 机器人 / 创新药 / 油运 — 产业链分析、龙头追踪 |
| 📈 个股池 | 行业筛选、添加/删除个股、K 线弹窗、SQLite 持久化 |
| 👁 观察清单 | 表格展示、备注编辑、预警价、K 线弹窗 |

## ⚙️ 全局功能

- K 线弹窗：蜡烛图 + MA5/MA10/MA20 + MACD + 成交量
- 右侧面板：重点资产实时行情
- 设置：深色/浅色主题、刷新间隔、默认市场
- 定时任务：每个工作日 15:00 自动抓取收盘数据
- 进程守护：PM2 自动重启

---

## 📦 项目结构

```
stock-dashboard/
├── server/            # 后端 Express API
│   ├── routes/        # API 路由（macro/kline/realtime/stock-pool）
│   ├── providers/     # 数据源（新浪/腾讯财经/东方财富）
│   └── utils/         # 工具（GBK编码/代码转换/交易日历）
├── client/            # 前端 React
│   └── src/
│       ├── pages/     # 四大页面
│       ├── components/# 通用组件
│       └── data/      # 静态数据
├── electron/          # Electron 桌面应用
├── data/              # SQLite 数据库
├── scripts/           # 脚本
├── CHANGELOG.md       # 更新日志
└── start.bat / start.sh  # 启动脚本
```

---

## 📡 数据源

| 数据 | 来源 |
|------|------|
| A 股实时行情 | 新浪财经 `hq.sinajs.cn` |
| 港股实时行情 | 新浪财经 `hq.sinajs.cn` |
| A 股日 K | 新浪财经 K 线接口 |
| 港股日 K | 腾讯财经 `web.ifzq.gtimg.cn` |
| 宏观低频数据 | 静态数据（标注来源和更新时间） |

---

## 🔄 更新日志

详见 [CHANGELOG.md](./CHANGELOG.md)
