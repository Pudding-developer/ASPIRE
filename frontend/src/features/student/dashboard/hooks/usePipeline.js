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

  // Result modal state — set when a job finishes, cleared by the view
  const [pipelineResult, setPipelineResult] = useState(null);
  const clearPipelineResult = useCallback(() => setPipelineResult(null), []);

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

  // Start pipeline and poll for completion. Pass { force: true } to bypass
  // the cache when nothing has changed since the last run.
  const runPipeline = useCallback(async ({ force = false } = {}) => {
    if (!studentId) return;
    try {
      setPipelineStatus({ status: 'starting', percentage: 0, current_step: 'Starting pipeline...' });
      setPipelineResult(null);
      setError(null);
      const res = await pipelineApi.run(studentId, { force });
      const newJobId = res.data.job_id;
      setJobId(newJobId);

      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await pipelineApi.getStatus(newJobId);
          const job = pollRes.data;
          setPipelineStatus(job);

          if (job.status === 'completed' || job.status === 'failed') {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setJobId(null);

            if (job.status === 'failed') {
              const errMsg = job.error || 'The AI pipeline encountered an error. Please try again.';
              setError(errMsg);
              setPipelineResult({ outcome: 'error', message: errMsg });
            } else {
              // Completed — distinguish between a real new report and a cache hit
              const noChange = job.current_step === 'No new data — returning previous report';
              setPipelineResult({
                outcome: noChange ? 'no_change' : 'success',
                message: null, // view builds the copy
              });
              fetchReports();
            }
          }
        } catch {
          clearInterval(pollRef.current);
          pollRef.current = null;
          const networkErr = 'Lost connection to the analysis server. Please check your network.';
          setError(networkErr);
          setPipelineResult({ outcome: 'error', message: networkErr });
          setJobId(null);
        }
      }, 3000);
    } catch (e) {
      const msg = String(e.message || '');
      if (msg.includes('409')) {
        setPipelineStatus(null);
        setError('A previous analysis is still running. Please wait a moment and try again.');
      } else {
        setPipelineStatus({ status: 'failed', error: msg });
        setError(`Failed to start AI Pipeline: ${msg}`);
        setPipelineResult({ outcome: 'error', message: `Failed to start AI Pipeline: ${msg}` });
      }
    }
  }, [studentId, fetchReports]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const cancelPipeline = useCallback(async () => {
    if (!studentId) return;
    try {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      setJobId(null);
      setPipelineStatus(null);
      await pipelineApi.cancel(studentId);
    } catch (e) {
      console.error("Error cancelling pipeline:", e);
    }
  }, [studentId]);

  return {
    report,
    allReports,
    loading,
    error,
    runPipeline,
    pipelineStatus,
    isRunning: !!jobId,
    refetch: fetchReports,
    pipelineResult,
    clearPipelineResult,
    cancelPipeline,
  };
}
