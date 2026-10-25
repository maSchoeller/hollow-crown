import { chromium } from '@playwright/test';
const [,, url, outPrefix, js, n, step] = process.argv;
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await p.goto(url); await p.waitForTimeout(4000);
p.evaluate(js);
for (let i = 0; i < Number(n); i++) { await p.waitForTimeout(Number(step)); await p.screenshot({ path: `${outPrefix}${i}.png` }); }
await b.close();
