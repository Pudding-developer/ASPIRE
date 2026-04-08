/**
 * useGithubData — Fetches GitHub connection status, repos, contributions, and summary.
 *
 * Usage:
 *   const { status, summary, repos, contributions, loading, error, refetch, runAnalysis, connectGithub, disconnectGithub, isDisconnecting } = useGithubData();
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { githubApi } from '../../../services/githubApi';

export default function useGithubData() {
  const [status, setStatus]             = useState(null);   // { connected, github_username, ... }
  const [summary, setSummary]           = useState(null);   // profile stats, top languages
  const [repos, setRepos]               = useState([]);
  const [contributions, setContributions] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Analysis polling
  const [analysisJobId, setAnalysisJobId] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState(null); // { status, percentage, current_step }
  const pollRef = useRef(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusRes = await githubApi.getStatus();
      const statusData = statusRes.data;
      setStatus(statusData);

      // Only fetch details if connected and has analysis
      if (statusData.connected && statusData.has_analysis) {
        const [summaryRes, reposRes, contribRes] = await Promise.all([
          githubApi.getSummary(),
          githubApi.getRepositories(),
          githubApi.getContributions(),
        ]);
        setSummary(summaryRes.data);
        setRepos(reposRes.data);
        setContributions(contribRes.data);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Start a new analysis and poll for completion
  const runAnalysis = useCallback(async () => {
    try {
      setAnalysisStatus({ status: 'starting', percentage: 0, current_step: 'Starting analysis...' });
      const res = await githubApi.startAnalysis();
      const jobId = res.data.job_id;
      setAnalysisJobId(jobId);

      // Poll every 2 seconds
      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await githubApi.getAnalysisStatus(jobId);
          const job = pollRes.data;
          setAnalysisStatus(job);

          if (job.status === 'completed' || job.status === 'complete' || job.status === 'failed') {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setAnalysisJobId(null);
            if (job.status === 'completed' || job.status === 'complete') fetchAll();
          }
        } catch {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }, 2000);
    } catch (e) {
      setAnalysisStatus({ status: 'failed', error: e.message });
    }
  }, [fetchAll]);

  // Connect logic
  const connectGithub = useCallback(async () => {
    try {
      const res = await githubApi.getConnectUrl();
      if (res?.data?.auth_url) {
        window.location.href = res.data.auth_url;
      }
    } catch (e) {
      setError(e.message);
    }
  }, []);

  // Disconnect logic
  const disconnectGithub = useCallback(async () => {
    setIsDisconnecting(true);
    try {
      await githubApi.disconnect();
      setStatus({ connected: false });
      setSummary(null);
      setRepos([]);
      setContributions(null);
      setAnalysisStatus(null);
      setAnalysisJobId(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsDisconnecting(false);
    }
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  return {
    status,
    summary,
    repos,
    contributions,
    loading,
    error,
    refetch: fetchAll,
    runAnalysis,
    analysisStatus,
    isAnalyzing: !!analysisJobId,
    connectGithub,
    disconnectGithub,
    isDisconnecting,
  };
}
