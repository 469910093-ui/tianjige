# 天机阁 - AI 算命网站

## 项目概览
多合一 AI 算命平台，支持八字命盘、紫微斗数、奇门遁甲、六爻占卜、星座星盘、塔罗占卜、每日运势七大功能。核心算命逻辑使用开源算法库（lunar-javascript），AI 仅用于对话引导、结果解读和多流派聚合。用户可单一流派测算，也可综合多流派并列对比。

## 技术栈
- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS 4 + shadcn/ui 风格
- lunar-javascript（八字排盘/农历/干支计算/紫微命宫/九星/六爻）
- coze-coding-dev-sdk（LLM 流式/非流式调用）
- Lucide Icons

## 构建与运行
- 开发：`pnpm dev`（端口 5000）
- 构建：`pnpm build`
- 启动：`pnpm start`
- 类型检查：`pnpm ts-check`
- Lint：`pnpm lint`

## 目录结构
```
src/
├── app/
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首页（Hero + 七大功能入口 + 综合测算CTA）
│   ├── globals.css         # 全局样式 + Design Token
│   ├── bazi/page.tsx       # 八字命盘页
│   ├── ziwei/page.tsx      # 紫微斗数页
│   ├── qimen/page.tsx      # 奇门遁甲页
│   ├── liuyao/page.tsx     # 六爻占卜页
│   ├── astrology/page.tsx  # 星座星盘页
│   ├── tarot/page.tsx      # 塔罗占卜页
│   ├── horoscope/page.tsx  # 每日运势页
│   ├── unified/page.tsx    # 综合测算页（多流派选择→并列展示→聚合报告）
│   └── api/
│       ├── chat/route.ts   # AI 对话流式 API
│       └── report/route.ts # AI 报告生成 API（支持四版报告并行）
├── components/
│   ├── navbar.tsx           # 全局导航栏
│   ├── fortune-chat.tsx     # 通用对话引擎组件（支持信息采集完成回调）
│   ├── fortune-report.tsx   # 四版报告展示 + 报告后AI追问对话
│   └── copyable-summary.tsx # 可复制信息摘要组件
├── lib/
│   ├── bazi-engine.ts       # 八字排盘 + 运势计算（lunar-javascript）
│   ├── ziwei-engine.ts      # 紫微斗数排盘（命宫/身宫/十四主星/四化）
│   ├── qimen-engine.ts      # 奇门遁甲起局（九星/八门/九宫/宜忌）
│   ├── liuyao-engine.ts     # 六爻排盘（本卦/变卦/六亲/世应/动爻）
│   ├── astrology-engine.ts  # 星座星盘计算
│   └── tarot-engine.ts      # 塔罗抽牌（78 张完整数据）
└── types/
    └── lunar-javascript.d.ts # lunar-javascript 类型声明
```

## 核心架构
三层分离：
1. **算法引擎层**（src/lib/）：纯计算，无 AI 依赖
2. **AI 层**（src/app/api/）：对话引导 + 结果解读 + 多流派聚合 + 报告追问
3. **展示层**（src/app/ + src/components/）：对话 UI + 原始数据展示 + 报告 + 追问

## 交互流程
### 单一流派（首页卡片入口）
1. 点击首页卡片 → 进入对应流派页面
2. AI 对话引导采集信息（出生日期/时间等）
3. 信息采集完成 → 生成可复制文本摘要
4. 算法引擎计算 → 展示原始数据
5. 生成一份四版解读报告
6. 报告后可AI追问对话（根据算法结果个性化解答）

### 综合测算（首页CTA入口）
1. 选项卡式选择多个流派（点击卡片选择/取消）
2. 确认选择后 → AI 对话采集所有流派所需信息
3. 信息采集完成 → 生成可复制文本摘要
4. 各流派并列测算 → 并列展示所有算法结果
5. 生成四版聚合报告
6. 报告后可AI追问对话（综合所有算法结果解答）

## 四版报告
- 偏听偏信：全盘采信所有流派
- 偏中式：中式命理为主体
- 偏西式：西方占星为主体
- 民主投票：多数派决定，少数派附注

## 引擎类型要点
- BaziResult: yearPillar/monthPillar/dayPillar/hourPillar (各有gan/zhi), wuxingQue, shengxiao, bazi
- ZiweiResult: mingGongGan/Zhi, shenGongGan/Zhi, mingGongNaYin, shenGongNaYin, palaces[12], sihua[4], wuxingJu
- QiMenResult: dunType, juNumber, jiuXingName, baMenName, gongDetails[9], yi[], ji[]
- LiuYaoResult: benGua, bianGua, benGong, yaoDetails[6], dongYao[], liuShen[], xunKong
- AstrologyResult: sun/moon/ascendant, planets[], aspects[], elements{}
- TarotReading: cards[] (每项有card:TarotCard, isReversed, position)
- HoroscopeResult: zodiac, todayGanZhi, yi[], ji[], fangwei{}, element
- calculateHoroscope(zodiacName) 只需1个参数

## 设计风格
温暖纸感风（详见 DESIGN.md）：#FBF3E7 背景、#C96F3D 强调色、圆角柔和、轻柔阴影

## 注意事项
- lunar-javascript 无内置类型声明，类型定义在 src/types/lunar-javascript.d.ts
- AI 调用使用 coze-coding-dev-sdk，通过 HeaderUtils 传递请求头
- 塔罗牌翻牌动画使用 CSS 3D transform
- 每日运势页面使用 useEffect 初始化，避免 SSR 问题
- TarotReading.cards 是数组
- 移动端适配：导航栏有汉堡菜单，所有页面小屏上下堆叠，触摸目标最小 44px
- 报告后追问功能：FortuneReport 组件内置 FollowUpChat，通过 engineData prop 接收算法原始数据
- calculateHoroscope 运行时方法名用 getYearInGanZhi()（非 getYearGanZhi()）

## Ponytail — Lazy Senior Dev Mode

> 来源：[DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) (MIT)

每次写代码前，停在第一个成立的梯级：

1. **这需要存在吗？** 投机性需求 = 跳过，用一行说明。(YAGNI)
2. **标准库能做到？** 用标准库。
3. **原生平台特性覆盖了？** `<input type="date">` 优于日期选择器库，CSS 优于 JS，数据库约束优于应用代码。
4. **已安装的依赖能解决？** 用它。不为几行代码加新依赖。
5. **能一行搞定？** 一行。
6. **以上都不行：** 写最少能工作的代码。

### 规则
- 不建没人要的抽象：只有一个实现的接口、只产一种产品的工厂、永远不会变的配置——都不写。
- 不写样板代码、不搭"以后用"的脚手架，以后需要时再搭。
- 删优于增。无聊优于聪明，聪明是凌晨三点让人抓头的东西。
- 最少文件。最短有效 diff 胜出。
- 复杂需求？先交付精简版，同一回复中质疑它："做了 X；Y 已覆盖。需要完整 X？说一声。" 永远别在能默认交付时停滞。
- 两个标准库方案同样简短？选边界情况正确的那个。偷懒是写更少代码，不是选更弱的算法。
- 有意简化处标记 `ponytail:` 注释（`// ponytail: 浏览器自带`），让简洁读起来像意图而非无知。捷径有已知上限（全局锁、O(n²) 扫描、朴素启发式）？注释写明上限和升级路径：`# ponytail: 全局锁，吞吐量不够时改为按账户锁`。

### 输出
代码优先。然后最多三行短文：跳过了什么、何时该加。不写长文、不做功能巡礼、不写设计笔记。如果解释比代码还长，删掉解释。

模式：`[代码] → 跳过: [X]，需要时加 [Y]。`

### 强度级别
| 级别 | 行为 |
|------|------|
| **lite** | 构建所求，但用一行指出更懒的替代方案。用户选择。 |
| **full** | 梯级强制执行。标准库和原生优先。最短 diff、最短解释。默认。 |
| **ultra** | YAGNI 极端主义。删优于增。交付一行代码，同时质疑剩余需求。 |

### 不偷懒的地方
绝不简化掉：信任边界的输入校验、防数据丢失的错误处理、安全措施、无障碍基础、用户明确要求的功能。用户坚持要完整版 → 构建，不再争辩。

偷懒代码没有校验就是半成品：非平凡逻辑（分支、循环、解析器、金额/安全路径）留一个可运行的检查——最小到逻辑坏了就会失败的东西（基于 assert 的自检或一个小测试文件；不用框架、不用 fixture）。平凡一行代码不需要测试。

### Ponytail 子技能（参考 skills/ 目录）
- **ponytail-review**：审查 diff 的过度工程，逐行列出可删项
- **ponytail-audit**：全仓库过度工程审计，按删减量排名
- **ponytail-debt**：收集所有 `ponytail:` 注释为债务台账，追踪每个捷径
- **ponytail-gain**：展示 benchmark 数据（少 80-94% 代码、省 42-75% 成本、3-6× 速度）
- **ponytail-help**：快速参考卡
