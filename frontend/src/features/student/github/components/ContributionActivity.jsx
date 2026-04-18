import { useState, useMemo } from 'react';

// Helpers
const getMonthTimestamp = (dateStr) => {
  const d = new Date(dateStr);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
};

const getLanguageColor = (lang) => {
  const colors = {
    'JavaScript': '#f1e05a',
    'Python': '#3572A5',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'Dart': '#00B4AB',
    'TypeScript': '#3178c6',
    'Java': '#b07219',
    'C++': '#f34b7d',
    'C': '#555555',
    'C#': '#178600',
    'Ruby': '#701516',
    'Go': '#00ADD8'
  };
  return colors[lang] || '#8b949e';
};

export default function ContributionActivity({ activities = [], repos = [], onClickShowMore, showAll = false }) {
  const groupedEvents = useMemo(() => {
    const groups = {};
    
    // Sort activities latest first
    const sorted = [...activities].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    sorted.forEach((event) => {
      const d = new Date(event.created_at);
      const monthYear = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      const timestamp = getMonthTimestamp(event.created_at);
      if (!groups[monthYear]) {
        groups[monthYear] = {
          monthYear,
          timestamp,
          commitsByRepo: {},
          pushesByRepo: {},
          createdRepos: [],
          prsByRepo: {},
          prDetails: {}
        };
      }
      
      const group = groups[monthYear];
      const repoName = event.repo;

      if (event.type === 'PushEvent') {
        const count = event.payload?.size || 0;
        if (!group.commitsByRepo[repoName]) group.commitsByRepo[repoName] = 0;
        group.commitsByRepo[repoName] += count;
        
        if (!group.pushesByRepo[repoName]) group.pushesByRepo[repoName] = 0;
        group.pushesByRepo[repoName] += 1;
      } else if (event.type === 'CreateEvent' && event.payload?.ref_type === 'repository') {
        if (!group.createdRepos.find(r => r.name === repoName)) {
          group.createdRepos.push({
            name: repoName,
            date: d.toLocaleString('en-US', { month: 'short', day: 'numeric' })
          });
        }
      } else if (event.type === 'PullRequestEvent' && event.payload?.action === 'opened') {
        if (!group.prsByRepo[repoName]) group.prsByRepo[repoName] = 0;
        group.prsByRepo[repoName] += 1;
        
        if (!group.prDetails[repoName]) group.prDetails[repoName] = [];
        group.prDetails[repoName].push({
          title: event.payload?.title || event.payload?.pull_request?.title || null,
          number: event.payload?.number,
          head_ref: event.payload?.head_ref,
          date: d.toLocaleString('en-US', { month: 'short', day: 'numeric' })
        });
      }
    });

    return Object.values(groups).sort((a, b) => b.timestamp - a.timestamp);
  }, [activities]);

  const [expandedBlocks, setExpandedBlocks] = useState({});

  const toggleBlock = (key) => {
    setExpandedBlocks(prev => ({ ...prev, [key]: prev[key] === undefined ? false : !prev[key] }));
  };

  const isExpanded = (key) => expandedBlocks[key] !== false; // Default is true

  if (!activities || activities.length === 0) {
    return null;
  }

  const displayGroups = showAll ? groupedEvents : groupedEvents.slice(0, 2);

  // SVGs matching screenshot natively
  const RepoIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="#8b949e"><path fillRule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/></svg>
  );

  const CommitsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="#8b949e"><path d="M10.5 7.75a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm1.43.75a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 1 1 0-1.5h3.32a4.001 4.001 0 0 1 7.86 0h3.32a.75.75 0 1 1 0 1.5h-3.32Z"/></svg>
  );

  const PRIcon = ({ color = "#8b949e" }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill={color}><path fillRule="evenodd" d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1.5 1.5 0 011.5 1.5v5.628a2.251 2.251 0 101.5 0V5.5A3 3 0 0011 2.5zm0 9.5a.75.75 0 10-1.5 0 .75.75 0 001.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"></path></svg>
  );

  const ToggleArrows = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="#8b949e" className="group-hover:fill-[#58a6ff] cursor-pointer"><path d="M8 2.25L5.75 4.5h4.5L8 2.25zm0 11.5L10.25 11.5h-4.5L8 13.75zM4.75 7.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z"></path></svg>
  );

  const LockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="#8b949e"><path fillRule="evenodd" d="M4 4v2h-.25A1.75 1.75 0 002 7.75v5.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0014 13.25v-5.5A1.75 1.75 0 0012.25 6H12V4a4 4 0 10-8 0zm6.5 2V4a2.5 2.5 0 00-5 0v2h5zM12 7.5h.25a.25.25 0 01.25.25v5.5a.25.25 0 01-.25.25h-8.5a.25.25 0 01-.25-.25v-5.5a.25.25 0 01.25-.25H12z"></path></svg>
  );

  return (
    <div className={showAll ? "mt-4" : "mt-8"}>
      {!showAll && <h3 className="text-[16px] text-[#c9d1d9] mb-4">Contribution activity</h3>}

      <div className="relative pt-2 pb-8">
        {/* Timeline vertical trunk line */}
        <div className="absolute left-[13px] top-6 bottom-0 w-[2px] bg-[#30363d] z-0"></div>

        {displayGroups.map((group) => {
          const commitReposCount = Object.keys(group.commitsByRepo).length;
          const totalCommits = Object.values(group.commitsByRepo).reduce((a, b) => a + b, 0);
          const totalPushes = Object.values(group.pushesByRepo).reduce((a, b) => a + b, 0);

          const totalReposCreated = group.createdRepos.length;

          const prReposCount = Object.keys(group.prsByRepo).length;
          const totalPrs = Object.values(group.prsByRepo).reduce((a, b) => a + b, 0);

          if (commitReposCount === 0 && totalReposCreated === 0 && prReposCount === 0) return null;

          // Compute max commits to scale bars proportionally natively
          const maxCommits = Math.max(...Object.values(group.commitsByRepo));

          return (
            <div key={group.monthYear} className="mb-12 relative z-10 w-full">
              {/* Month Header */}
              <div className="flex items-center gap-4 mb-8 relative">
                <span className="text-[12px] font-semibold text-[#8b949e]">{group.monthYear}</span>
                <div className="h-[1px] bg-[#30363d] w-64 max-w-full"></div>
              </div>

              <div className="space-y-12">
                
                {/* Commits Block */}
                {commitReposCount > 0 && (() => {
                  const title = totalCommits > 0 
                    ? `Created ${totalCommits} commit${totalCommits > 1 ? 's' : ''} in ${commitReposCount} repositor${commitReposCount > 1 ? 'ies' : 'y'}` 
                    : `Pushed ${totalPushes} time${totalPushes > 1 ? 's' : ''} to ${commitReposCount} repositor${commitReposCount > 1 ? 'ies' : 'y'}`;
                  const blockKey = `${group.monthYear}-commits`;
                  const expanded = isExpanded(blockKey);

                  return (
                    <div className="relative mt-2">
                       {/* Icon overlay: mathematically centered on left-[13px] */}
                       <div className="absolute left-[2px] mt-0.5 w-[24px] flex justify-center bg-[#0d1117] py-1 scale-110 z-10 text-[#8b949e]">
                         <CommitsIcon />
                       </div>
                       
                       <div className="ml-10 w-full pr-8">
                         <div className="inline-flex items-center gap-3 group cursor-pointer" onClick={() => toggleBlock(blockKey)}>
                            <h4 className="text-[15px] text-[#c9d1d9] font-normal group-hover:text-[#58a6ff] transition-colors">{title}</h4>
                            <div className={`transition-transform flex items-center ${expanded ? 'rotate-180' : ''}`}>
                               <ToggleArrows />
                            </div>
                         </div>
                         
                         {expanded && (
                           <div className="mt-5 space-y-3">
                             {Object.entries(group.commitsByRepo).sort((a,b)=>b[1]-a[1]).map(([repo, count], i) => (
                               <div key={repo} className="flex items-center">
                                 <div className="flex-1 flex items-baseline gap-2 truncate">
                                   <a className="text-[#58a6ff] hover:underline text-[14px] cursor-pointer">{repo}</a>
                                   <span className="text-[#8b949e] text-[12px] whitespace-nowrap">
                                     {count > 0 ? `${count} commit${count !== 1 ? 's' : ''}` : `${group.pushesByRepo[repo]} push${group.pushesByRepo[repo] !== 1 ? 'es' : ''}`}
                                   </span>
                                 </div>
                                 <div className="w-[150px] shrink-0 mr-4 flex items-center">
                                   {count > 0 && <div className="h-2 rounded-full bg-[#3fb950]" style={{ width: `${Math.max(10, (count / maxCommits) * 100)}%` }}></div>}
                                 </div>
                               </div>
                             ))}
                           </div>
                         )}
                       </div>
                    </div>
                  );
                })()}

                {/* Repositories Created Block */}
                {totalReposCreated > 0 && (() => {
                  const title = `Created ${totalReposCreated} repositor${totalReposCreated > 1 ? 'ies' : 'y'}`;
                  const blockKey = `${group.monthYear}-repos`;
                  const expanded = isExpanded(blockKey);

                  return (
                    <div className="relative mt-2">
                       <div className="absolute left-[2px] mt-0.5 w-[24px] flex justify-center bg-[#0d1117] py-1 scale-110 z-10 text-[#8b949e]">
                         <RepoIcon />
                       </div>
                       
                       <div className="ml-10 w-full pr-8">
                         <div className="inline-flex items-center gap-3 group cursor-pointer" onClick={() => toggleBlock(blockKey)}>
                            <h4 className="text-[15px] text-[#c9d1d9] font-normal group-hover:text-[#58a6ff] transition-colors">{title}</h4>
                            <div className={`transition-transform flex items-center ${expanded ? 'rotate-180' : ''}`}>
                               <ToggleArrows />
                            </div>
                         </div>
                         
                         {expanded && (
                           <div className="mt-5 space-y-4">
                             {group.createdRepos.map((repoObj, i) => {
                               const repoDetails = repos.find(r => r.repo_full_name === repoObj.name);
                               const lang = repoDetails?.primary_language;
                               return (
                                 <div key={repoObj.name} className="flex items-center justify-between">
                                   <div className="flex items-center gap-2 truncate flex-1">
                                     <LockIcon />
                                     <a className="text-[#58a6ff] hover:underline text-[14px] cursor-pointer">{repoObj.name}</a>
                                   </div>
                                   <div className="flex items-center gap-4 text-[#8b949e] text-[12px] shrink-0 min-w-[200px] justify-between">
                                      <div className="flex items-center gap-[6px]">
                                        {lang && (
                                          <>
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getLanguageColor(lang) }}></div>
                                            <span>{lang}</span>
                                          </>
                                        )}
                                      </div>
                                      <span>{repoObj.date}</span>
                                   </div>
                                 </div>
                               );
                             })}
                           </div>
                         )}
                       </div>
                    </div>
                  );
                })()}

                {/* Pull Requests Block */}
                {prReposCount > 0 && (() => {
                  const title = `Opened ${totalPrs} pull request${totalPrs > 1 ? 's' : ''} in ${prReposCount} repositor${prReposCount > 1 ? 'ies' : 'y'}`;
                  const blockKey = `${group.monthYear}-prs`;
                  const expanded = isExpanded(blockKey);

                  return (
                    <div className="relative mt-2">
                       <div className="absolute left-[2px] mt-0.5 w-[24px] flex justify-center bg-[#0d1117] py-1 scale-110 z-10 text-[#8b949e]">
                         <PRIcon />
                       </div>
                       
                       <div className="ml-10 w-full pr-8">
                         <div className="inline-flex items-center gap-3 group cursor-pointer" onClick={() => toggleBlock(blockKey)}>
                            <h4 className="text-[15px] text-[#c9d1d9] font-normal group-hover:text-[#58a6ff] transition-colors">{title}</h4>
                            <div className={`transition-transform flex items-center ${expanded ? 'rotate-180' : ''}`}>
                               <ToggleArrows />
                            </div>
                         </div>
                         
                         {expanded && (
                           <div className="mt-5 space-y-6">
                             {Object.entries(group.prDetails).map(([repo, prs]) => (
                               <div key={repo}>
                                 <div className="flex items-center justify-between mb-4">
                                    <span className="text-[#8b949e] text-[13px]">{repo}</span>
                                    <div className="flex items-center gap-1">
                                      <div className="w-[18px] h-[18px] rounded-full bg-[#3fb950] flex items-center justify-center text-white text-[11px] font-bold">
                                        {prs.length}
                                      </div>
                                      <span className="text-[#8b949e] text-[12px] ml-1">opened</span>
                                    </div>
                                 </div>
                                 <div className="space-y-3">
                                   {prs.map((pr, idx) => (
                                     <div key={idx} className="flex items-start justify-between group/pr">
                                       <div className="flex items-start gap-2 truncate mr-4">
                                         <div className="mt-[2px] shrink-0 text-[#a371f7]">
                                           <PRIcon color="#a371f7"/>
                                         </div>
                                         <a className="text-[#c9d1d9] text-[13px] hover:text-[#58a6ff] hover:underline cursor-pointer truncate">
                                           {pr.title || (pr.head_ref ? `Update ${pr.head_ref}` : (pr.number ? `Pull Request #${pr.number}` : 'Unknown PR'))}
                                         </a>
                                       </div>
                                       <span className="text-[#8b949e] text-[12px] shrink-0">{pr.date}</span>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             ))}
                           </div>
                         )}
                       </div>
                    </div>
                  );
                })()}

              </div>
            </div>
          );
        })}
      </div>

      {!showAll && groupedEvents.length > 2 && (
        <button 
          onClick={onClickShowMore}
          className="w-full mt-4 py-1.5 border border-[#30363d] rounded-md text-[13px] font-medium text-[#58a6ff] hover:bg-[#30363d] transition-colors cursor-pointer"
        >
          Show more activity
        </button>
      )}
    </div>
  );
}
