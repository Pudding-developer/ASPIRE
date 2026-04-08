import { useState, useMemo } from 'react';

// Helpers
const getMonthYear = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
};

const getMonthTimestamp = (dateStr) => {
  const d = new Date(dateStr);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
};

export default function ContributionActivity({ activities = [], onClickShowMore, showAll = false }) {
  const groupedEvents = useMemo(() => {
    const groups = {};
    
    // Sort activities latest first
    const sorted = [...activities].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    sorted.forEach((event) => {
      const monthYear = getMonthYear(event.created_at);
      const timestamp = getMonthTimestamp(event.created_at);
      if (!groups[monthYear]) {
        groups[monthYear] = {
          monthYear,
          timestamp,
          commitsByRepo: {},
          createdRepos: [],
          prsByRepo: {}
        };
      }
      
      const group = groups[monthYear];
      const repoName = event.repo;

      if (event.type === 'PushEvent') {
        const count = event.payload?.size || 0;
        if (!group.commitsByRepo[repoName]) group.commitsByRepo[repoName] = 0;
        group.commitsByRepo[repoName] += count;
      } else if (event.type === 'CreateEvent' && event.payload?.ref_type === 'repository') {
        if (!group.createdRepos.includes(repoName)) {
          group.createdRepos.push(repoName);
        }
      } else if (event.type === 'PullRequestEvent' && event.payload?.action === 'opened') {
        if (!group.prsByRepo[repoName]) group.prsByRepo[repoName] = 0;
        group.prsByRepo[repoName] += 1;
      }
    });

    return Object.values(groups).sort((a, b) => b.timestamp - a.timestamp);
  }, [activities]);

  if (!activities || activities.length === 0) {
    return null;
  }

  // Only show the latest 2 months in the widget by default (the rest goes in the modal)
  const displayGroups = showAll ? groupedEvents : groupedEvents.slice(0, 2);

  return (
    <div className={showAll ? "mt-4" : "mt-8"}>
      {!showAll && <h3 className="text-[16px] font-semibold text-[#c9d1d9] mb-4">Contribution activity</h3>}

      <div className="relative">
        {/* Timeline vertical line */}
        <div className="absolute left-[15px] top-4 bottom-8 w-[2px] bg-[#30363d] z-0"></div>

        {displayGroups.map((group) => {
          const commitReposCount = Object.keys(group.commitsByRepo).length;
          const totalCommits = Object.values(group.commitsByRepo).reduce((a, b) => a + b, 0);

          const totalReposCreated = group.createdRepos.length;

          const prReposCount = Object.keys(group.prsByRepo).length;
          const totalPrs = Object.values(group.prsByRepo).reduce((a, b) => a + b, 0);

          if (commitReposCount === 0 && totalReposCreated === 0 && prReposCount === 0) {
            return null;
          }

          return (
            <div key={group.monthYear} className="mb-8 relative z-10">
              {/* Month Header */}
              <div className="flex items-center gap-4 mb-4">
                <span className="text-[12px] font-semibold text-[#c9d1d9] bg-[#0d1117] py-1">{group.monthYear}</span>
                <div className="h-[1px] bg-[#30363d] flex-grow mt-1 max-w-[200px]"></div>
              </div>

              <div className="space-y-6">
                
                {/* Commits */}
                {commitReposCount > 0 && (
                  <div className="flex gap-4">
                    <div className="mt-1 w-8 h-8 rounded-full bg-[#161b22] border border-[#30363d] flex items-center justify-center flex-shrink-0 relative z-10">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="#8b949e">
                        <path fillRule="evenodd" d="M1.5 3.25a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM4.5 3.25a.75.75 0 10-1.5 0 .75.75 0 001.5 0zm0 9.5a.75.75 0 10-1.5 0 .75.75 0 001.5 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[14px] text-[#c9d1d9] mb-3">Created {totalCommits} commit{totalCommits > 1 ? 's' : ''} in {commitReposCount} repositor{commitReposCount > 1 ? 'ies' : 'y'}</h4>
                      <div className="space-y-2">
                        {Object.entries(group.commitsByRepo).map(([repo, count]) => (
                          <div key={repo} className="flex items-center justify-between group">
                            <span className="text-[13px] text-[#58a6ff] hover:underline cursor-pointer">{repo}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[12px] text-[#8b949e]">{count} commit{count !== 1 ? 's' : ''}</span>
                              <div className="w-24 h-2 bg-[#2ea043] rounded-full opacity-80" style={{ width: `${Math.max(10, Math.min(100, count * 5))}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pull Requests */}
                {prReposCount > 0 && (
                  <div className="flex gap-4">
                    <div className="mt-1 w-8 h-8 rounded-full bg-[#161b22] border border-[#30363d] flex items-center justify-center flex-shrink-0 relative z-10">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="#8b949e">
                        <path fillRule="evenodd" d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1.5 1.5 0 011.5 1.5v5.628a2.251 2.251 0 101.5 0V5.5A3 3 0 0011 2.5zm0 9.5a.75.75 0 10-1.5 0 .75.75 0 001.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"></path>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[14px] text-[#c9d1d9] mb-3">Opened {totalPrs} pull request{totalPrs > 1 ? 's' : ''} in {prReposCount} repositor{prReposCount > 1 ? 'ies' : 'y'}</h4>
                      <div className="space-y-2">
                        {Object.entries(group.prsByRepo).map(([repo, count]) => (
                          <div key={repo} className="flex items-center justify-between group">
                            <span className="text-[13px] text-[#58a6ff] hover:underline cursor-pointer">{repo}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[12px] text-[#8b949e]">{count} PR{count !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Repositories created */}
                {totalReposCreated > 0 && (
                  <div className="flex gap-4">
                    <div className="mt-1 w-8 h-8 rounded-full bg-[#161b22] border border-[#30363d] flex items-center justify-center flex-shrink-0 relative z-10">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="#8b949e">
                        <path fillRule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[14px] text-[#c9d1d9] mb-3">Created {totalReposCreated} repositor{totalReposCreated > 1 ? 'ies' : 'y'}</h4>
                      <div className="space-y-2">
                        {group.createdRepos.map((repo) => (
                          <div key={repo} className="flex items-center justify-between group">
                            <span className="text-[13px] text-[#58a6ff] hover:underline cursor-pointer flex items-center gap-2">
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="#8b949e"><path fillRule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"></path></svg>
                              {repo}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>

      {!showAll && groupedEvents.length > 2 && (
        <button 
          onClick={onClickShowMore}
          className="w-full mt-4 py-2 border border-[#30363d] rounded-md text-[13px] font-medium text-[#58a6ff] hover:bg-[#30363d] transition-colors"
        >
          Show more activity
        </button>
      )}
    </div>
  );
}
