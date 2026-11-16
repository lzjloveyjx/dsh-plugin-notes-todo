import fs from 'node:fs';

const client = fs.readFileSync('client.js', 'utf8');
const harness = fs.readFileSync('scripts/client-check.mjs', 'utf8');

const hooks = harness.slice(harness.indexOf('// ---- hooks'), harness.indexOf('// ---- dom / window'));
let renderer = harness.slice(harness.indexOf('// ---- renderer'), harness.indexOf('// ---- assertions'));
// A classic <script> has no top-level await: drop the harness's own paint call.
renderer = renderer.slice(0, renderer.indexOf('let tree = await paint();'));

const driver = [
  'window.__ModuleLoader__ = { load({ factory }) { window.__exports = factory((n) => { if (n === "react") return React; throw new Error("require " + n); }); } };',
  'const ctx = { slots: { register: (meta, comp) => { if (meta.name === "main") window.__exports.main = comp; return () => {}; }, inject: (s, fn) => { fn(); return () => {}; } }, layout: { selectPanel: () => {} }, get: () => undefined, inject: () => {}, effect: (fn) => { fn(); return () => {}; } };',
].join('\n');

const tail = fs.readFileSync('scripts/card-driver.js', 'utf8');

const html = '<!doctype html><meta charset="utf-8"><body style="margin:0;background:#0d141c">'
  + '<script>' + hooks + driver + renderer + '<\/script>'
  + '<script>' + client + '<\/script>'
  + '<script>' + tail + '<\/script>'
  + '</body>';
fs.writeFileSync('card.html', html);
console.log('wrote card.html', html.length);
