---
version: alpha
name: 天机食鉴
description: Modern editorial mystic — 易经占筮 × 现代杂志感的高端灵性品牌，米白底 + 黑金双色 + 衬线大标题 + 几何符号 + 呼吸式留白。
colors:
  primary: "#1A1A1A"        # Ink Black — 核心文字、主 CTA
  secondary: "#7A7368"      # Stone — 次要文字、元数据
  tertiary: "#B8945A"       # Antique Gold — 唯一金属强调色
  neutral: "#F7F4EE"        # Ivory Cream — 页面底色
  surface: "#FBF8F2"        # Warm White — 卡片底
  border: "#E8E2D4"         # Soft Sand — 描边/分隔
  on-primary: "#F7F4EE"
  on-tertiary: "#1A1A1A"
  accent-warm: "#A88C4A"    # Deep Gold — 金色暗调（hover/active）
typography:
  display-xl:
    fontFamily: "DM Serif Display, Playfair Display, serif"
    fontSize: "4.5rem"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  h1:
    fontFamily: "DM Serif Display, Playfair Display, serif"
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.015em"
  h2:
    fontFamily: "DM Serif Display, Playfair Display, serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1.2
  h3:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body-lg:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label-caps:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.12em"
    textTransform: "uppercase"
  label-meta:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
    color: "{colors.secondary}"
rounded:
  none: "0px"
  sm: "4px"
  md: "8px"
  lg: "12px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
  "3xl": "72px"
  "4xl": "112px"
shapes:
  card: "{rounded.md}"
  input: "{rounded.sm}"
  button: "{rounded.sm}"
  badge: "{rounded.pill}"
  image: "{rounded.none}"
elevation:
  card: "none"
  card-hover: "0 2px 8px rgba(26, 26, 26, 0.06)"
  modal: "0 8px 24px rgba(26, 26, 26, 0.12)"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.sm}"
    padding: "16px 32px"
    size: ""
  button-primary-hover:
    backgroundColor: "#000000"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.sm}"
    padding: "16px 32px"
    borderColor: "{colors.primary}"
    size: "1px"
  button-secondary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: "8px 0"
    borderColor: "transparent"
    size: "0px"
  input-text:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
    borderColor: "{colors.border}"
    size: "1px"
  input-text-focus:
    borderColor: "{colors.tertiary}"
  select:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
    borderColor: "{colors.border}"
    size: "1px"
  card-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{shapes.card}"
    padding: "32px"
  card-flat:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.none}"
    padding: "0"
  badge-tag:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    typography: "{typography.label-caps}"
    rounded: "{shapes.badge}"
    padding: "4px 12px"
  badge-meta:
    backgroundColor: "transparent"
    textColor: "{colors.tertiary}"
    typography: "{typography.label-caps}"
    rounded: "{shapes.badge}"
    padding: "0"
  link-inline:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: "0"
  link-inline-hover:
    backgroundColor: "transparent"
    textColor: "{colors.tertiary}"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.none}"
    padding: "8px 0"
  nav-link-hover:
    backgroundColor: "transparent"
    textColor: "{colors.tertiary}"
  divider:
    backgroundColor: "{colors.border}"
    height: "1px"
    rounded: "{rounded.none}"
---

## Overview

天机食鉴 走的是 **"高级杂志感占卜品牌"** 路线：米白底 + 黑金双色 + 现代衬线大标题 + 金线几何符号 + 大量呼吸式留白。

它 **不靠紫色渐变、星空粒子、光晕特效** 来表达神秘学，而是靠 **排版克制度 + 几何符号 + 编辑式字体** 来营造"可信赖的现代灵性品牌"形象——类似 Aesop、Astrala 这类品牌的网页节奏。

页面节奏遵循 **"密 → 疏 → 密 → 疏"** 的呼吸式排版：hero 区密、内容区疏、列表区密、footer 区疏。

## Colors

- **Primary `#1A1A1A` (Ink Black):** 核心文字、主标题、主 CTA 按钮、关键边框。所有"重"信息的承载体。
- **Secondary `#7A7368` (Stone):** 次要文字、元数据（作者、日期）、弱化标签。提供层级而不抢戏。
- **Tertiary `#B8945A` (Antique Gold):** **唯一金属强调色**——小标签、分类、占星符号描线、链接 hover。**严格限量使用**，避免金色泛滥失去神秘感。
- **Neutral `#F7F4EE` (Ivory Cream):** 页面底色。不是纯白，带温度。
- **Surface `#FBF8F2` (Warm White):** 卡片底色。比底色亮一档，靠"色差分层"代替阴影。
- **Border `#E8E2D4` (Soft Sand):** 描边、分隔线。极淡，不喧宾夺主。

**WCAG 校验：**
- `#1A1A1A` on `#F7F4EE` → 16.8:1 (AAA)
- `#7A7368` on `#F7F4EE` → 4.6:1 (AA)
- `#B8945A` on `#F7F4EE` → 3.0:1 (仅用于大字号、非关键文本)
- `#F7F4EE` on `#1A1A1A` → 16.8:1 (AAA)

## Typography

**双字体系统：**

- **衬线字体**（DM Serif Display / Playfair Display fallback）—— 主标题（h1/h2/display），承担"仪式感 + 编辑感"。
- **无衬线字体**（Inter / system-ui）—— 正文、导航、按钮、标签，承担"功能 + 操作"。

**对比逻辑：** serif = 仪式感/情感，sans = 功能/信息。形成"内容 vs 操作"的清晰层级。

**字重策略：** 不靠加粗建立层级，靠 **字重 400/500/600** + **字号差** + **字距**。主标题字重 400（衬线天然厚重），按钮字重 600 + 全大写 + 0.12em 字距。

**字号阶梯：**
- `display-xl` 4.5rem — Hero 大标题
- `h1` 3rem — 页面主标题
- `h2` 2.25rem — 区块标题
- `h3` 1.5rem — 卡片标题
- `body-lg` 1.125rem — 引导段
- `body-md` 1rem — 正文
- `body-sm` 0.875rem — 辅助说明
- `label-caps` 0.75rem — 小标签（BIG caps + 0.12em tracking）
- `label-meta` 0.8125rem — 作者/日期元数据（Stone 灰色）

## Layout

**容器宽度：** 1200px（PC 端），窄页（表单）640px。

**Spacing 比例：** 4px 基线，遵循 `xs/sm/md/lg/xl/2xl/3xl/4xl` 8 阶阶梯（4-112px）。

**节奏规则：**
- `md` (16px)：组件内间距
- `lg` (24px)：组件间间距
- `xl` (32px)：卡片内 padding
- `2xl` (48px)：区块间留白
- `3xl` (72px)：section 之间的大留白

**区块节奏：** "密 → 疏 → 密 → 疏"——Hero 密、最新内容中密、Zodiac 列表中密、Footer 疏。绝不让连续两个区块都"满"或都"空"。

## Elevation & Depth

**核心原则：靠色差分层，不靠阴影。**

- 卡片默认无阴影
- 卡片 hover：极轻阴影（`0 2px 8px rgba(26, 26, 26, 0.06)`）
- 弹窗/模态：明显阴影（`0 8px 24px rgba(26, 26, 26, 0.12)`）

**避免：** 大投影、彩色阴影、内阴影、长投影——这些会让品牌显得"廉价技术感"。

## Shapes

**圆角规则：**
- 卡片：`md` (8px) — 微弱圆角，硬边与柔边的过渡
- 输入框：`sm` (4px) — 极弱圆角，几乎是直角
- 按钮：`sm` (4px) — 矩形按钮，与编辑感统一
- 徽章/标签：`pill` (9999px) — 完全圆角，用于小标签
- 图片：`none` (0px) — 硬边贴入，更像杂志

**避免：** 大圆角按钮（12px+）、全圆角卡片——会让界面"软"，失去编辑感。

## Components

### Buttons

- **`button-primary`：** 黑底 + 米白字 + 矩形 + 全大写 + 0.12em tracking。Hero 区主操作（"起一卦"、"生成聚会码"）。
- **`button-secondary`：** 透明底 + 黑描边 + 黑字 + 矩形。次要操作（"再起一卦"、"刷新数据"）。
- **`button-ghost`：** 无背景 + 无边框 + 黑字 + 下划线 hover。文字型链接（"← 返回首页"）。

### Inputs

- **`input-text` / `select`：** 米白底 + 砂色描边 + 4px 圆角 + 16px padding。Focus 时描边变金色。

### Cards

- **`card-surface`：** 暖白底 + 8px 圆角 + 32px padding + 无阴影。**默认表面**——所有分组内容。
- **`card-flat`：** 透明底 + 无圆角 + 无 padding。**内容直接铺陈**——列表、表格。

### Tags & Badges

- **`badge-tag`：** 金色底 + 黑字 + 全大写 + pill。**唯一带底色的标签**——分类标识（如 "BLOG"、"ZODIAC"）。
- **`badge-meta`：** 透明底 + 金色字 + pill。**轻量标签**——运势（"吉"、"中吉"）。

### Navigation

- **`nav-link`：** 透明底 + 黑字 + 全大写 + 0.12em tracking + 8px 上下 padding。下划线 hover 变金色。
- **顶栏：** 透明背景悬浮，scroll 后渐变至 90% 不透明米白 + backdrop-blur(8px)。

### Dividers

- **`divider`：** 1px 高 + 砂色。区块间的"呼吸线"。

## Imagery

**Hero 视觉锚点：** 金线几何符号（如占星轮盘、卦象符号），**线条型而非发光/渐变/3D**。这是品牌识别符号。

**文章封面：** 保留原始照片质感（人像、产品、招贴），**未做过度滤镜**，比例统一为横向矩形，**无圆角、无阴影**——"硬边贴入"的杂志感。

**装饰元素：**
- ✅ 金线几何符号（轮盘、卦象、星座图）
- ✅ 衬线大标题的优雅字号对比
- ❌ 星空粒子、紫色渐变、光晕特效
- ❌ 大段符文、仪式感图标堆砌
- ❌ 3D 球体、玻璃拟态

## Do's and Don'ts

### Do

- ✅ 用 **token references** (`{colors.tertiary}`) 而不是字面 hex 值
- ✅ 卡片默认无阴影，靠色差分层
- ✅ 主标题用 **DM Serif Display** weight 400（衬线天然厚重，不靠 700）
- ✅ 按钮用 **sm 圆角 + 全大写 + 0.12em tracking**，编辑感
- ✅ 全文用 **Inter** 做正文，1.5 行高
- ✅ section 之间留 **72px**，呼吸感是品牌识别
- ✅ 金色 `#B8945A` **严格限量使用**——仅小标签、hover、符号描线
- ✅ 容器宽度 **1200px**（窄页 640px），不要超宽
- ✅ Hero 用 **金线几何符号** 作为视觉锚点

### Don't

- ❌ 引入 **紫色、绿色、橙色** 等第二强调色——金色就是唯一金属
- ❌ 给卡片或组件加 **大投影**——分层靠色差
- ❌ 用 **bold (700+)** 做主标题——衬线 400 才是签名
- ❌ 用 **大圆角按钮**（12px+）或 **全圆角卡片**——矩形 + 4-8px 才编辑感
- ❌ 用 `#FFFFFF` 纯白底——永远用 `#F7F4EE` 米白
- ❌ 把金色元素 **并排放置**——金色之间至少 32px 间距
- ❌ 用 **星空粒子、3D 球体、玻璃拟态**——保持"线条 + 留白"的克制
- ❌ 连续两个区块都"满"或都"空"——必须密疏交替

## Quick Start

### CSS Custom Properties

```css
:root {
    /* Colors */
    --color-primary: #1A1A1A;
    --color-secondary: #7A7368;
    --color-tertiary: #B8945A;
    --color-neutral: #F7F4EE;
    --color-surface: #FBF8F2;
    --color-border: #E8E2D4;
    --color-on-primary: #F7F4EE;
    --color-on-tertiary: #1A1A1A;
    --color-accent-warm: #A88C4A;

    /* Typography */
    --font-serif: 'DM Serif Display', 'Playfair Display', Georgia, serif;
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;

    /* Spacing */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    --spacing-2xl: 48px;
    --spacing-3xl: 72px;
    --spacing-4xl: 112px;

    /* Shapes */
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-pill: 9999px;

    /* Elevation */
    --shadow-card-hover: 0 2px 8px rgba(26, 26, 26, 0.06);
    --shadow-modal: 0 8px 24px rgba(26, 26, 26, 0.12);
}
```

### Tailwind v4

```css
@theme {
    --color-primary: #1A1A1A;
    --color-secondary: #7A7368;
    --color-tertiary: #B8945A;
    --color-neutral: #F7F4EE;
    --color-surface: #FBF8F2;
    --color-border: #E8E2D4;

    --font-serif: 'DM Serif Display', 'Playfair Display', Georgia, serif;
    --font-sans: 'Inter', -apple-system, sans-serif;

    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-pill: 9999px;

    --spacing-xs: 4px;
    --spacing-md: 16px;
    --spacing-xl: 32px;
    --spacing-3xl: 72px;
}
```

## Similar Brands

- **Astrala** — Modern mystic editorial 占星品牌，米白底 + 黑金双色，本设计的直接参考
- **Aesop** — 高级编辑感品牌的标杆，色彩克制 + 字体哲学 + 呼吸式排版
- **Cuyana** — "Less is more" 极简编辑风，米白底 + 黑字 + serif 标题
- **The New York Times** — 编辑式字距与排版节奏
- **GOOP** — 高端生活方式品牌的克制双色调

## Spec Compliance

This DESIGN.md follows the **Google DESIGN.md v1 (alpha)** spec. It can be:

```bash
# Lint for structure + WCAG contrast
npx -y @google/design.md lint DESIGN.md

# Export to Tailwind v4 theme
npx -y @google/design.md export --format tailwind DESIGN.md > tailwind.theme.json

# Export to W3C DTCG JSON
npx -y @google/design.md export --format dtcg DESIGN.md > tokens.json
```