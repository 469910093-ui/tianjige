# 妙搭 ZIP 导入说明（今天吃什么 · 天机食鉴）

依据官方文档：[基于导入新建应用](https://bytedance.larkoffice.com/wiki/WTDrwPAmPiKgFqklO2cchAJMnvc)

## 官方边界（已遵守）

- 导入来源：压缩包文件（前端项目代码）
- 体积：**< 50 MB**（本包不含 `node_modules` / `.next`）
- 数据库结构/记录：**不会**随代码导入（本项目也无本地 DB）
- 复杂外部依赖：尽量使用常规 npm 包；导入后由妙搭助手前置校验
- 密钥：不打包 `.env.local`，请在妙搭环境变量中另行配置

## 导入步骤

1. 打开飞书 **妙搭** → **导入新建应用** → **从 ZIP 文件导入**
2. 上传本压缩包：`tianjige-miaoda-import.zip`
3. 等待妙搭助手前置校验通过
4. 在环境变量中配置（按需）：
   - `DEEPSEEK_API_KEY`（白话报告；无 Key 时走本地降级 mock）
   - `BAIDU_MAP_AUTH_TOKEN`（推荐，Agent Plan 附近真实商家）
   - 或 `BAIDU_MAP_AK` / `TENCENT_MAP_KEY`（备选）
5. 启动 / 发布应用

## 包内结构（解压后根目录即项目根）

```text
package.json          # Next.js 前端项目
.coze                 # 平台构建/运行配置
src/                  # 页面、引擎、合盘与附近商家
public/
scripts/
DESIGN.md             # 天机食鉴设计规范（米白编辑感）
docs/ui-mockup.html   # 静态预览（可选）
.env.example          # 环境变量模板（无密钥）
```

## 产品入口

- `/` 首页（天机食鉴视觉）
- `/unified` 多人合盘测算 + 附近落座 + 破冰游戏

## 本地自检（可选）

```bash
pnpm install
pnpm dev
```

打开 `/unified` 填写生辰测算；附近商家需配置地图 Token/Key，否则展示诚实标注的虚拟推荐。
