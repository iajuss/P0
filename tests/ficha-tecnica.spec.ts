// Teste da seção "Ficha técnica". NÃO EDITAR depois do commit-base: ele é o critério de aceite.
// Rodar:  npx playwright test tests/ficha-tecnica.spec.ts --reporter=line
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(__dirname, '..');
const SECTION = '[data-testid="ficha-tecnica"]';
const VIEWPORTS = [{ width: 360, height: 800 }, { width: 390, height: 844 }];
const MIN_SPECS = 6;
const MIN_FONT_PX = 14;

test.describe.configure({ mode: 'serial' });

let server: http.Server; let base = '';
const failures: string[] = [];
let specsCount = 0;
let faqOk = false;

test.beforeAll(async () => {
  server = http.createServer((req, res) => {
    const f = path.join(ROOT, req.url === '/' ? 'index.html' : decodeURIComponent((req.url || '').split('?')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise<void>(r => server.listen(0, '127.0.0.1', () => r()));
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});
test.afterAll(() => server.close());

for (const vp of VIEWPORTS) {
  const tag = `${vp.width}x${vp.height}`;
  test(`ficha técnica em ${tag}`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(base + '/index.html', { waitUntil: 'load' });
    const sec = page.locator(SECTION);
    const fail = (m: string) => { failures.push(`[${tag}] ${m}`); };

    // 1. existe, com título visível "Ficha técnica"
    if ((await sec.count()) !== 1) { fail(`seção ${SECTION} encontrada ${await sec.count()}x (esperado 1)`); await ctx.close(); return; }
    await sec.scrollIntoViewIfNeeded();
    // espera qualquer animação de entrada terminar (nenhum ancestral com opacity < 1)
    await page.waitForFunction(sel => { let e: Element | null = document.querySelector(sel); while (e) { if (+getComputedStyle(e).opacity < 1) return false; e = e.parentElement; } return true; }, SECTION, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const heading = sec.getByRole('heading', { name: 'Ficha técnica' });
    if (!(await heading.first().isVisible().catch(() => false))) fail('título "Ficha técnica" não está visível');

    // 2. 6+ itens [data-spec], cada um com rótulo e valor não vazios
    const specs = await sec.locator('[data-spec]').evaluateAll(els => els.map(e => ({
      label: (e.querySelector('[data-label]')?.textContent || '').trim(),
      value: (e.querySelector('[data-value]')?.textContent || '').trim(),
    })));
    specsCount = specs.length;
    if (specs.length < MIN_SPECS) fail(`itens [data-spec]: ${specs.length} (mín. ${MIN_SPECS})`);
    specs.forEach((s, i) => { if (!s.label || !s.value) fail(`[data-spec] #${i + 1} com rótulo ou valor vazio (label="${s.label}", value="${s.value}")`); });

    // 3. sem rolagem horizontal
    const sw = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    if (sw.sw > sw.cw) fail(`rolagem horizontal: scrollWidth ${sw.sw} > clientWidth ${sw.cw}`);

    // 4. nenhum rótulo/valor cortado, sem reticências
    const clipped = await sec.locator('[data-spec] [data-label], [data-spec] [data-value]').evaluateAll(els => els.flatMap(e => {
      const cs = getComputedStyle(e), out: string[] = [];
      if (e.scrollWidth > e.clientWidth) out.push(`scrollWidth ${e.scrollWidth} > clientWidth ${e.clientWidth}`);
      if (e.scrollHeight > e.clientHeight) out.push(`scrollHeight ${e.scrollHeight} > clientHeight ${e.clientHeight}`);
      if (cs.textOverflow === 'ellipsis') out.push('text-overflow: ellipsis');
      return out.length ? [`"${(e.textContent || '').trim().slice(0, 40)}": ${out.join(', ')}`] : [];
    }));
    clipped.forEach(c => fail(`texto cortado ${c}`));

    // 5. nenhum texto da seção com font-size < 14px
    const small = await sec.evaluate((root, min) => {
      const out: string[] = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        if (!(n.textContent || '').trim()) continue;
        const el = n.parentElement!; if (['SCRIPT', 'STYLE'].includes(el.tagName)) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < min) out.push(`"${(n.textContent || '').trim().slice(0, 30)}": ${fs}px`);
      }
      return out;
    }, MIN_FONT_PX);
    small.forEach(s => fail(`font-size < ${MIN_FONT_PX}px ${s}`));

    // 6. axe-core só na seção: zero violações de color-contrast
    const axe = await new AxeBuilder({ page }).include(SECTION).withRules(['color-contrast']).analyze();
    axe.violations.forEach(v => v.nodes.forEach(n => fail(`axe color-contrast: ${n.html.slice(0, 80)} | ${(n.any[0]?.message || '').slice(0, 110)}`)));

    await ctx.close();
  });
}

test('FAQ continua passando (tests/faq-animation.spec.ts)', async () => {
  test.setTimeout(240_000);
  try {
    const out = execSync('npx playwright test tests/faq-animation.spec.ts --reporter=line', { cwd: ROOT, encoding: 'utf-8', stdio: 'pipe', timeout: 220_000 });
    faqOk = /RESULTADO: (\d+)\/\1 perguntas passaram/.test(out);
    if (!faqOk) failures.push('[faq] saída sem "RESULTADO: N/N perguntas passaram"');
  } catch (e: any) {
    failures.push(`[faq] tests/faq-animation.spec.ts falhou: ${String(e.stdout || e.message).split('\n').filter((l: string) => /RESULTADO|Critérios|  - /.test(l)).slice(0, 4).join(' || ').slice(0, 400)}`);
  }
});

test('resultado final', async () => {
  const lines: string[] = [''];
  if (failures.length) { lines.push('Critérios que falharam:'); failures.forEach(f => lines.push('  - ' + f)); }
  const ok = failures.length === 0;
  lines.push(ok
    ? `RESULTADO: ficha-tecnica OK em ${VIEWPORTS.map(v => `${v.width}x${v.height}`).join(' e ')} | specs=${specsCount} | faq OK`
    : `RESULTADO: ficha-tecnica FALHOU (${failures.length} problemas) | specs=${specsCount} | faq ${faqOk ? 'OK' : 'FALHOU'}`);
  process.stdout.write(lines.join('\n') + '\n');
  expect(failures, 'ver "Critérios que falharam" acima').toEqual([]);
});
