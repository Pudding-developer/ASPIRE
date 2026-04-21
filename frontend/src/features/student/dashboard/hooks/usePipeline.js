/**
 * usePipeline — Runs the AI career-mapping pipeline and fetches reports.
 *
 * Usage:
 *   const { report, allReports, runPipeline, pipelineStatus, isRunning, loading, error } = usePipeline(studentId);
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { pipelineApi } from '../../../../services/pipelineApi';

export default function usePipeline(studentId) {
  const [report, setReport]         = useState(null);   // latest career report
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  // Pipeline run polling
  const [jobId, setJobId]               = useState(null);
  const [pipelineStatus, setPipelineStatus] = useState(null);
  const pollRef = useRef(null);
  const pollFailuresRef = useRef(0);
  const MAX_CONSECUTIVE_POLL_FAILURES = 20; // ~60s of continuous failure before giving up

  // Fetch existing reports on mount
  const fetchReports = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await pipelineApi.getReport(studentId);
      setReport(res.data);
    } catch (e) {
      // 404 = no report yet, not an error
      if (!e.message.includes('404')) setError(e.message);
    }
    try {
      const res = await pipelineApi.getAllReports(studentId);
      setAllReports(res.data);
    } catch {
      // ignore — allReports is optional
    }
    setLoading(false);
  }, [studentId]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // Start pipeline and poll for completion
  const runPipeline = useCallback(async () => {
    if (!studentId) return;
    try {
      setPipelineStatus({ status: 'starting', percentage: 0, current_step: 'Starting pipeline...' });
      setError(null);
      const res = await pipelineApi.run(studentId);
      const newJobId = res.data.job_id;
      setJobId(newJobId);
      pollFailuresRef.current = 0;

      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await pipelineApi.getStatus(newJobId);
          const job = pollRes.data;
          pollFailuresRef.current = 0;
          setPipelineStatus(job);

          if (job.status === 'completed' || job.status === 'failed') {
            clearInterval(pollRef.current);
            pollRef.current = null;
            if (job.status === 'failed') {
               setError(job.error || 'The AI pipeline encountered an error. Please try again.');
            }
            setJobId(null);
            if (job.status === 'completed') fetchReports();
          }
        } catch {
          pollFailuresRef.current += 1;
          if (pollFailuresRef.current >= MAX_CONSECUTIVE_POLL_FAILURES) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setError('Lost connection to the analysis server. Please check your network.');
            setJobId(null);
          }
        }
      }, 3000);
    } catch (e) {
      setPipelineStatus({ status: 'failed', error: e.message });
      setError(`Failed to start AI Pipeline: ${e.message}`);
    }
  }, [studentId, fetchReports]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  return {
    report,
    allReports,
    loading,
    error,
    runPipeline,
    pipelineStatus,
    isRunning: !!jobId,
    refetch: fetchReports,
  };
}
