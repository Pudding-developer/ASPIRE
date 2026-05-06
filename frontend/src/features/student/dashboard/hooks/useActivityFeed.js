import { useState, useEffect, useCallback, useRef } from 'react';
import { studentService } from '../../../../services/studentService';

const DEFAULT_POLL_MS = 30000;

export default function useActivityFeed(limit = 3, { pollMs = DEFAULT_POLL_MS } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const latestSilent = useRef(false);

  const fetchFeed = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    latestSilent.current = silent;
    setError(null);
    try {
      const res = await studentService.getActivityFeed(limit, false);
      setItems(res.data || []);
    } catch (e) {
      // Silent polls shouldn't surface errors; keep last-known-good state.
      if (!silent) setError(e.message || 'Failed to load activity');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [limit]);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  // Poll while the tab is visible. Pauses when the tab is hidden so we don't
  // burn requests on a backgrounded page.
  useEffect(() => {
    if (!pollMs) return;

    let id = null;
    const start = () => {
      stop();
      id = setInterval(() => fetchFeed({ silent: true }), pollMs);
    };
    const stop = () => {
      if (id != null) { clearInterval(id); id = null; }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchFeed({ silent: true });
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchFeed, pollMs]);

  return { items, loading, error, refetch: fetchFeed };
}
