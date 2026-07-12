# 天机阁 — 完整迁移文档

## 1. 项目概述

**天机阁**是一个多合一 AI 算命平台，支持八字命盘、紫微斗数、奇门遁甲、六爻占卜、星座星盘、塔罗占卜、每日运势七大功能。

**核心价值**：一站式中式命理 + 西方占星平台，核心算命逻辑使用开源算法库（lunar-javascript、iztro），AI 仅用于对话引导、结果解读和多流派聚合报告。

**面向用户**：对中国传统命理和西方占星感兴趣的普通用户，主要通过手机端访问。

---

## 2. 技术架构

### 2.1 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| 样式 | Tailwind CSS 4 + shadcn/ui 风格 |
| 算命引擎 | lunar-javascript（八字/农历/干支/紫微命宫/九星/六爻）、iztro（紫微斗数完整排盘） |
| AI 调用 | coze-coding-dev-sdk（DeepSeek V3.2 流式/非流式） |
| 图标 | Lucide Icons |
| 部署 | Coze 沙箱环境，端口 5000 |

### 2.2 三层架构

```
┌─────────────────────────────────────────────────────────┐
│ 展示层 (src/app/ + src/components/)                      │
│  - 对话 UI (fortune-chat.tsx)                            │
│  - 原始数据展示 (各 engine 的 Result 类型)                 │
│  - 报告展示 (fortune-report.tsx)                         │
│  - 紫微命盘可视化 (ziwei-chart-board.tsx)                 │
├─────────────────────────────────────────────────────────┤
│ AI 层 (src/app/api/)                                     │
│  - /api/chat — AI 对话流式（信息采集 + 结果解读）          │
│  - /api/report — AI 报告生成（4份并行：概况/今日/本月/今年）│
├─────────────────────────────────────────────────────────┤
│ 算法引擎层 (src/lib/)                                    │
│  - bazi-engine.ts — 八字排盘 + 运势计算                  │
│  - ziwei-engine.ts — 紫微斗数排盘（iztro）                │
│  - qimen-engine.ts — 奇门遁甲起局                        │
│  - liuyao-engine.ts — 六爻排盘                           │
│  - astrology-engine.ts — 星座星盘计算                    │
│  - tarot-engine.ts — 塔罗抽牌（78张完整数据）              │
│  - llm-client.ts — AI 调用封装                           │
│  - city-coords.ts — 38城市经纬度数据（用于真太阳时校正）    │
└─────────────────────────────────────────────────────────┘
```

### 2.3 数据流向

```
用户输入（出生日期/时间/性别/城市）
    ↓
AI 对话引导（/api/chat 流式）
    ↓ 信息采集完成回调
算法引擎计算（纯计算，无 AI 依赖）
    ↓
展示原始数据 + 生成可复制文本摘要（CopyableSummary）
    ↓
AI 报告生成（/api/report，4份并行）
    ↓
展示四份报告 + 报告后 AI 追问对话
    ↓
赞赏码展示
```

### 2.4 目录结构

```
├── .coze                    # 项目构建/运行配置（TOML格式，禁止修改）
├── .env.local               # 开发环境变量
├── AGENTS.md                # 项目规范文件（Agent 快速理解项目）
├── DESIGN.md                # 设计规范（温暖纸感风）
├── MIGRATION.md             # 本文档
├── next.config.ts           # Next.js 配置
├── package.json             # 依赖管理
├── public/
│   └── reward-qrcode.png    # 赞赏码图片
├── src/
│   ├── app/
│   │   ├── layout.tsx       # 根布局
│   │   ├── page.tsx         # 首页（Hero + 七大功能入口 + 综合测算CTA）
│   │   ├── globals.css      # 全局样式 + Design Token
│   │   ├── bazi/page.tsx    # 八字命盘页
│   │   ├── ziwei/page.tsx   # 紫微斗数页
│   │   ├── qimen/page.tsx   # 奇门遁甲页
│   │   ├── liuyao/page.tsx  # 六爻占卜页
│   │   ├── astrology/page.tsx # 星座星盘页
│   │   ├── tarot/page.tsx   # 塔罗占卜页
│   │   ├── horoscope/page.tsx # 每日运势页
│   │   ├── unified/page.tsx # 综合测算页
│   │   └── api/
│   │       ├── chat/route.ts  # AI 对话流式 API
│   │       └── report/route.ts # AI 报告生成 API
│   ├── components/
│   │   ├── navbar.tsx        # 全局导航栏（含汉堡菜单）
│   │   ├── fortune-chat.tsx  # 通用对话引擎
│   │   ├── fortune-report.tsx # 四版报告 + 追问 + 赞赏码
│   │   ├── use-report.ts     # 报告生成 Hook
│   │   ├── input-form.tsx    # 通用表单组件
│   │   ├── copyable-summary.tsx # 可复制信息摘要
│   │   ├── ziwei-chart-board.tsx # 紫微4×4方形命盘
│   │   └── ziwei-time-nav.tsx   # 紫微6级时间导航
│   ├── lib/
│   │   ├── bazi-engine.ts     # 八字排盘 + 运势计算
│   │   ├── ziwei-engine.ts    # 紫微斗数排盘（iztro）
│   │   ├── qimen-engine.ts    # 奇门遁甲起局
│   │   ├── liuyao-engine.ts   # 六爻排盘
│   │   ├── astrology-engine.ts # 星座星盘计算
│   │   ├── tarot-engine.ts    # 塔罗抽牌
│   │   ├── llm-client.ts      # AI 调用封装
│   │   └── city-coords.ts     # 38城市经纬度
│   └── types/
│       └── lunar-javascript.d.ts # lunar-javascript 类型声明
└── .learnings/
    ├── LEARNINGS.md   # 项目经验记录
    └── ERRORS.md      # 错误记录
```

### 2.5 关键配置文件

| 文件 | 用途 |
|------|------|
| `.coze` | 项目构建/运行配置（TOML 格式），定义 build 和 run 命令 |
| `AGENTS.md` | 项目规范文件（Agent 快速理解项目结构和开发规范） |
| `DESIGN.md` | 设计规范（温暖纸感风：色彩/字体/组件/动效/禁忌） |
| `.env.local` | 开发环境变量（API Key 等） |
| `next.config.ts` | Next.js 配置（外部图片域名等） |
| `package.json` | 依赖管理 |
| `tsconfig.json` | TypeScript 编译配置 |

### 2.6 环境变量

| 变量名 | 用途 | 说明 |
|--------|------|------|
| `COZE_API_KEY` | AI 服务密钥 | DeepSeek API Key，用于 coze-coding-dev-sdk 调用 |
| `COZE_API_BASE` | AI 服务地址 | API 基础 URL |
| `COZE_PROJECT_DOMAIN_DEFAULT` | 对外访问域名 | 用于构造绝对 URL（如回调、分享链接） |
| `DEPLOY_RUN_PORT` | 服务监听端口 | 主仓固定 5000，worktree 动态分配 |
| `COZE_WORKSPACE_PATH` | 工作目录 | 默认 /workspace/projects |

---

## 3. 功能模块

### 3.1 七大算命流派

| 模块 | 文件 | 输入 | 输出 | 核心依赖 |
|------|------|------|------|----------|
| 八字命盘 | `bazi/page.tsx` | 年月日时、性别 | BaziResult（四柱、五行缺、生肖、纳音、十神、大运流年） | lunar-javascript |
| 紫微斗数 | `ziwei/page.tsx` | 年月日时、性别、出生城市（经度） | ZiweiResult（12宫、主星、四化、大限、流年/月/日/时） | iztro |
| 奇门遁甲 | `qimen/page.tsx` | 年月日时 | QiMenResult（九星、八门、九宫、宜忌） | lunar-javascript |
| 六爻占卜 | `liuyao/page.tsx` | 问题、起卦方式 | LiuYaoResult（本卦、变卦、六亲、世应、动爻、六神） | 自定义算法（基于 xiongdun8/liuyao） |
| 星座星盘 | `astrology/page.tsx` | 年月日时、出生城市 | AstrologyResult（太阳/月亮/上升、行星、相位、元素分布） | 自定义算法 |
| 塔罗占卜 | `tarot/page.tsx` | 问题、牌阵 | TarotReading（78张完整牌库、正逆位、牌位） | 自定义算法 |
| 每日运势 | `horoscope/page.tsx` | 星座（可从出生日期推算） | HoroscopeResult（今日干支、宜忌、方位、五行） | lunar-javascript |

### 3.2 综合测算

| 模块 | 文件 | 说明 |
|------|------|------|
| 综合测算 | `unified/page.tsx` | 默认全选7种算法，AI对话采集信息，各流派并列测算，生成四版聚合报告 |

### 3.3 核心组件

| 组件 | 文件 | 功能 |
|------|------|------|
| Navbar | `navbar.tsx` | 全局导航栏，移动端汉堡菜单 |
| FortuneChat | `fortune-chat.tsx` | 通用对话引擎，支持信息采集完成回调（onInfoComplete） |
| FortuneReport | `fortune-report.tsx` | 四份报告展示（概况/今日/本月/今年）+ 报告后AI追问 + 赞赏码 |
| useReport | `use-report.ts` | 报告生成 Hook，调用 /api/report 生成4份报告 |
| InputForm | `input-form.tsx` | 通用表单组件，支持多种字段类型 |
| ZiweiChartBoard | `ziwei-chart-board.tsx` | 紫微斗数 4×4 方形命盘可视化，点击宫位查看详情 |
| ZiweiTimeNav | `ziwei-time-nav.tsx` | 紫微斗数 6级时间导航（本命/大限/流年/流月/流日/流时） |
| CopyableSummary | `copyable-summary.tsx` | 可复制信息摘要组件 |

### 3.4 API 接口

| 接口 | 方法 | 功能 | 说明 |
|------|------|------|------|
| `/api/chat` | POST | AI 对话流式 | 支持信息采集、结果解读、追问对话，SSE 协议流式输出 |
| `/api/report` | POST | AI 报告生成 | 生成4份报告（概况/今日/本月/今年），顺序生成 |

### 3.5 交互流程

#### 单一流派（首页卡片入口）
1. 点击首页卡片 → 进入对应流派页面
2. AI 对话引导采集信息（出生日期/时间/性别等）
3. 信息采集完成 → 生成可复制文本摘要
4. 算法引擎计算 → 展示原始数据
5. 生成一份四版解读报告（概况/今日运势/本月运势/今年运势）
6. 报告后可 AI 追问对话（根据算法结果个性化解答）

#### 综合测算（首页 CTA 入口）
1. AI 对话采集所有流派所需信息（默认全选7种）
2. 信息采集完成 → 生成可复制文本摘要
3. 各流派并列测算 → 并列展示所有算法结果
4. 生成四版聚合报告
5. 报告后可 AI 追问对话（综合所有算法结果解答）

---

## 4. 数据管道

### 4.1 数据输入

用户通过 AI 对话引导提供：
- 出生日期（年/月/日）
- 出生时间（时辰选择器，12时辰）
- 性别（男/女）
- 出生城市（用于真太阳时校正，仅紫微斗数需要经度）
- 问题（六爻、塔罗）
- 星座（每日运势，可从出生日期自动推算，无需用户手动输入）

### 4.2 数据处理流程

```
1. 用户输入 → AI 对话引导（/api/chat）
   - systemPrompt：引导用户提供必要信息
   - 流式输出对话内容
2. 信息采集完成 → onInfoComplete 回调
   - 返回结构化数据：{ date: { year, month, day, shichenIndex }, gender, city }
3. 算法引擎计算（纯计算，无 AI 依赖）
   - 各引擎接收标准化输入，返回结构化 Result
4. 生成可复制文本摘要（CopyableSummary）
   - 将算法结果格式化为可复制的文本
5. AI 报告生成（/api/report）
   - 构建 systemPrompt（流派特定 + 通用规则）
   - 构建 userPrompt（算法结果 + 报告类型）
   - 顺序调用 AI 生成 4 份报告
6. 展示报告 + 报告后追问对话
   - FortuneReport 组件展示4个Tab
   - 内置 FollowUpChat 支持追问
   - 底部展示赞赏码
```

### 4.3 数据模型

#### BaziResult

```typescript
interface BaziResult {
  yearPillar:  { gan: string; zhi: string };
  monthPillar: { gan: string; zhi: string };
  dayPillar:   { gan: string; zhi: string };
  hourPillar:  { gan: string; zhi: string };
  wuxingQue: string[];           // 五行缺
  shengxiao: string;             // 生肖
  bazi: string;                  // 八字字符串
  nayin: Record<string, string>; // 纳音（四柱各柱的纳音）
  shishen: string[];             // 十神
  dayun: { ganZhi: string; age: number; year: number }[];   // 大运列表
  liunian: { ganZhi: string; year: number; age: number }[]; // 流年列表
}
```

#### ZiweiResult

```typescript
interface ZiweiResult {
  mingGongGan: string;         // 命宫天干
  mingGongZhi: string;         // 命宫地支
  shenGongGan: string;         // 身宫天干
  shenGongZhi: string;         // 身宫地支
  mingGongNaYin: string;       // 命宫纳音
  shenGongNaYin: string;       // 身宫纳音
  palaces: ZiweiPalaceResult[]; // 12宫（索引0-11对应地支寅卯辰巳午未申酉戌亥子丑）
  sihua: Record<string, string>; // 四化（禄/权/科/忌 → 星名）
  wuxingJu: string;            // 五行局
  gender: string;              // 性别
  soul: string;                // 命主
  body: string;                // 身主
  isMingShenSame: boolean;     // 命身同宫
  lunarDate: string;           // 农历日期
  chineseDate: string;         // 四柱中文格式
  solarDate: string;           // 公历日期（用于运限计算）
}

interface ZiweiPalaceResult {
  name: string;                // 宫名（命宫/兄弟/夫妻/子女/财帛/疾厄/迁移/仆役/官禄/田宅/福德/父母）
  heavenlyStem: string;        // 天干
  earthlyBranch: string;       // 地支
  majorStars: ZiweiStar[];     // 主星（紫微/天机/太阳/武曲/天同/廉贞/天府/太阴/贪狼/巨门/天相/天梁/七杀/破军）
  minorStars: ZiweiStar[];     // 杂曜（左辅/右弼/文昌/文曲/天魁/天钺/禄存/擎羊/陀罗/火星/铃星/地空/地劫）
  adjectiveStars: ZiweiStar[]; // 形容词星（天喜/恩光/天空/孤辰/天使）
  changsheng12: string;        // 长生十二神（长生/沐浴/冠带/临官/帝旺/衰/病/死/墓/绝/胎/养）
  boshi12: string;             // 博士十二神
  jiangqian12: string;         // 将前十二神（劫煞等）
  suiqian12: string;           // 岁前十二神（晦气等）
  decadalRange: string;        // 大限年龄范围（如 "25-34"）
  ages: number[];              // 流年命宫对应年龄列表
  isBodyPalace: boolean;       // 是否身宫
  isOriginalPalace: boolean;   // 是否本命宫
  daXianAge: [number, number] | undefined; // 大限年龄区间
}

interface ZiweiStar {
  name: string;                // 星名
  brightness?: string;         // 庙旺（庙/旺/得/利/平/不/陷）
  siHua?: string;              // 四化标记（禄/权/科/忌）
  type?: string;               // 类型（major/lucky/evil/adj）
}
```

#### QiMenResult

```typescript
interface QiMenResult {
  dunType: string;             // 遁类型
  juNumber: number;            // 局数（阳遁/阴遁 + 数字）
  jiuXingName: string;         // 九星名
  baMenName: string;           // 八门名
  gongDetails: Record<string, unknown>[]; // 九宫详情
  yi: string[];                // 宜
  ji: string[];                // 忌
}
```

#### LiuYaoResult

```typescript
interface LiuYaoResult {
  benGua: { name: string; number: number; symbol: string }; // 本卦
  bianGua: { name: string; number: number; symbol: string }; // 变卦
  benGong: string;             // 本宫
  yaoDetails: YaoDetail[];     // 六爻详情
  dongYao: number[];           // 动爻位置
  liuShen: string[];           // 六神（青龙/朱雀/勾陈/螣蛇/白虎/玄武）
  xunKong: string[];           // 旬空
  guaCi: string;               // 卦辞
  yaoCi: string[];             // 爻辞
  wangshuai: string;           // 旺衰分析
  huitouShengKe: string;       // 回头生克
}

interface YaoDetail {
  position: number;            // 爻位
  yao: string;                 // 阴阳
  liuqin: string;              // 六亲
  shiying: string;             // 世应
  liuShen: string;             // 六神
  xunKong: boolean;            // 是否旬空
  dongYao: boolean;            // 是否动爻
}
```

#### AstrologyResult

```typescript
interface AstrologyResult {
  sun: string;                 // 太阳星座
  moon: string;                // 月亮星座
  ascendant: string;           // 上升星座
  planets: Planet[];           // 行星位置（水星/金星/火星/木星/土星/天王/海王/冥王）
  aspects: Aspect[];           // 相位
  elements: Record<string, number>; // 元素分布（火/土/风/水）
}

interface Planet {
  name: string;                // 行星名
  sign: string;                // 星座
  degree: number;              // 度数
  house: number;               // 宫位
}

interface Aspect {
  planet1: string;             // 行星1
  planet2: string;             // 行星2
  type: string;                // 相位类型（合/冲/拱/刑/六合）
  orb: number;                 // 容许度
}
```

#### TarotReading

```typescript
interface TarotReading {
  cards: TarotCardReading[];   // 牌阵
}

interface TarotCardReading {
  card: TarotCard;             // 牌面数据
  isReversed: boolean;         // 是否逆位
  position: string;            // 牌位（过去/现在/未来等）
}

interface TarotCard {
  name: string;                // 牌名
  nameCn: string;              // 中文名
  type: string;                // 类型（大阿卡纳/小阿卡纳）
  suit?: string;               // 花色（权杖/圣杯/宝剑/星币）
  number: number;              // 编号
  meaning: string;             // 正位含义
  reversedMeaning: string;     // 逆位含义
  keywords: string[];          // 关键词
}
```

#### HoroscopeResult

```typescript
interface HoroscopeResult {
  zodiac: string;              // 星座
  todayGanZhi: string;         // 今日干支
  yi: string[];                // 宜
  ji: string[];                // 忌
  fangwei: Record<string, string>; // 方位（财神/喜神/福神等）
  element: string;             // 五行
}
```

### 4.4 报告生成规则

报告类型（4份，在 `/api/report` 中顺序生成）：

1. **概况** — 综合多流派结果的总体分析
2. **今日运势** — 基于今日干支的运势分析，开头提到今天日期
3. **本月运势** — 基于本月干支的运势分析
4. **今年运势** — 基于今年干支的运势分析

报告风格要求：
- 中式命理博主口吻，通俗易懂，贴近实际生活
- 去除 AI 味，不要写"根据数据分析""系统显示"等机器人用语
- 主要参考中式流派算命排盘结果
- 不要太具体、不要太神棍，保持接地气

---

## 5. 项目历程与迭代记录

### 5.1 初始版本（基础搭建）
- 使用 `coze init --template nextjs` 初始化项目
- 搭建 Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4 + shadcn/ui
- 实现七大算命流派基础功能
- 使用 lunar-javascript 作为核心算命引擎
- AI 对话引导 + 结果解读
- 设计风格：温暖纸感风

### 5.2 六爻引擎替换
- **决策**：使用 xiongdun8/liuyao 开源项目替换 iching-shifa
- **原因**：原库功能有限（仅支持基础起卦），新项目支持旺衰分析、回头生克、卦辞爻辞、六神、六亲、旬空
- **产出**：完全重写 `liuyao-engine.ts`，基于 Python 项目逻辑移植为 TypeScript

### 5.3 综合测算优化
- **决策**：去掉流派选择步骤，默认全选7种算法
- **原因**：简化用户操作流程，减少交互步骤

### 5.4 紫微斗数重构
- **决策**：使用 iztro 库替换自定义紫微斗数算法
- **原因**：iztro 支持完整流年/流月/流日/流时运限，功能远超自定义实现
- **产出**：
  - 重写 `ziwei-engine.ts`
  - 创建 `ziwei-chart-board.tsx`（4×4 方形命盘可视化）
  - 创建 `ziwei-time-nav.tsx`（6级时间导航）
  - 创建 `city-coords.ts`（38城市经纬度数据，用于真太阳时校正）
  - 真太阳时校正：根据出生城市经度调整时辰

### 5.5 报告系统重构
- **决策**：从4版报告（偏听偏信/偏中式/偏西式/民主投票）改为4个Tab（概况/今日运势/本月运势/今年运势）
- **原因**：用户要求更实用的报告形式，原4版报告过于花哨
- **产出**：
  - 重写 `fortune-report.tsx`（4个Tab并排 + 报告后追问 + 赞赏码）
  - 重写 `use-report.ts`（Hook，调用 /api/report 生成4份报告）
  - 重写 `/api/report/route.ts`（中式命理博主风格 prompt，顺序生成4份报告）

### 5.6 代码瘦身
- **决策**：使用 ponytail-audit 审计代码，删除过度工程
- **产出**：
  - 删除44个未使用的 shadcn/ui 组件（-5,570行代码）
  - 删除 server.ts（-35行）
  - 移除10+未使用的 npm 依赖
  - 修复 .babelrc 残留引用导致 500 错误

### 5.7 紫微命盘布局修复（进行中）
- **问题**：宫位顺序与参考图不符
- **决策**：按传统 4×4 布局重新映射
- **产出**：
  - 修正 `PALACE_INDEX_TO_GRID` 映射（iztro palaces[0..11] 对应地支寅→丑）
  - 重写 `PalaceCell` 内容排列顺序（星曜→大限→神煞→宫名→长生→干支）
  - 修复时辰映射公式（`Math.floor(hour/2)` → `Math.floor((hour+1)/2) % 12`）
  - 当前状态：**子女/财帛位置仍需进一步对齐**

### 5.8 其他优化
- 报告末尾添加赞赏码（`public/reward-qrcode.png`）
- 移动端适配：导航栏汉堡菜单、小屏上下堆叠、触摸目标最小 44px
- 星座从出生日期自动推算，无需用户手动输入
- 塔罗牌翻牌动画从 CSS 3D transform 改为条件渲染 + 淡入动画（移动端性能优化）
- 共享 `city-coords.ts`（38城市经纬度数据）

### 5.9 被否定的方案

| 方案 | 原因 |
|------|------|
| 使用 SQLite 存储用户数据 | 沙箱环境限制，改为会话/内存存储 |
| 使用 iching-shifa 作为六爻引擎 | 功能有限（仅基础起卦），替换为 xiongdun8/liuyao |
| 自定义紫微斗数算法 | 不支持完整运限，替换为 iztro |
| 4版报告（偏听偏信/偏中式/偏西式/民主投票） | 用户要求简化为4个Tab（概况/今日/本月/今年） |
| 开始时让用户选择流派 | 用户要求默认全选7种，减少操作步骤 |
| 塔罗牌 CSS 3D transform 翻牌 | 移动端性能差，改为条件渲染 + 淡入动画 |

---

## 6. 踩过的坑（按严重程度排序）

### 6.1 [严重] .babelrc 残留引用导致 500 错误
- **现象**：页面加载直接报 500 错误，所有路由不可用
- **原因**：删除了 `@react-dev-inspector/babel-plugin` 依赖包，但 `.babelrc` 文件仍引用该插件
- **解决**：清空 `.babelrc` 为 `{"presets": []}`
- **教训**：删除依赖包时，必须同步检查所有配置文件中的引用

### 6.2 [严重] Turbopack panic — FATAL: Module not found
- **现象**：Next.js 开发服务器崩溃，报 `FATAL: Module not found` 错误
- **原因**：`.next` 缓存目录损坏（可能是依赖变更后缓存未失效）
- **解决**：`rm -rf .next` 删除缓存，重启 dev server
- **教训**：遇到莫名其妙的模块找不到错误，先清缓存

### 6.3 [严重] useMemo 中调用 setState 导致无限循环
- **现象**：页面卡死，浏览器控制台报无限渲染警告
- **原因**：`ziwei/page.tsx` 在 `useMemo` 回调中调用了 `setHoroscopeData`，导致状态更新触发重新渲染，重新渲染又触发 useMemo，形成无限循环
- **解决**：将 setState 逻辑移到 `useEffect` 中，依赖变化时执行
- **教训**：useMemo 是纯计算，绝对不能有副作用（setState、API 调用等）

### 6.4 [严重] qimen-engine.ts TypeScript 编译失败
- **现象**：TypeScript 编译报错，`Record<string, unknown>` 类型的嵌套属性访问失败
- **原因**：为了消除 `any` 类型警告，将 `any` 改为 `Record<string, unknown>`，但后续代码需要访问嵌套属性
- **解决**：使用 `as any` 类型断言
- **教训**：消除 any 时要评估实际影响，必要时保留类型断言

### 6.5 [严重] sed 批量替换导致重复 JSX 属性
- **现象**：FortuneReport 组件有重复的 `isGenerating` prop，编译报错
- **原因**：使用 sed 命令批量替换时，匹配模式不够精确，导致重复写入
- **解决**：手动检查并去重
- **教训**：sed 批量替换风险高，优先使用 edit_file 工具精准替换

### 6.6 [中等] 紫微斗数宫位顺序全部错位
- **现象**：4×4 命盘布局与参考图（2000-11-5 01:00 男生）完全不符
- **原因**：`PALACE_INDEX_TO_GRID` 映射错误——iztro 的 palaces[0..11] 固定对应地支寅→丑，但映射表把 palace 索引和地支对应关系搞混了
- **解决**：重新梳理映射：
  - palace[0]=寅→[3,0], palace[1]=卯→[2,0], palace[2]=辰→[1,0], palace[3]=巳→[0,0]
  - palace[4]=午→[0,1], palace[5]=未→[0,2], palace[6]=申→[0,3], palace[7]=酉→[1,3]
  - palace[8]=戌→[2,3], palace[9]=亥→[3,3], palace[10]=子→[3,2], palace[11]=丑→[3,1]
- **教训**：理解第三方库的数据结构后再做映射，不要凭直觉

### 6.7 [中等] 时辰映射公式错误导致排盘偏移
- **现象**：01:00 出生的用户排盘结果与参考图不符，所有宫位整体偏移一个地支
- **原因**：`getAdjustedShichen` 使用 `Math.floor(hour/2)` 映射时辰，将 hour=1 映射为 timeIndex=0（子时），正确应为 timeIndex=1（丑时）
- **解决**：改为 `Math.floor((hour+1)/2) % 12`
  - hour 0,1 → 0（子时：00:00-01:00 和 23:00-00:00）
  - hour 1,2 → 1（丑时：01:00-03:00）
- **教训**：时辰映射是命理计算的基础，必须与所用库的约定对齐

### 6.8 [中等] 跨域图片下载失败
- **现象**：前端使用 `<a href="signedUrl" download>` 下载跨域图片时，浏览器打开新标签页而非下载
- **原因**：浏览器的安全策略：跨域资源的 `download` 属性会被忽略
- **解决**：使用 fetch + blob 模式：
  ```typescript
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(blobUrl);
  ```
- **教训**：跨域文件下载必须走 blob 方案

### 6.9 [中等] lsof 端口检测误杀进程
- **现象**：使用 `lsof -i:5000` 检测端口占用后 kill 进程，导致服务异常
- **原因**：`lsof` 会列出所有包含该端口的连接（服务端 + 客户端），kill 可能误杀客户端连接或其他关键进程
- **解决**：使用 `ss -tuln | grep ':5000' | grep LISTEN` 只检测 LISTEN 状态的服务端端口
- **教训**：端口检测必须精准定位 LISTEN 状态的进程

### 6.10 [中等] 环境变量修改后不生效
- **现象**：修改 `.env.local` 中的 API Key 后，AI 调用仍使用旧值
- **原因**：Next.js dev server 不会自动重新加载 `.env.local`，需要重启
- **解决**：修改环境变量后必须重启 dev server
- **教训**：环境变量变更后要重启服务，或在代码中使用 `process.env` 动态读取

### 6.11 [中等] 移动端 CSS 3D transform 性能问题
- **现象**：塔罗牌翻牌动画在移动端严重卡顿
- **原因**：CSS 3D transform 在移动端 GPU 渲染性能差
- **解决**：改用条件渲染 + CSS 淡入动画（opacity + transition）
- **教训**：移动端避免复杂 3D 变换

### 6.12 [轻微] React Hydration 错误
- **现象**：页面加载时控制台报 Hydration 错误
- **原因**：在 JSX 渲染逻辑中直接使用 `typeof window`、`Date.now()`、`Math.random()` 等动态数据，服务端和客户端渲染结果不一致
- **解决**：使用 `'use client'` + `useEffect` + `useState` 确保动态内容仅在客户端挂载后渲染
- **教训**：SSR 模式下避免在渲染逻辑中使用动态数据

### 6.13 [轻微] 非法 HTML 嵌套
- **现象**：`<p>` 标签嵌套 `<div>` 导致 Hydration 错误
- **原因**：HTML 规范不允许 `<p>` 内嵌套块级元素
- **解决**：将外层 `<p>` 改为 `<div>`
- **教训**：注意 HTML 语义和嵌套规范

### 6.14 [轻微] Google Fonts 跨境加载慢
- **现象**：字体加载超时，页面首次渲染无字体
- **原因**：在中国大陆访问 `fonts.googleapis.com` 延迟高
- **解决**：使用 `fonts.googleapis.cn` 域名
- **教训**：外部资源域名需做地域适配

---

## 7. 当前进度

### 7.1 已完成

- [x] 项目初始化（Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4）
- [x] 设计系统（温暖纸感风：DESIGN.md + globals.css Design Tokens）
- [x] 首页（Hero + 七大功能卡片入口 + AI一键算命 CTA）
- [x] 全局导航栏（含移动端汉堡菜单）
- [x] 八字命盘（四柱、五行缺、纳音、十神、大运流年）
- [x] 紫微斗数（iztro 引擎、4×4 命盘、6级运限导航、真太阳时校正）
- [x] 奇门遁甲（九星、八门、九宫、宜忌）
- [x] 六爻占卜（xiongdun8/liuyao 算法、旺衰分析、回头生克）
- [x] 星座星盘（太阳/月亮/上升、行星、相位、元素分布）
- [x] 塔罗占卜（78张完整牌库、正逆位、牌位含义）
- [x] 每日运势（今日干支、宜忌、方位、五行）
- [x] 综合测算（默认全选7种，并列展示，聚合报告）
- [x] AI 对话引导（/api/chat 流式，信息采集 + 结果解读）
- [x] AI 报告生成（/api/report，4份报告：概况/今日/本月/今年）
- [x] 报告后追问对话（FortuneReport 内置 FollowUpChat）
- [x] 可复制信息摘要（CopyableSummary）
- [x] 通用表单组件（InputForm）
- [x] 共享城市经纬度数据（city-coords.ts，38城市）
- [x] 赞赏码集成
- [x] 代码瘦身（删除44个未用组件 + 10+依赖）
- [x] 移动端适配（汉堡菜单、堆叠布局、44px 触摸目标）
- [x] AGENTS.md 项目规范
- [x] DESIGN.md 设计规范
- [x] MIGRATION.md 迁移文档（本文档）

### 7.2 进行中

- [ ] 紫微命盘布局精确对齐 — 用户反馈子女/财帛位置仍与参考图不符

### 7.3 计划但未启动

- [ ] 用户系统（登录/注册/历史记录）
- [ ] 数据持久化（Supabase 数据库存储用户数据和测算历史）
- [ ] 分享功能（生成分享链接/图片）
- [ ] 更多算命流派（姓名学、风水等）
- [ ] 移动端 PWA 支持
- [ ] 多语言支持
- [ ] SEO 优化
- [ ] 埋点分析

### 7.4 已知遗留问题

| 问题 | 严重程度 | 状态 | 说明 |
|------|----------|------|------|
| 紫微命盘子女/财帛位置不匹配 | 中等 | 待修复 | 用户反馈与参考图（2000-11-5 01:00 男生）比对后位置不对 |
| AI 报告偶尔有 AI 味 | 轻微 | 待优化 | prompt 需进一步调整 |
| 移动端部分动画卡顿 | 轻微 | 待优化 | 低端机上滚动和切换动画不够流畅 |
| 塔罗牌数据完整性 | 轻微 | 待验证 | 78张牌的正逆位含义是否完整覆盖 |
| 星座星盘精度 | 轻微 | 待验证 | 行星位置计算未经天文数据校验 |

---

## 8. 迁移注意事项

### 8.1 环境准备

#### 必须配置的环境变量

| 变量名 | 用途 | 示例 |
|--------|------|------|
| `COZE_API_KEY` | AI 服务密钥（DeepSeek） | `sk-xxxx` |
| `COZE_API_BASE` | AI 服务地址 | `https://api.deepseek.com` |
| `COZE_PROJECT_DOMAIN_DEFAULT` | 对外访问域名 | `https://xxx.dev.coze.site` |
| `DEPLOY_RUN_PORT` | 服务监听端口 | `5000`（主仓固定） |

#### 必须安装的依赖

```bash
pnpm install
```

核心依赖清单：
- `next` + `react` + `react-dom` — 框架
- `lunar-javascript` — 八字/农历/干支计算
- `iztro` — 紫微斗数完整排盘
- `coze-coding-dev-sdk` — AI 调用 SDK
- `lucide-react` — 图标库
- `tailwindcss` + `@tailwindcss/postcss` — 样式框架

#### 构建和运行命令

```bash
# 开发环境
pnpm dev                    # 启动开发服务器（端口 5000，支持 HMR）

# 生产环境
pnpm build                  # 构建生产版本
pnpm start                  # 启动生产服务器

# 代码检查
pnpm ts-check               # TypeScript 类型检查
pnpm lint                   # ESLint 代码规范检查
```

### 8.2 紫微斗数特殊注意事项（重要）

#### iztro 库的 timeIndex 约定

iztro 的 `astro.bySolar(date, timeIndex, gender)` 的第二个参数是时辰索引（0-11）：

| timeIndex | 时辰 | 时间范围 |
|-----------|------|----------|
| 0 | 早子时 | 00:00-01:00 |
| 1 | 丑时 | 01:00-03:00 |
| 2 | 寅时 | 03:00-05:00 |
| 3 | 卯时 | 05:00-07:00 |
| 4 | 辰时 | 07:00-09:00 |
| 5 | 巳时 | 09:00-11:00 |
| 6 | 午时 | 11:00-13:00 |
| 7 | 未时 | 13:00-15:00 |
| 8 | 申时 | 15:00-17:00 |
| 9 | 酉时 | 17:00-19:00 |
| 10 | 戌时 | 19:00-21:00 |
| 11 | 亥时 | 21:00-23:00 |

**时辰映射公式**：`Math.floor((hour + 1) / 2) % 12`
- hour 0,23 → timeIndex 0（子时）
- hour 1,2 → timeIndex 1（丑时）
- hour 3,4 → timeIndex 2（寅时）
- ...以此类推

#### 4×4 宫格映射（CRITICAL）

iztro 的 `palaces` 数组索引 0-11 固定对应地支：
```
palace[0]  = 寅
palace[1]  = 卯
palace[2]  = 辰
palace[3]  = 巳
palace[4]  = 午
palace[5]  = 未
palace[6]  = 申
palace[7]  = 酉
palace[8]  = 戌
palace[9]  = 亥
palace[10] = 子
palace[11] = 丑
```

传统 4×4 方形命盘布局（地支位置）：
```
[0,0]巳  [0,1]午  [0,2]未  [0,3]申
[1,0]辰  [中心]   [中心]    [1,3]酉
[2,0]卯  [中心]   [中心]    [2,3]戌
[3,0]寅  [3,1]丑  [3,2]子  [3,3]亥
```

映射关系（`PALACE_INDEX_TO_GRID`）：
```typescript
const PALACE_INDEX_TO_GRID = {
  3: [0, 0],   // 巳
  4: [0, 1],   // 午
  5: [0, 2],   // 未
  6: [0, 3],   // 申
  2: [1, 0],   // 辰
  7: [1, 3],   // 酉
  1: [2, 0],   // 卯
  8: [2, 3],   // 戌
  0: [3, 0],   // 寅
  11: [3, 1],  // 丑
  10: [3, 2],  // 子
  9: [3, 3],   // 亥
};
```

#### 真太阳时校正

```typescript
export function getAdjustedShichen(hour: number, longitude?: number): number {
  let adjustedHour = hour;
  if (longitude != null) {
    const offsetMin = (longitude - 120) * 4; // 每1°经度 = 4分钟偏差
    const realHour = hour + offsetMin / 60;
    adjustedHour = Math.max(0, Math.min(23, Math.round(realHour * 2) / 2));
  }
  return Math.floor((adjustedHour + 1) / 2) % 12;
}
```

基准经度：120°（东八区标准子午线）

### 8.3 AI 调用注意事项

#### 流式输出
- 协议：SSE（Server-Sent Events）
- 后端：`ReadableStream` + `TextEncoder` 逐步输出
- 响应头：`Content-Type: text/event-stream`、`Transfer-Encoding: chunked`
- 前端：`fetch` 的 `body.getReader()` 实现打字机效果

#### 错误处理
- 前端必须有超时控制（30秒）
- 用户可见的错误提示（不要只 console.error）
- 提供重试入口（按钮）
- 超时后自动清理连接

#### llm-client.ts 封装
```typescript
// 流式调用
streamChat(messages: ChatMessage[], options?: { signal?: AbortSignal }): AsyncGenerator<string>

// 非流式调用
chat(messages: ChatMessage[], options?: { signal?: AbortSignal }): Promise<string>
```

### 8.4 移动端适配要点
1. **导航栏**：移动端使用汉堡菜单（`Sheet` 组件从右侧滑出）
2. **布局**：所有页面小屏上下堆叠（`flex-col`），大屏左右并排
3. **触摸目标**：所有可点击元素最小 44×44px
4. **动画**：避免 CSS 3D transform，改用条件渲染 + opacity 淡入
5. **字体**：使用 `sm:` 断点区分手机和桌面字体大小
6. **紫微命盘**：宫格最小高度 `min-h-[100px] sm:min-h-[130px]`

### 8.5 设计系统

见 `DESIGN.md`，关键参数：
- 背景色：`#FBF3E7`
- 卡片色：`#FFF9F1`
- 文本色：`#31251B`
- 次文本：`#8B7662`
- 强调色：`#C96F3D`
- 柔和绿：`#7E9F7A`
- 圆角：柔和（`rounded-md`、`rounded-lg`）
- 阴影：轻柔
- 字体：Georgia、Lora、中文宋体风格

### 8.6 迁移步骤清单

1. [ ] 克隆代码到新平台
2. [ ] 配置环境变量（`.env.local`）
3. [ ] 安装依赖：`pnpm install`
4. [ ] 验证依赖安装无报错
5. [ ] 启动开发服务器：`pnpm dev`
6. [ ] 验证所有页面可访问
7. [ ] 测试 AI 对话流式功能
8. [ ] 测试 AI 报告生成功能
9. [ ] 测试紫微斗数 4×4 命盘显示
10. [ ] 测试紫微斗数 6级运限切换
11. [ ] 测试综合测算全流程
12. [ ] 移动端适配验证（5种尺寸）
13. [ ] 构建生产版本：`pnpm build`
14. [ ] 启动生产服务器：`pnpm start`
15. [ ] 生产环境功能验证
16. [ ] 检查日志无异常

---

## 9. 方法论沉淀

### 9.1 Ponytail 开发模式

本项目全程使用 Ponytail（Lazy Senior Dev）模式，核心理念：

1. **这需要存在吗？** — 投机性需求跳过，YAGNI（You Ain't Gonna Need It）
2. **标准库能做到？** — 用标准库
3. **原生平台特性覆盖了？** — `<input type="date">` 优于日期选择器库，CSS 优于 JS
4. **已安装的依赖能解决？** — 用它，不为几行代码加新依赖
5. **能一行搞定？** — 一行
6. **以上都不行：** — 写最少能工作的代码

**规则**：
- 不建没人要的抽象
- 不写样板代码、不搭"以后用"的脚手架
- 删优于增
- 最少文件，最短有效 diff
- 有意简化处标记 `ponytail:` 注释

### 9.2 三层架构原则

**算法引擎层 → AI 层 → 展示层** 严格分离：

1. **算法引擎层**：纯计算，无 AI 依赖，无副作用。输入标准化数据，输出结构化 Result
2. **AI 层**：对话引导 + 结果解读 + 多流派聚合。仅负责"理解"和"表达"，不负责"计算"
3. **展示层**：对话 UI + 原始数据展示 + 报告。仅负责渲染，不负责业务逻辑

**好处**：
- 各层独立开发、独立测试
- 算法引擎可脱离 AI 独立运行
- AI prompt 修改不影响核心计算逻辑

### 9.3 报告生成策略

- **风格定位**：中式命理博主口吻，通俗易懂，去除 AI 味
- **结构设计**：4份报告并行生成（概况/今日/本月/今年），覆盖不同时间维度
- **今日运势**：开头提到今天日期，增强时效感和个性化
- **赞赏码**：报告末尾添加，不打断阅读流程

### 9.4 移动端优先设计

- 用户主要使用手机访问 → 所有页面以移动端为第一设计目标
- 所有页面小屏上下堆叠，大屏左右并排
- 触摸目标最小 44px（符合 Apple HIG 和 Material Design 标准）
- 避免 CSS 3D transform（移动端 GPU 性能差）
- 塔罗牌翻牌改用条件渲染 + 淡入动画

### 9.5 错误处理原则

- **前端**：超时控制 + 用户可见错误提示 + 重试按钮
- **后端**：try-catch 包裹所有 AI 调用，返回结构化错误
- **日志**：记录到 `/app/work/logs/bypass/` 目录
- **降级**：AI 调用失败时显示友好提示，不影响算法结果展示

### 9.6 代码瘦身经验

- 定期使用 `ponytail-audit` 审计代码
- 删除未使用的组件和依赖（本项目 -5,570行 + 10+依赖）
- 避免投机性抽象（"以后可能用到"的代码一律删除）
- 删优于增，简洁优于聪明

### 9.7 第三方库选型原则

- **优先开源算法库**：算命逻辑用成熟开源库（lunar-javascript、iztro），不自己造轮子
- **评估标准**：功能完整性 > 社区活跃度 > 代码质量 > 包大小
- **替换决策**：功能不足时果断替换（iching-shifa → xiongdun8/liuyao，自定义紫微 → iztro）

### 9.8 调试与排障流程

1. 先看报错信息 → 足够定位则直接修复
2. 信息不足 → 按场景选择日志：
   - 前端问题：console.log → app.log → dev.log
   - 后端问题：app.log → dev.log → console.log
3. 读日志限制：单次 ≤ 50行，先定位行号再定点读取
4. 修复后验证：只读最新日志（`tail -n 10`）

### 9.9 验证策略

- **静态检查**：`pnpm ts-check` + `pnpm lint`（通过 `test_run` 执行）
- **接口测试**：每个 API 至少一条 curl（通过 `test_run` 执行）
- **覆盖率要求**：API 接口测试覆盖率 100%
- **移动端验证**：5种尺寸（375×667, 390×844, 430×932, 360×800, 412×915）
- **并行修复**：多种类型错误同时分析、并行修复、一次性重新验证
- **放弃机制**：同一问题 5 次尝试仍失败，停止并告知用户

### 9.10 项目文档规范

- **AGENTS.md**：项目规范，帮助 Agent 快速理解项目结构
- **DESIGN.md**：设计规范，沉淀视觉/品牌/布局/交互偏好
- **MIGRATION.md**：迁移文档，新平台接手的信息基础
- **.learnings/**：项目经验记录，避免重复踩坑
- **增量维护**：文档随项目迭代更新，不过时

---

**文档版本**：v1.0  
**最后更新**：2026-06-21  
**维护者**：海龙
