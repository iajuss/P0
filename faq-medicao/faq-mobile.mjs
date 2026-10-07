// Medição da seção FAQ no celular. Só mede e relata; não altera a página.
// Uso (nesta pasta):  npm i  &&  node faq-mobile.mjs
// Saída: results.json, results.md e screens/*.png
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');                 // pasta com o index.html
const VIEWPORT = { width: 390, height: 844 };
const WINDOW_MS = 600;                                 // janela de amostragem após o clique
const LIMITS = { durMin: 150, durMax: 400, minFrames: 5, minFps: 55, maxFrame: 50, slowFrame: 20, maxSlow: 2 };

fs.mkdirSync(path.join(HERE, 'screens'), { recursive: true });

// servidor estático mínimo (o painel/Chrome não precisa de file://)
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const URL = `http://127.0.0.1:${server.address().port}/index.html`;

const browser = await chromium.launch();
const browserVersion = browser.version();

// ---------- código que roda dentro da página ----------
const pageSide = () => {
  window.__start = (i) => {
    const d = document.querySelectorAll('.faq details')[i];
    const p = d.querySelector('p'), s = d.querySelector('summary'), foot = document.querySelector('footer');
    const rec = { frames: [], click: null, anims: new Set(), stop: false };
    const onClick = e => { if (rec.click === null) rec.click = e.timeStamp; };
    s.addEventListener('click', onClick, { capture: true, once: true });
    const loop = t => {
      const dr = d.getBoundingClientRect();
      const rot = getComputedStyle(s, '::after').transform;
      rec.frames.push({ t, h: dr.height, f: foot.getBoundingClientRect().top + scrollY, o: +getComputedStyle(p).opacity, rot });
      document.getAnimations().forEach(a => { const el = a.effect && a.effect.target; if (el && el.closest && el.closest('.faq')) rec.anims.add((a.transitionProperty || a.animationName || 'anim') + (a.effect.pseudoElement ? ' ' + a.effect.pseudoElement : '')); });
      if (!rec.stop) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    window.__rec = rec;
  };
  window.__stop = () => {
    const r = window.__rec; r.stop = true;
    return { frames: r.frames, click: r.click, anims: [...r.anims] };
  };
  window.__state = (i) => {
    const d = document.querySelectorAll('.faq details')[i], p = d.querySelector('p'), sm = d.querySelector('summary');
    const r = p.getBoundingClientRect(), cs = getComputedStyle(p);
    const cv = p.checkVisibility({ opacityProperty: true, visibilityProperty: true });   // false se o conteúdo está oculto/ignorado
    const dh = d.getBoundingClientRect().height, sh = sm.getBoundingClientRect().height;
    return { open: d.open, cv, dh: Math.round(dh), sh: Math.round(sh), extra: Math.round(dh - sh), onScreen: cv && r.bottom > 0 && r.top < innerHeight, visible: cv && cs.visibility !== 'hidden' && +cs.opacity > 0, text: p.textContent.trim().length > 0 };
  };
  window.__scrollTo = (i) => {
    const s = document.querySelectorAll('.faq summary')[i];
    scrollTo({ top: s.getBoundingClientRect().top + scrollY - 220, behavior: 'instant' });
  };
};

// ---------- análise dos frames ----------
const analyse = ({ frames, click, anims }) => {
  const before = frames.filter(f => f.t < click).at(-1) ?? frames[0];
  const after = frames.filter(f => f.t >= click && f.t <= click + WINDOW_MS);
  const last = after.at(-1);
  const h0 = before.h, h1 = last.h, f0 = before.f, f1 = last.f, o0 = before.o, o1 = last.o;
  const between = (v, a, b, eps) => v > Math.min(a, b) + eps && v < Math.max(a, b) - eps;
  const interH = after.filter(f => between(f.h, h0, h1, .5) || (Math.abs(o1 - o0) > .02 && between(f.o, o0, o1, .02))).length;
  const interF = after.filter(f => between(f.f, f0, f1, .5)).length;
  const rots = new Set(after.map(f => f.rot));
  let rotEnd = 0, pr = before.rot; for (const f of after) { if (f.rot !== pr) rotEnd = f.t - click; pr = f.rot; }
  let tEnd = 0, prev = before;
  for (const f of after) { if (Math.abs(f.h - prev.h) > .5 || Math.abs(f.f - prev.f) > .5) tEnd = f.t - click; prev = f; }
  const idx = frames.indexOf(after[0]);
  const deltas = after.map((f, k) => f.t - frames[idx + k - 1].t).filter(Number.isFinite);
  const span = last.t - frames[idx - 1].t;
  return {
    dur: +tEnd.toFixed(1), interH, interF, rotFrames: Math.max(0, rots.size - 2), rotDur: +rotEnd.toFixed(1),
    fps: +(deltas.length / span * 1000).toFixed(1), maxFrame: +Math.max(...deltas).toFixed(1),
    slow: deltas.filter(d => d > LIMITS.slowFrame).length, frames: after.length, h0: Math.round(h0), h1: Math.round(h1),
    anims
  };
};


const REPEATS = 3;                                    // ciclos abrir/fechar por pergunta
const median = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

// ---------- uma configuração (throttle x movimento) ----------
async function newPage({ throttle, reduce }) {
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: reduce ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  await page.goto(URL, { waitUntil: 'load' });
  await page.addScriptTag({ content: `(${pageSide})()` });
  await page.evaluate(() => document.querySelector('#faq').scrollIntoView({ behavior: 'instant' }));
  await page.waitForFunction(() => document.querySelector('#faq .rv.in'));
  await page.waitForTimeout(1500);                     // fim do "revelar ao rolar"
  return { ctx, page };
}

async function run({ label, throttle, reduce }) {
  const { ctx, page } = await newPage({ throttle, reduce });
  const cpuProbeMs = await page.evaluate(() => { const t = performance.now(); let x = 0; for (let i = 0; i < 2e7; i++) x += i % 7; return +(performance.now() - t).toFixed(1); });
  const titles = await page.$$eval('.faq summary', els => els.map(e => e.textContent.trim()));
  const rows = [];
  for (let i = 0; i < titles.length; i++) {
    const row = { q: titles[i], cycles: [] };
    const sum = page.locator('.faq summary').nth(i);
    for (let n = 0; n < REPEATS; n++) {
      await page.evaluate(i => window.__scrollTo(i), i);
      await page.waitForTimeout(300);
      const cyc = {};
      for (const dir of ['open', 'close']) {
        await page.evaluate(i => window.__start(i), i);
        await sum.click();                             // um único clique real
        await page.waitForTimeout(WINDOW_MS + 150);
        cyc[dir] = { raw: analyse(await page.evaluate(() => window.__stop())), state: await page.evaluate(i => window.__state(i), i) };
      }
      row.cycles.push(cyc);
    }
    rows.push(row);
  }
  // inventário de CSS animável (computado, na página rodando)
  const css = await page.evaluate(() => {
    const d = document.querySelector('.faq details'), s = d.querySelector('summary'), p = d.querySelector('p');
    const pick = (el, pseudo) => { const c = getComputedStyle(el, pseudo); return `${c.transitionProperty} ${c.transitionDuration} / anim ${c.animationName}`; };
    return { details: pick(d), summary: pick(s), answer: pick(p), icon_after: pick(s, '::after'), details_content: pick(d, '::details-content') };
  });
  await ctx.close();
  return { label, throttle, reduce, cpuProbeMs, rows, css };
}

// screenshots em passada separada, para não interferir nas medições
async function shots() {
  const { ctx, page } = await newPage({ throttle: 4, reduce: false });
  const sum = page.locator('.faq summary').nth(1);
  await page.evaluate(() => window.__scrollTo(1)); await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(HERE, 'screens', '1-fechada.png') });
  await sum.click();
  await page.screenshot({ path: path.join(HERE, 'screens', '2-logo-apos-clique.png') });   // primeiro instante possível após o clique
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(HERE, 'screens', '3-aberta.png') });
  await ctx.close();
}

const configs = [
  { label: 'CPU 4x', throttle: 4, reduce: false },
  { label: 'sem throttling', throttle: 1, reduce: false },
  { label: 'CPU 4x + prefers-reduced-motion', throttle: 4, reduce: true },
  { label: 'sem throttling + prefers-reduced-motion', throttle: 1, reduce: true },
];
const results = [];
for (const c of configs) results.push(await run(c));
await shots();
await browser.close(); server.close();

// ---------- agregação e veredito ----------
const agg = (cycles, dir) => {
  const rs = cycles.map(c => c[dir].raw);
  return {
    dur: median(rs.map(r => r.dur)), interH: Math.max(...rs.map(r => r.interH)), interF: Math.max(...rs.map(r => r.interF)),
    fps: Math.min(...rs.map(r => r.fps)), maxFrame: Math.max(...rs.map(r => r.maxFrame)), slow: Math.max(...rs.map(r => r.slow)),
    rotFrames: Math.max(...rs.map(r => r.rotFrames)), rotDur: median(rs.map(r => r.rotDur)), anims: [...new Set(rs.flatMap(r => r.anims))],
  };
};
const verdict = (a, k) => {
  const f = [];
  if (a.dur < LIMITS.durMin || a.dur > LIMITS.durMax) f.push(`duração ao ${k}: ${a.dur} ms (alvo ${LIMITS.durMin}–${LIMITS.durMax})`);
  if (a.interH < LIMITS.minFrames) f.push(`frames intermediários de altura/opacidade ao ${k}: ${a.interH} (mín. ${LIMITS.minFrames})`);
  if (a.interF < LIMITS.minFrames) f.push(`frames em que o conteúdo abaixo desce ao ${k}: ${a.interF} (mín. ${LIMITS.minFrames})`);
  if (a.fps < LIMITS.minFps) f.push(`FPS médio ao ${k}: ${a.fps} (mín. ${LIMITS.minFps})`);
  if (a.maxFrame > LIMITS.maxFrame) f.push(`maior frame ao ${k}: ${a.maxFrame} ms (máx. ${LIMITS.maxFrame})`);
  if (a.slow > LIMITS.maxSlow) f.push(`frames > ${LIMITS.slowFrame} ms ao ${k}: ${a.slow} (máx. ${LIMITS.maxSlow})`);
  return f;
};
const yn = b => (b ? 'sim' : 'não');
const pv = (await import('playwright/package.json', { with: { type: 'json' } })).default.version;
let md = `# Medição do FAQ no celular\n\nNavegador: Chromium ${browserVersion} via Playwright ${pv}, headless, mobile emulado (isMobile, touch), viewport ${VIEWPORT.width}×${VIEWPORT.height} @2x.\nAmostragem: ${WINDOW_MS} ms após cada clique, via requestAnimationFrame; ${REPEATS} ciclos abrir/fechar por pergunta (duração = mediana; frames intermediários = melhor ciclo; FPS e maior frame = pior ciclo).\n\n`;
for (const r of results) {
  md += `## ${r.label}\n\nSonda de CPU (loop de 2e7 iterações na página): ${r.cpuProbeMs} ms\n\n| pergunta | abriu | fechou | duração abrir/fechar (ms) | frames interm. abrir/fechar | FPS médio (pior) | maior frame (ms) | passou |\n|---|---|---|---|---|---|---|---|\n`;
  const fl = [];
  for (const w of r.rows) {
    w.ok = w.cycles.every(c => c.open.state.open && c.open.state.extra > 20 && c.open.state.onScreen && c.open.state.visible && c.open.state.text);
    w.closed = w.cycles.every(c => !c.close.state.open && !c.close.state.cv && c.close.state.extra < 2);
    w.o = agg(w.cycles, 'open'); w.c = agg(w.cycles, 'close');
    w.fails = [...verdict(w.o, 'abrir'), ...verdict(w.c, 'fechar')];
    w.pass = w.ok && w.closed && w.fails.length === 0;
    md += `| ${w.q} | ${yn(w.ok)} | ${yn(w.closed)} | ${w.o.dur} / ${w.c.dur} | ${w.o.interH} / ${w.c.interH} | ${Math.min(w.o.fps, w.c.fps)} | ${Math.max(w.o.maxFrame, w.c.maxFrame)} | ${w.pass ? 'passou' : 'falhou'} |\n`;
    if (w.fails.length) fl.push(`- ${w.q}: ${w.fails.join('; ')}`);
  }
  md += `\nAnimações ativas dentro do FAQ (document.getAnimations): ${[...new Set(r.rows.flatMap(w => [...w.o.anims, ...w.c.anims]))].join(', ') || 'nenhuma'}\n`;
  md += `Ícone +/× ao abrir: ${r.rows.map(w => `${w.o.rotFrames} frames / ${w.o.rotDur} ms`).join('; ')}\n`;
  md += `Altura do <details> da 1ª pergunta ao abrir: de ${r.rows[0].cycles[0].open.raw.h0}px para ${r.rows[0].cycles[0].open.raw.h1}px, mudança concluída em ${r.rows[0].o.dur} ms\n`;
  md += `CSS computado: ${JSON.stringify(r.css)}\n\n`;
  md += fl.length ? `Critérios que falharam:\n${fl.join('\n')}\n\n` : 'Nenhum critério falhou.\n\n';
}
fs.writeFileSync(path.join(HERE, 'results.json'), JSON.stringify(results, null, 2));
fs.writeFileSync(path.join(HERE, 'results.md'), md);
console.log(md);
