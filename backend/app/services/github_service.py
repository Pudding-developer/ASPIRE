"""
github_service.py — GitHub OAuth + data-fetching business logic.

Uses github_repository for all DB access. No direct queries.
"""
import json
import secrets
import base64
from datetime import datetime, date

import httpx

from app.core.config import GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI
from app.models.github import RepositoryCache
from app.repositories import github_repository
from app.services import activity_service

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

GITHUB_GRAPHQL_URL = "https://api.github.com/graphql"
GITHUB_REST_URL = "https://api.github.com"
GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"

_github_oauth_states: set[str] = set()


# ---------------------------------------------------------------------------
# OAuth helpers
# ---------------------------------------------------------------------------

import urllib.parse

def build_github_auth_url(user_id: int) -> str:
    state = f"{user_id}:{secrets.token_urlsafe(16)}"
    _github_oauth_states.add(state)
    params = urllib.parse.urlencode({
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": GITHUB_REDIRECT_URI,
        "scope": "read:user repo",
        "state": state,
    })
    return f"{GITHUB_AUTH_URL}?{params}"


def validate_and_pop_state(state: str) -> int | None:
    if state in _github_oauth_states:
        _github_oauth_states.discard(state)
        parts = state.split(":", 1)
        if len(parts) == 2:
            try:
                return int(parts[0])
            except ValueError:
                return None
    return None


async def exchange_code_for_token(code: str) -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            GITHUB_TOKEN_URL,
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": GITHUB_REDIRECT_URI,
            },
            headers={"Accept": "application/json"},
        )
    if resp.status_code != 200:
        raise Exception("Failed to exchange code with GitHub.")
    data = resp.json()
    token = data.get("access_token")
    if not token:
        raise Exception(data.get("error_description", "GitHub token exchange failed."))
    return token


# ---------------------------------------------------------------------------
# GitHub API fetchers
# ---------------------------------------------------------------------------

async def fetch_github_user(token: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GITHUB_REST_URL}/user",
            headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"},
        )
    if resp.status_code != 200:
        raise Exception("Failed to fetch GitHub user profile.")
    return resp.json()


_STUDENT_GRAPHQL_QUERY = """
query GetStudentData {
  viewer {
    name
    bio
    avatarUrl
    createdAt
    followers { totalCount }
    repositories(
      first: 30
      orderBy: { field: UPDATED_AT, direction: DESC }
    ) {
      nodes {
        name
        nameWithOwner
        description
        stargazerCount
        forkCount
        isPrivate
        pushedAt
        primaryLanguage { name color }
        languages(first: 10) {
          edges { size node { name color } }
        }
        repositoryTopics(first: 10) {
          nodes { topic { name } }
        }
        defaultBranchRef {
          target {
            ... on Commit {
              history { totalCount }
            }
          }
        }
      }
    }
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes {
        ... on Repository {
          name
          nameWithOwner
        }
      }
    }
    contributionsCollection {
      totalCommitContributions
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
    }
  }
}
"""


async def fetch_student_github_data(username: str, token: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            GITHUB_GRAPHQL_URL,
            json={"query": _STUDENT_GRAPHQL_QUERY},
            headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
        )
    if resp.status_code != 200:
        raise Exception(f"GitHub GraphQL request failed: {resp.status_code}")
    body = resp.json()
    if "errors" in body:
        raise Exception(f"GitHub GraphQL errors: {body['errors']}")
    return body["data"]


async def fetch_file_contents(owner: str, repo: str, path: str, token: str) -> str | None:
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{GITHUB_REST_URL}/repos/{owner}/{repo}/contents/{path}",
                headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"},
            )
        if resp.status_code != 200:
            return None
        data = resp.json()
        content = data.get("content", "")
        return base64.b64decode(content).decode("utf-8", errors="replace")
    except Exception:
        return None


async def fetch_github_events(username: str, token: str) -> list[dict]:
    """Fetches the last ~90 events (3 pages) from the public events API."""
    events = []
    try:
        async with httpx.AsyncClient() as client:
            for page in range(1, 11):
                resp = await client.get(
                    f"{GITHUB_REST_URL}/users/{username}/events",
                    params={"per_page": 30, "page": page},
                    headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"},
                )
                if resp.status_code != 200:
                    break
                
                page_events = resp.json()
                if not page_events:
                    break
                events.extend(page_events)
    except Exception:
        pass
    return events


async def fetch_dependencies(owner: str, repo: str, token: str) -> dict:
    deps: dict[str, list[str]] = {}

    try:
        raw = await fetch_file_contents(owner, repo, "package.json", token)
        if raw:
            pkg = json.loads(raw)
            npm_deps = list((pkg.get("dependencies") or {}).keys())
            npm_deps += list((pkg.get("devDependencies") or {}).keys())
            if npm_deps:
                deps["npm"] = npm_deps
    except Exception:
        pass

    try:
        raw = await fetch_file_contents(owner, repo, "requirements.txt", token)
        if raw:
            pip_deps = []
            for line in raw.splitlines():
                line = line.strip()
                if line and not line.startswith("#"):
                    name = line.split("==")[0].split(">=")[0].split("<=")[0].split("~=")[0].split("!=")[0].strip()
                    if name:
                        pip_deps.append(name)
            if pip_deps:
                deps["pip"] = pip_deps
    except Exception:
        pass

    try:
        raw = await fetch_file_contents(owner, repo, "pom.xml", token)
        if raw:
            import re
            artifact_ids = re.findall(r"<artifactId>\s*(.+?)\s*</artifactId>", raw)
            if artifact_ids:
                deps["maven"] = artifact_ids
    except Exception:
        pass

    try:
        raw = await fetch_file_contents(owner, repo, "pubspec.yaml", token)
        if raw:
            in_deps = False
            dart_deps = []
            for line in raw.splitlines():
                stripped = line.strip()
                if stripped == "dependencies:":
                    in_deps = True
                    continue
                if in_deps:
                    if not line.startswith(" ") and not line.startswith("\t"):
                        break
                    if ":" in stripped:
                        dep_name = stripped.split(":")[0].strip()
                        if dep_name and not dep_name.startswith("#"):
                            dart_deps.append(dep_name)
            if dart_deps:
                deps["dart"] = dart_deps
    except Exception:
        pass

    return deps


# ---------------------------------------------------------------------------
# Streak calculation
# ---------------------------------------------------------------------------

async def calculate_streak(calendar_data: list) -> dict:
    all_days: list[dict] = []
    for week in calendar_data:
        for day in week.get("contributionDays", []):
            all_days.append(day)

    all_days.sort(key=lambda d: d["date"])

    if not all_days:
        return {"current_streak": 0, "longest_streak": 0}

    today = date.today()
    longest_streak = 0
    streak = 0

    for day_info in all_days:
        if day_info["contributionCount"] > 0:
            streak += 1
            if streak > longest_streak:
                longest_streak = streak
        else:
            streak = 0

    current_streak = 0
    for day_info in reversed(all_days):
        day_date = date.fromisoformat(day_info["date"])
        if day_date > today:
            continue
        if day_info["contributionCount"] > 0:
            current_streak += 1
        else:
            break

    return {"current_streak": current_streak, "longest_streak": longest_streak}


# ---------------------------------------------------------------------------
# Callback logic
# ---------------------------------------------------------------------------

async def connect_github_account(db, user_id: int, gh_user: dict, access_token: str) -> tuple[dict, bool]:
    """
    Create or update a GithubProfile for the given user.
    Returns (response_data, is_new).
    """
    from fastapi import HTTPException, status

    github_username = gh_user.get("login", "")

    # Check if GitHub account is linked to a different student
    existing = await github_repository.get_profile_by_username(db, github_username)
    if existing and existing.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This GitHub account is already connected to a different student.",
            headers={"X-Error-Code": "GITHUB_ALREADY_LINKED"},
        )

    profile = await github_repository.get_profile(db, user_id)
    is_new = profile is None

    github_created_at = None
    if gh_user.get("created_at"):
        github_created_at = datetime.fromisoformat(gh_user["created_at"].replace("Z", "+00:00")).replace(tzinfo=None)

    if is_new:
        profile = await github_repository.create_profile(
            db,
            user_id=user_id,
            github_username=github_username,
            github_access_token=access_token,
            github_avatar_url=gh_user.get("avatar_url"),
            github_bio=gh_user.get("bio"),
            public_repos_count=gh_user.get("public_repos", 0),
            followers_count=gh_user.get("followers", 0),
            github_created_at=github_created_at,
            connected_at=datetime.now(),
        )
    else:
        profile = await github_repository.update_profile(
            db, user_id,
            github_username=github_username,
            github_access_token=access_token,
            github_avatar_url=gh_user.get("avatar_url"),
            github_bio=gh_user.get("bio"),
            public_repos_count=gh_user.get("public_repos", 0),
            followers_count=gh_user.get("followers", 0),
        )

    return {
        "github_username": profile.github_username,
        "github_avatar_url": profile.github_avatar_url,
        "connected": True,
    }, is_new


# ---------------------------------------------------------------------------
# Summary / repositories / contributions helpers
# ---------------------------------------------------------------------------

async def get_summary(db, user_id: int) -> tuple[dict, str]:
    """Returns (summary_data, cached_at_iso)."""
    profile = await github_repository.get_profile(db, user_id)
    if not profile or not profile.last_analyzed:
        return None, None

    contrib = await github_repository.get_contributions(db, user_id)
    repos = await github_repository.get_repos(db, user_id)

    lang_totals: dict[str, int] = {}
    for repo in repos:
        try:
            langs = json.loads(repo.languages_json)
            for lang, size in langs.items():
                lang_totals[lang] = lang_totals.get(lang, 0) + size
        except (json.JSONDecodeError, TypeError):
            pass

    top_language = max(lang_totals, key=lang_totals.get) if lang_totals else None

    data = {
        "github_username": profile.github_username,
        "github_avatar_url": profile.github_avatar_url,
        "total_repos": len(repos),
        "total_commits": contrib.total_commits if contrib else 0,
        "top_language": top_language,
        "current_streak": contrib.current_streak if contrib else 0,
        "longest_streak": contrib.longest_streak if contrib else 0,
        "total_contributions": contrib.total_contributions if contrib else 0,
        "member_since": profile.github_created_at.strftime("%Y-%m-%d") if profile.github_created_at else None,
    }
    return data, profile.last_analyzed.isoformat()


async def get_repositories(db, user_id: int) -> tuple[list[dict], str]:
    """Returns (repo_list, cached_at_iso)."""
    profile = await github_repository.get_profile(db, user_id)
    if not profile or not profile.last_analyzed:
        return None, None

    repos = await github_repository.get_repos(db, user_id)
    data = []
    for repo in repos:
        try:
            languages = json.loads(repo.languages_json)
        except (json.JSONDecodeError, TypeError):
            languages = {}
        try:
            topics = json.loads(repo.topics_json)
        except (json.JSONDecodeError, TypeError):
            topics = []
        try:
            dependencies = json.loads(repo.dependencies_json)
        except (json.JSONDecodeError, TypeError):
            dependencies = {}

        data.append({
            "repo_name": repo.repo_name,
            "repo_full_name": repo.repo_full_name,
            "description": repo.description,
            "primary_language": repo.primary_language,
            "languages": languages,
            "topics": topics,
            "dependencies": dependencies,
            "stargazer_count": repo.stargazer_count,
            "fork_count": repo.fork_count,
            "commit_count": repo.commit_count,
            "is_pinned": repo.is_pinned,
            "pushed_at": repo.pushed_at.isoformat() if repo.pushed_at else None,
        })

    return data, profile.last_analyzed.isoformat()


async def get_contribution_data(db, user_id: int) -> tuple[dict, str]:
    """Returns (contribution_data, cached_at_iso)."""
    profile = await github_repository.get_profile(db, user_id)
    if not profile or not profile.last_analyzed:
        return None, None

    contrib = await github_repository.get_contributions(db, user_id)
    if not contrib:
        return None, None

    try:
        calendar = json.loads(contrib.calendar_json)
    except (json.JSONDecodeError, TypeError):
        calendar = []

    try:
        activities = json.loads(contrib.activities_json) if hasattr(contrib, "activities_json") else []
    except (json.JSONDecodeError, TypeError):
        activities = []

    data = {
        "total_contributions": contrib.total_contributions,
        "total_commits": contrib.total_commits,
        "current_streak": contrib.current_streak,
        "longest_streak": contrib.longest_streak,
        "calendar": calendar,
        "activities": activities,
    }
    return data, contrib.cached_at.isoformat()


# ---------------------------------------------------------------------------
# Background analysis task
# ---------------------------------------------------------------------------

async def run_analysis(job_id: str, user_id: int, session_factory) -> None:
    async with session_factory() as db:
        job = await github_repository.get_job(db, job_id)
        if not job:
            return

        try:
            profile = await github_repository.get_profile(db, user_id)
            if not profile:
                raise Exception("GitHub profile not found.")

            token = profile.github_access_token
            username = profile.github_username

            # Step 1: Fetch via GraphQL
            await github_repository.update_job(
                db, job_id, status="running", current_step=1,
                current_step_label="Fetching repositories...", percentage=15,
            )

            gh_data = await fetch_student_github_data(username, token)
            user_data = gh_data["viewer"]
            repos = user_data["repositories"]["nodes"]
            pinned_names = {
                n["nameWithOwner"]
                for n in (user_data.get("pinnedItems", {}).get("nodes") or [])
            }
            contributions_collection = user_data["contributionsCollection"]
            calendar_weeks = contributions_collection["contributionCalendar"]["weeks"]

            github_created_at = None
            if user_data.get("createdAt"):
                github_created_at = datetime.fromisoformat(user_data["createdAt"].replace("Z", "+00:00")).replace(tzinfo=None)

            await github_repository.update_profile(
                db, user_id,
                github_bio=user_data.get("bio"),
                github_avatar_url=user_data.get("avatarUrl"),
                public_repos_count=len(repos),
                followers_count=user_data.get("followers", {}).get("totalCount", 0),
                github_created_at=github_created_at,
            )

            # Step 2: Fetch dependencies
            await github_repository.update_job(
                db, job_id, current_step=2,
                current_step_label="Reading dependencies...", percentage=35,
            )

            repo_deps: dict[str, dict] = {}
            for repo in repos[:10]:
                full_name = repo["nameWithOwner"]
                owner, repo_name = full_name.split("/", 1)
                deps = await fetch_dependencies(owner, repo_name, token)
                repo_deps[full_name] = deps

            # Step 3: Calculate streaks
            await github_repository.update_job(
                db, job_id, current_step=3,
                current_step_label="Analyzing commit history...", percentage=55,
            )

            streaks = await calculate_streak(calendar_weeks)

            # Step 4: Store in DB
            await github_repository.update_job(
                db, job_id, current_step=4,
                current_step_label="Saving results...", percentage=80,
            )

            await github_repository.delete_repos(db, user_id)
            await github_repository.delete_contributions(db, user_id)

            now = datetime.now()
            repo_models = []
            for repo in repos:
                full_name = repo["nameWithOwner"]
                languages = {}
                for edge in (repo.get("languages", {}).get("edges") or []):
                    languages[edge["node"]["name"]] = edge["size"]

                topics = [
                    n["topic"]["name"]
                    for n in (repo.get("repositoryTopics", {}).get("nodes") or [])
                ]

                commit_count = 0
                default_ref = repo.get("defaultBranchRef")
                if default_ref and default_ref.get("target"):
                    commit_count = default_ref["target"].get("history", {}).get("totalCount", 0)

                pushed_at = None
                if repo.get("pushedAt"):
                    pushed_at = datetime.fromisoformat(repo["pushedAt"].replace("Z", "+00:00")).replace(tzinfo=None)

                repo_models.append(RepositoryCache(
                    user_id=user_id,
                    repo_name=repo["name"],
                    repo_full_name=full_name,
                    description=repo.get("description"),
                    primary_language=(repo.get("primaryLanguage") or {}).get("name"),
                    languages_json=json.dumps(languages),
                    topics_json=json.dumps(topics),
                    dependencies_json=json.dumps(repo_deps.get(full_name, {})),
                    stargazer_count=repo.get("stargazerCount", 0),
                    fork_count=repo.get("forkCount", 0),
                    commit_count=commit_count,
                    is_pinned=full_name in pinned_names,
                    pushed_at=pushed_at,
                    cached_at=now,
                ))

            await github_repository.save_repos(db, repo_models)

            # --- Timeline Events Fetch ---
            events_data = await fetch_github_events(username, token)
            
            # Clean up and keep only supported events to save space
            relevant_events = []
            for ev in events_data:
                etype = ev.get("type")
                if etype in ["PushEvent", "CreateEvent", "PullRequestEvent", "IssuesEvent"]:
                    # strip payload to minimal info
                    simplified = {
                        "id": ev.get("id"),
                        "type": etype,
                        "created_at": ev.get("created_at"),
                        "repo": ev.get("repo", {}).get("name"),
                        "payload": {}
                    }
                    if etype == "PushEvent":
                        simplified["payload"]["size"] = ev.get("payload", {}).get("size", 0)
                        simplified["payload"]["commits"] = [
                            {"message": c.get("message", ""), "sha": c.get("sha")}
                            for c in ev.get("payload", {}).get("commits", [])[:3]
                        ]
                    elif etype == "CreateEvent":
                        simplified["payload"]["ref_type"] = ev.get("payload", {}).get("ref_type")
                    elif etype == "PullRequestEvent":
                        simplified["payload"]["action"] = ev.get("payload", {}).get("action")
                        simplified["payload"]["title"] = ev.get("payload", {}).get("pull_request", {}).get("title")
                        simplified["payload"]["number"] = ev.get("payload", {}).get("number")
                        try:
                            simplified["payload"]["head_ref"] = ev.get("payload", {}).get("pull_request", {}).get("head", {}).get("ref")
                        except Exception:
                            pass
                    
                    relevant_events.append(simplified)

            calendar = contributions_collection["contributionCalendar"]
            flat_days = []
            for week in calendar_weeks:
                for day in week.get("contributionDays", []):
                    flat_days.append(day)

            await github_repository.save_contributions(
                db,
                user_id=user_id,
                total_contributions=calendar.get("totalContributions", 0),
                total_commits=contributions_collection.get("totalCommitContributions", 0),
                current_streak=streaks["current_streak"],
                longest_streak=streaks["longest_streak"],
                calendar_json=json.dumps(flat_days),
                activities_json=json.dumps(relevant_events),
                cached_at=now,
            )

            # Step 5: Finalize
            await github_repository.update_job(
                db, job_id, current_step=5,
                current_step_label="Finalizing...", percentage=95,
            )

            await github_repository.update_profile(db, user_id, last_analyzed=now)

            await github_repository.update_job(
                db, job_id, status="completed", percentage=100,
                completed_at=datetime.now(),
            )

            await activity_service.emit_github_synced(
                db, student_id=user_id, repo_count=len(repos),
            )
            await db.commit()

        except Exception as exc:
            await github_repository.update_job(
                db, job_id, status="failed", error=str(exc),
                completed_at=datetime.now(),
            )
