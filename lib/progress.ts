'use client';
import { useEffect, useState } from 'react';

export type Progress = { version: 1; completed: Record<string, { at: string; xp: number; solutionUsed: boolean }>; bookmarks: string[]; activeDays: string[] };
const KEY = 'datalab.progress.v1';
const blank = (): Progress => ({ version: 1, completed: {}, bookmarks: [], activeDays: [] });
let sessionProgress: Progress = blank();
function validProgress(p: unknown): p is Progress {
  if (!p || typeof p !== 'object') return false;
  const value = p as Progress;
  return value.version === 1 && value.completed !== null && typeof value.completed === 'object' && !Array.isArray(value.completed)
    && Object.entries(value.completed).every(([id,entry]) => /^[a-z]+-\d{3}$/.test(id) && entry && typeof entry.at === 'string' && Number.isFinite(Date.parse(entry.at)) && typeof entry.xp === 'number' && Number.isFinite(entry.xp) && entry.xp >= 0 && entry.xp <= 1000 && typeof entry.solutionUsed === 'boolean')
    && Array.isArray(value.bookmarks) && value.bookmarks.every(id => typeof id === 'string' && /^[a-z]+-\d{3}$/.test(id))
    && Array.isArray(value.activeDays) && value.activeDays.every(day => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day));
}
function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function readProgress(): Progress {
  if (typeof window === 'undefined') return blank();
  try { const raw = localStorage.getItem(KEY); if (raw === null) return sessionProgress; const p = JSON.parse(raw); if (validProgress(p)) { sessionProgress = p; return p; } } catch { return sessionProgress; }
  sessionProgress = blank(); return sessionProgress;
}
function save(p: Progress) {
  sessionProgress = p;
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* Progress stays available for this session. */ }
  window.dispatchEvent(new CustomEvent('datalab-progress', { detail: p }));
}
export function completeLab(id: string, solutionUsed: boolean, baseXp = 100) {
  const p = readProgress();
  if (!p.completed[id]) p.completed[id] = { at: new Date().toISOString(), xp: solutionUsed ? Math.min(40, baseXp) : baseXp, solutionUsed };
  if (!p.activeDays.includes(today())) p.activeDays.push(today());
  save(p); return p;
}
export function bookmarkLab(id: string) { const p = readProgress(); p.bookmarks = p.bookmarks.includes(id) ? p.bookmarks.filter(x => x !== id) : [...p.bookmarks, id]; save(p); }
export function clearProgress() { save(blank()); }
export function streak(p: Progress) {
  const active = new Set(p.activeDays); const d = new Date(); let n = 0;
  if (!active.has(today())) d.setDate(d.getDate()-1);
  for (let i=0; i<366; i++) { const day = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; if (!active.has(day)) break; n++; d.setDate(d.getDate()-1); }
  return n;
}
export function useProgress() {
  const [progress, setProgress] = useState<Progress>(blank);
  useEffect(() => { setProgress(readProgress()); const refresh = (e: Event) => setProgress((e as CustomEvent<Progress>).detail || readProgress()); window.addEventListener('datalab-progress', refresh); window.addEventListener('storage', refresh); return () => {window.removeEventListener('datalab-progress', refresh);window.removeEventListener('storage', refresh);}; }, []);
  return progress;
}
