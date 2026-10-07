// Teste de animação do FAQ no celular. NÃO EDITAR depois do commit-base: ele é o critério de aceite.
// Rodar:  npm run test:faq        (exit code 0 só se TODAS as perguntas passarem)
import { test, expect } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const VIEWPORT = { width: 390, height: 844 };
const THROTTLE = 4;                 // CPU 4x
const SAMPLES = 3;                  // ciclos abrir+fechar por pergunta
const WINDOW_MS = 600;              // janela de amostragem após cada clique
const L = {
  durMin: 150, durMax: 400,         // ms, do clique até a altura parar de mudar
  minFrames: 5,                     // frames intermediários (altura/opacidade) e do conteúdo abaixo
  minFps: 55, maxFrame: 50, slowFrame: 20, maxSlow: 2,
  reducedMaxMs: 50,                 // com prefers-reduced-motion: duração <= 50 ms (desativada) ou <= metade da normal
};

let server: http.Server; let base = '';
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

// ---- código que roda na página ----
const pageSide = () => {
  const w = window as any;
  w.__start = (i: number) => {
    const d = document.querySelectorAll('.faq details')[i] as HTMLElement;
    const p = d.querySelector('p') as HTMLElement, foot = document.querySelector('footer') as HTMLElement;
    const rec: any = { frames: [], click: null, anims: new Set<string>(), stop: false };
    d.querySelector('summary')!.addEventListener('click', (e: any) => { if (rec.click === null) rec.click = e.timeStamp; }, { capture: true, once: true });
    const loop = (t: number) => {
      rec.frames.push({ t, h: d.getBoundingClientRect().height, f: foot.getBoundingClientRect().top + scrollY, o: +getComputedStyle(p).opacity });
      document.getAnimations().forEach((a: any) => {
        const el = a.effect && a.effect.target;
        if (el && el.closest && el.closest('.faq')) rec.anims.add((a.transitionProperty || a.animationName || 'anim') + (a.effect.pseudoElement ? ' ' + a.effect.pseudoElement : ''));
      });
      if (!rec.stop) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    w.__rec = rec;
  };
  w.__stop = () => { const r = w.__rec; r.stop = true; return { frames: r.frames, click: r.click, anims: [...r.anims] }; };
  w.__state = (i: number) => {
    const d = document.querySelectorAll('.faq details')[i] as HTMLElement;
    const p = d.querySelector('p') as HTMLElement, sm = d.querySelector('summary') as HTMLElement;
    const r = p.getBoundingClientRect();
    const cv = (p as any).checkVisibility({ opacityProperty: true, visibilityProperty: true });
    return { open: (d as HTMLDetailsElement).open, cv, extra: Math.round(d.getBoundingClientRect().height - sm.getBoundingClientRect().height), onScreen: cv && r.bottom > 0 && r.top < innerHeight, text: !!p.textContent!.trim() };
  };
  w.__scrollTo = (i: number) => {
    const s = document.querySelectorAll('.faq summary')[i];
    scrollTo({ top: s.getBoundingClientRect().top + scrollY - 220, behavior: 'instant' as ScrollBehavior });
  };
};

const median = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const analyse = ({ frames, click, anims }: any) => {
  const before = frames.filter((f: any) => f.t < click).at(-1) ?? frames[0];
  const after = frames.filter((f: any) => f.t >= click && f.t <= click + WINDOW_MS);
  const last = after.at(-1);
  const between = (v: number, a: number, b: number, e: number) => v > Math.min(a, b) + e && v < Math.max(a, b) - e;
  const interH = after.filter((f: any) => between(f.h, before.h, last.h, .5) || (Math.abs(last.o - before.o) > .02 && between(f.o, before.o, last.o, .02))).length;
  const interF = after.filter((f: any) => between(f.f, before.f, last.f, .5)).length;
  let dur = 0, prev = before;
  for (const f of after) { if (Math.abs(f.h - prev.h) > .5 || Math.abs(f.f - prev.f) > .5) dur = f.t - click; prev = f; }
  const idx = frames.indexOf(after[0]);
  const deltas = after.map((f: any, k: number) => f.t - frames[idx + k - 1].t).filter(Number.isFinite);
  return {
    dur, interH, interF, anims,
    fps: deltas.length / (last.t - frames[idx - 1].t) * 1000,
    maxFrame: Math.max(...deltas), slow: deltas.filter((d: number) => d > L.slowFrame).length,
  };
};

async function measure(browser: any, reduce: boolean) {
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: reduce ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
  await page.goto(base + '/index.html', { waitUntil: 'load' });
  await page.addScriptTag({ content: `(${pageSide})()` });
  await page.evaluate(() => document.querySelector('#faq')!.scrollIntoView({ behavior: 'instant' as ScrollBehavior }));
  await page.waitForFunction(() => document.querySelector('#faq .rv.in'));
  await page.waitForTimeout(1500);
  const titles: string[] = await page.$$eval('.faq summary', els => els.map(e => (e.textContent || '').trim()));
  const out: any[] = [];
  for (let i = 0; i < titles.length; i++) {
    const sum = page.locator('.faq summary').nth(i);
    const dirs: any = { open: [], close: [] };
    for (let n = 0; n < SAMPLES; n++) {
      await page.evaluate(i => (window as any).__scrollTo(i), i);
      await page.waitForTimeout(300);
      for (const dir of ['open', 'close']) {
        await page.evaluate(i => (window as any).__start(i), i);
        await sum.click();
        await page.waitForTimeout(WINDOW_MS + 150);
        const raw = analyse(await page.evaluate(() => (window as any).__stop()));
        dirs[dir].push({ ...raw, state: await page.evaluate(i => (window as any).__state(i), i) });
      }
    }
    out.push({ q: titles[i], ...dirs });
  }
  const css = await page.evaluate(() => {
    const d = document.querySelector('.faq details')!, s = d.querySelector('summary')!, p = d.querySelector('p')!;
    const pick = (el: Element, ps?: string) => { const c = getComputedStyle(el, ps); return `${c.transitionProperty} ${c.transitionDuration}`; };
    return { details: pick(d), summary: pick(s), p: pick(p), after: pick(s, '::after'), content: pick(d, '::details-content') };
  });
  await ctx.close();
  return { rows: out, css };
}

test('FAQ: animação de abrir/fechar no celular', async ({ browser }) => {
  test.setTimeout(300_000);
  const normal = await measure(browser, false);
  const reduced = await measure(browser, true);
  const total = normal.rows.length;
  const f1 = (n: number) => n.toFixed(1);
  let passed = 0;
  const lines: string[] = [];
  lines.push('');
  lines.push('pergunta | abriu | fechou | dur abrir/fechar (ms, pior amostra) | frames interm. abrir/fechar (pior) | frames conteúdo abaixo (pior) | FPS (pior) | maior frame (ms) | frames>20ms (pior) | reduced-motion (ms) | passou');
  const details: string[] = [];
  normal.rows.forEach((r: any, i: number) => {
    const opens: any[] = r.open, closes: any[] = r.close, all = [...opens, ...closes];
    const okOpen = opens.every(s => s.state.open && s.state.extra > 20 && s.state.cv && s.state.onScreen && s.state.text);
    const okClose = closes.every(s => !s.state.open && !s.state.cv && s.state.extra < 2);
    const fails: string[] = [];
    for (const [k, arr] of [['abrir', opens], ['fechar', closes]] as const) {
      const durs = arr.map((s: any) => s.dur);
      if (Math.min(...durs) < L.durMin || Math.max(...durs) > L.durMax) fails.push(`duração ao ${k}: ${durs.map(f1).join('/')} ms (alvo ${L.durMin}–${L.durMax})`);
      const ih = Math.min(...arr.map((s: any) => s.interH)); if (ih < L.minFrames) fails.push(`frames intermediários ao ${k}: ${ih} (mín. ${L.minFrames})`);
      const iff = Math.min(...arr.map((s: any) => s.interF)); if (iff < L.minFrames) fails.push(`frames do conteúdo abaixo ao ${k}: ${iff} (mín. ${L.minFrames})`);
      const fps = Math.min(...arr.map((s: any) => s.fps)); if (fps < L.minFps) fails.push(`FPS ao ${k}: ${f1(fps)} (mín. ${L.minFps})`);
      const mf = Math.max(...arr.map((s: any) => s.maxFrame)); if (mf > L.maxFrame) fails.push(`maior frame ao ${k}: ${f1(mf)} ms (máx. ${L.maxFrame})`);
      const sl = Math.max(...arr.map((s: any) => s.slow)); if (sl > L.maxSlow) fails.push(`frames >${L.slowFrame} ms ao ${k}: ${sl} (máx. ${L.maxSlow})`);
    }
    // prefers-reduced-motion: animação desativada ou encurtada
    const rr = reduced.rows[i] as any;
    const rDur = Math.max(...[...rr.open, ...rr.close].map((s: any) => s.dur));
    const nDur = Math.min(...[...opens, ...closes].map((s: any) => s.dur));
    if (!(rDur <= L.reducedMaxMs || rDur <= nDur / 2)) fails.push(`reduced-motion: ${f1(rDur)} ms (normal ${f1(nDur)} ms; precisa ≤ ${L.reducedMaxMs} ms ou ≤ metade)`);
    const pass = okOpen && okClose && fails.length === 0;
    if (!okOpen) fails.push('não abriu/visível');
    if (!okClose) fails.push('não fechou');
    if (pass) passed++;
    const m = (arr: any[], k: string, fn: (...a: number[]) => number) => fn(...arr.map(s => s[k]));
    lines.push([
      r.q, okOpen ? 'sim' : 'não', okClose ? 'sim' : 'não',
      `${f1(Math.max(...opens.map((s: any) => s.dur)))}/${f1(Math.max(...closes.map((s: any) => s.dur)))}`,
      `${m(opens, 'interH', Math.min)}/${m(closes, 'interH', Math.min)}`,
      `${m(opens, 'interF', Math.min)}/${m(closes, 'interF', Math.min)}`,
      f1(Math.min(...all.map((s: any) => s.fps))), f1(Math.max(...all.map((s: any) => s.maxFrame))),
      String(Math.max(...all.map((s: any) => s.slow))), f1(rDur), pass ? 'PASSOU' : 'FALHOU',
    ].join(' | '));
    if (fails.length) details.push(`  - ${r.q}: ${fails.join('; ')}`);
  });
  const animated = [...new Set(normal.rows.flatMap((r: any) => [...r.open, ...r.close].flatMap((s: any) => s.anims)))];
  lines.push('');
  lines.push(`Animações ativas no FAQ: ${animated.join(', ') || 'nenhuma'}`);
  lines.push(`transition computado: ${JSON.stringify(normal.css)}`);
  if (details.length) { lines.push('Critérios que falharam:'); lines.push(...details); }
  lines.push(`RESULTADO: ${passed}/${total} perguntas passaram | throttle ${THROTTLE}x | ${VIEWPORT.width}x${VIEWPORT.height}`);
  process.stdout.write(lines.join('\n') + '\n');
  expect(passed, `RESULTADO: ${passed}/${total}`).toBe(total);
});
