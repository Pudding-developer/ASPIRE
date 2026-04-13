import { useState, useEffect } from 'react';
import { Star, GitFork, BookOpen, ExternalLink, RefreshCw } from 'lucide-react';

/* ─── Language color map ─── */
const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', HTML: '#e34c26',
  CSS: '#563d7c', Python: '#3572A5', Java: '#b07219', Dart: '#00B4AB',
  Ruby: '#701516', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
  PHP: '#4F5D95', Rust: '#dea584', Go: '#00ADD8', Kotlin: '#A97BFF',
  Swift: '#F05138', Vue: '#41b883', 'Jupyter Notebook': '#DA5B0B',
  Shell: '#89e051', Dockerfile: '#384d54', SCSS: '#c6538c',
  Code: '#8b949e',
};
const getLangColor = (lang) => LANG_COLORS[lang] || '#8b949e';

export default function RelatedRepositories({ userRepos }) {
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerms, setSearchTerms] = useState({ lang: null, topic: null });

  useEffect(() => {
    if (!userRepos || userRepos.length === 0) {
      setLoading(false);
      return;
    }

    // 1. Extract top language
    const langCounts = {};
    const topicCounts = {};

    userRepos.forEach(r => {
      if (r.primary_language) {
        langCounts[r.primary_language] = (langCounts[r.primary_language] || 0) + 1;
      }
      if (r.topics && Array.isArray(r.topics)) {
        r.topics.forEach(t => {
          topicCounts[t] = (topicCounts[t] || 0) + 1;
        });
      }
    });

    const topLang = Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    
    // Ignore generic topics that might break search or be too broad
    const ignoredTopics = ['assignment', 'project', 'homework', 'test'];
    const topTopic = Object.entries(topicCounts)
      .filter(([t]) => !ignoredTopics.includes(t.toLowerCase()))
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    if (!topLang && !topTopic) {
      setLoading(false);
      return;
    }

    setSearchTerms({ lang: topLang, topic: topTopic });

    let queryParts = [];
    if (topLang) queryParts.push(`language:${encodeURIComponent(topLang)}`);
    if (topTopic) queryParts.push(`topic:${encodeURIComponent(topTopic)}`);
    
    // Exclude user's own repos natively via GitHub API
    const username = userRepos[0]?.repo_full_name?.split('/')[0];
    if (username) queryParts.push(`-user:${username}`);

    const q = queryParts.join('+');

    setLoading(true);
    fetch(`https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=4`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch recommendations');
        return res.json();
      })
      .then(data => {
        setRelated(data.items || []);
        setError(null);
      })
      .catch(err => {
        console.error("Related repos error:", err);
        setError("Unable to load recommended repositories at this time.");
      })
      .finally(() => setLoading(false));

  }, [userRepos]);

  if (!userRepos || userRepos.length === 0) return null;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 mt-6">
      <div className="flex flex-col mb-5">
        <h3 className="text-[15px] font-bold text-[#c9d1d9] flex items-center gap-2">
          <BookOpen size={16} className="text-[#8b949e]" />
          Related Repositories
        </h3>
        <p className="text-[12px] text-[#8b949e] mt-1">
          Based on your codebase 
          {searchTerms.lang && <span className="font-medium text-[#c9d1d9]"> ({searchTerms.lang})</span>}
          {searchTerms.topic && <span> and topic <span className="font-medium text-[#c9d1d9]">'{searchTerms.topic}'</span></span>}.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw size={20} className="text-[#8b949e] animate-spin" />
        </div>
      ) : error ? (
        <p className="text-center text-[#ff7b72] text-[13px] py-4">{error}</p>
      ) : related.length === 0 ? (
        <p className="text-center text-[#8b949e] text-[13px] py-4">No related repositories found.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {related.map(repo => (
            <div key={repo.id} className="border border-[#30363d] bg-[#0d1117] rounded-xl p-4 flex flex-col gap-2 hover:border-[#8b949e] transition-colors relative group">
              <div className="flex items-start justify-between gap-2">
                <a href={repo.html_url} target="_blank" rel="noreferrer" className="text-[14px] font-semibold text-[#58a6ff] hover:underline leading-tight truncate pr-6">
                  {repo.full_name}
                </a>
                <a href={repo.html_url} target="_blank" rel="noreferrer" className="absolute right-4 top-4 text-[#8b949e] opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#c9d1d9]">
                  <ExternalLink size={14} />
                </a>
              </div>

              {repo.topics?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {repo.topics.slice(0, 3).map(t => (
                    <span key={t} className="text-[10px] font-medium bg-[#1158c71a] text-[#58a6ff] px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              )}

              <p className="text-[12px] text-[#8b949e] leading-relaxed line-clamp-2 flex-1">
                {repo.description || 'No description provided.'}
              </p>

              <div className="flex items-center justify-between mt-auto pt-2">
                <div className="flex items-center gap-3 text-[12px] text-[#8b949e]">
                  <span className="flex items-center gap-1">
                    <Star size={12} /> {repo.stargazers_count > 1000 ? (repo.stargazers_count/1000).toFixed(1) + 'k' : repo.stargazers_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork size={12} /> {repo.forks_count > 1000 ? (repo.forks_count/1000).toFixed(1) + 'k' : repo.forks_count}
                  </span>
                </div>
                {repo.language && (
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#8b949e]">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getLangColor(repo.language) }} />
                    {repo.language}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
