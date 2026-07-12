/**
 * 部署 docs → ShipStatic，并挂到固定域名 fused-fog-x4f4urx（不换对外链接）
 *
 * 用法：
 *   $env:SHIP_API_KEY="ship-...." ; node scripts/deploy-shipstatic.mjs
 *
 * Key：https://my.shipstatic.com → Settings → API key
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const DOMAIN = 'tianjige.shipstatic.com';
const PUBLIC_URL = `https://${DOMAIN}/`;

const apiKey = (process.env.SHIP_API_KEY || '').trim();
if (!apiKey) {
  console.error('缺少 SHIP_API_KEY。到 https://my.shipstatic.com 复制后：');
  console.error('  $env:SHIP_API_KEY="ship-...." ; node scripts/deploy-shipstatic.mjs');
  console.error(`对外链接保持不变：${PUBLIC_URL}`);
  process.exit(1);
}

function run(args) {
  const r = spawnSync('npx', ['-y', '@shipstatic/ship', ...args, '--api-key', apiKey], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: true,
  });
  const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
  if (out) console.log(out);
  if (r.status !== 0) {
    console.error('命令失败:', args.join(' '));
    process.exit(r.status || 1);
  }
  return out;
}

console.log('1) 上传 docs …');
const uploadOut = run(['./docs', '-q']);
const deployment = (uploadOut.split(/\r?\n/).filter(Boolean).pop() || '').trim();
if (!deployment) {
  console.error('未拿到 deployment id');
  process.exit(1);
}
console.log('deployment:', deployment);

console.log(`2) 域名指向 ${DOMAIN} → ${deployment} …`);
run(['domains', 'set', DOMAIN, deployment]);

console.log(`\n完成。对外链接未变：\n${PUBLIC_URL}`);
