import React from 'react'
import { useRoadmap } from '../hooks/useRoadmap'
import './RoadmapViewer.css'

/* ─── Skeleton ──────────────────────────────────────────────────── */
function RoadmapSkeleton() {
  return (
    <div className="rm-skeleton">
      {[1, 2, 3].map((g) => (
        <div key={g} className="rm-skeleton-group">
          <div className="rm-skeleton-header" />
          <div className="rm-skeleton-pills">
            {[1, 2, 3, 4].map((p) => (
              <div key={p} className="rm-skeleton-pill" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Node pill ─────────────────────────────────────────────────── */
function NodePill({ node }) {
  const { label } = node

  return (
    <div className="rm-pill rm-pill--none">
      <span className="rm-pill__label">{label}</span>
    </div>
  )
}

/* ─── Readiness bar ─────────────────────────────────────────────── */
function ReadinessBar({ pct, change, daysSince, firstRun }) {
  return (
    <div className="rm-readiness">
      <div className="rm-readiness__bar-track">
        <div
          className="rm-readiness__bar-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="rm-readiness__labels">
        <span className="rm-readiness__pct">{pct}% career readiness</span>
        {!firstRun && change !== 0 && (
          <span className={`rm-readiness__delta ${change > 0 ? 'rm-readiness__delta--up' : ''}`}>
            {change > 0 ? `+${change}%` : `${change}%`} since last report
            {daysSince !== null && ` (${daysSince}d ago)`}
          </span>
        )}
      </div>
    </div>
  )
}

/* ─── Main component ────────────────────────────────────────────── */
export default function RoadmapViewer({ careerTitle }) {
  const { roadmap, loading, error } = useRoadmap(careerTitle)

  if (!careerTitle) {
    return (
      <div className="rm-empty">
        <span className="rm-empty__icon">🗺️</span>
        <p className="rm-empty__title">Select a career path to view your roadmap</p>
      </div>
    )
  }

  if (loading) return <RoadmapSkeleton />

  if (error) {
    return (
      <div className="rm-empty">
        <span className="rm-empty__icon">⚠️</span>
        <p className="rm-empty__title">{error}</p>
      </div>
    )
  }

  if (!roadmap) return null

  const {
    career,
    roadmap_url,
    readiness_percentage,
    readiness_change,
    days_since_last_report,
    first_run,
    next_milestone,
    motivational_insight,
    nodes = [],
  } = roadmap

  const groups = nodes.reduce((acc, node) => {
    const g = node.group || 'Other'
    if (!acc[g]) acc[g] = []
    acc[g].push(node)
    return acc
  }, {})

  return (
    <div className="rm-viewer rm-viewer--boxed">

      <div className="rm-header">
        <div className="rm-header__top">
          <h2 className="rm-header__career">{career}</h2>
          {!first_run && (
            <a
              className="rm-header__link"
              href={roadmap_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              roadmap.sh ↗
            </a>
          )}
        </div>

        {first_run ? (
          <p className="rm-header__cta">
            Generate your career report to see your personalised roadmap overlay.
            All {nodes.length} skills are shown — complete your report to unlock progress tracking.
          </p>
        ) : null}

        <ReadinessBar
          pct={readiness_percentage}
          change={readiness_change}
          daysSince={days_since_last_report}
          firstRun={first_run}
        />
      </div>



      {next_milestone && next_milestone.skill && (
        <div className="rm-milestone-card">
          <div className="rm-milestone-card__header">⚡ Next milestone</div>
          <div className="rm-milestone-card__skill">Learn {next_milestone.skill}</div>
          {next_milestone.impact && (
            <div className="rm-milestone-card__impact">{next_milestone.impact}</div>
          )}
          {next_milestone.estimated_weeks !== undefined && (
            <div className="rm-milestone-card__weeks">
              Estimated: {next_milestone.estimated_weeks} week{next_milestone.estimated_weeks !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      <div className="rm-groups">
        {Object.entries(groups).map(([groupName, groupNodes]) => (
          <div key={groupName} className="rm-group">
            <h3 className="rm-group__title">{groupName}</h3>
            <div className="rm-group__pills">
              {groupNodes.map((node) => (
                <NodePill key={node.id} node={node} />
              ))}
            </div>
          </div>
        ))}
      </div>



      {motivational_insight && (
        <div className="rm-insight">
          <p className="rm-insight__quote">💬 "{motivational_insight}"</p>
          <p className="rm-insight__attribution">— ASPIRE Career Coach</p>
        </div>
      )}

      <div className="rm-footer">
        <a
          className="rm-footer__btn"
          href={roadmap_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          View Full Roadmap on roadmap.sh →
        </a>
      </div>

    </div>
  )
}
