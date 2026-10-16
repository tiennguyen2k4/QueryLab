export type AnalyticsEvent = 'lesson_started' | 'query_executed' | 'hint_opened' | 'solution_opened' | 'lab_failed' | 'lab_completed' | 'interview_started' | 'interview_completed' | 'pricing_viewed';
export function track(event: AnalyticsEvent, labId?: string) {
  if (typeof window === 'undefined') return;
  try { const stored = JSON.parse(localStorage.getItem('datalab.events.v1') || '[]'); const entries = Array.isArray(stored) ? stored : []; entries.push({ event, labId, at: new Date().toISOString() }); localStorage.setItem('datalab.events.v1', JSON.stringify(entries.slice(-200))); } catch { /* Analytics must never block learning. */ }
}
