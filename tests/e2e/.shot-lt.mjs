import { chromium } from '@playwright/test';
const [,, url, out, js] = process.argv;
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
p.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text()); });
await p.goto(url); await p.waitForTimeout(4000);
const r = await p.evaluate(js);
console.log('eval:', JSON.stringify(r));
await p.waitForTimeout(5000);
const clicks = (process.argv[5]||'').split(';').filter(Boolean);
for (const c of clicks) { if (c==='esc') await p.keyboard.press('Escape'); else { const [x,y]=c.split(',').map(Number); await p.mouse.click(x,y);} await p.waitForTimeout(1500); }
await p.screenshot({ path: out });
await b.close();
