# Business Context

**User:** Fantasy Basketball League Player
**Purpose:** Analyze player performance, evaluate matchups, and make data-driven lineup decisions

## Pre-Workshop Setup

**API Key Required:** You must register for a free BALLDONTLIE API key before the workshop.

1. Visit https://www.balldontlie.io
2. Click "Get Started" and create a free account
3. Navigate to your dashboard to find your API key
4. Save it somewhere safe—you'll need it during the workshop

**Rate Limits:** Free tier has reasonable limits for workshop use. Be mindful of rapid testing—batch your requests when possible.

## Background

I play in a competitive fantasy basketball league with friends. Every week involves tough decisions:
- Who should I start based on upcoming matchups?
- Which players are trending up or down?
- Are any of my bench players worth starting over my regulars?
- Who should I target on the waiver wire?

I spend hours manually checking stats, reading articles, and second-guessing myself. I want an agent that understands my roster, league rules, and preferences—then gives me clear, data-backed recommendations.

## Why This Project?

**For Data Analytics Students:** This project showcases the analytical thinking that makes sports analytics such an exciting field. You'll work with real performance data, calculate meaningful metrics, and translate statistical patterns into actionable insights.

| Learning Focus | Data Analytics Connection |
|----------------|--------------------------|
| Statistical Analysis | Player efficiency ratings, per-game averages, shooting percentages |
| Trend Detection | Identifying hot streaks, slumps, and breakout performances |
| Multi-factor Decision Making | Weighing matchups, recent form, injury status, and usage rates |
| Predictive Reasoning | Using historical patterns to project future performance |
| Constraint Optimization | Roster construction with position limits and salary caps |

**API Authentication Pattern:** BALLDONTLIE uses API key authentication via Authorization header—a common pattern for modern REST APIs. This is the same pattern used by many professional data services.

## Pain Points

| Pain Point | Impact |
|------------|--------|
| Information overload | Dozens of stats per player; hard to synthesize |
| Matchup analysis is tedious | Manually checking opponent defensive ratings |
| Missing breakout players | Not tracking waiver wire opportunities |
| No personalized context | Generic rankings don't account for my league's scoring |
| Time-consuming | Hours spent on what should be quick decisions |

## Goals

- Get quick start/sit recommendations with clear reasoning
- Identify which players are trending up or down
- Understand matchup advantages and disadvantages
- Track player performance against my league's scoring system
- Receive waiver wire suggestions based on my roster needs

## Allowed Services

This agent MAY use:

- **BALLDONTLIE API** (https://www.balldontlie.io)
  - Get player statistics (season averages, game logs)
  - Get game schedules and results
  - Get team information and rosters
  - **API key required** - free registration
  - Rate limits apply on free tier

This agent may NOT:

- Make actual roster moves or trades
- Access other league members' teams
- Guarantee outcomes (fantasy sports involve luck!)
- Provide gambling advice

## BALLDONTLIE API Reference

### Get Player Season Averages

Returns season average statistics for specified players.

```
GET https://api.balldontlie.io/v1/season_averages
    ?season=2025
    &player_ids[]=115
    &player_ids[]=246

Headers:
    Authorization: YOUR_API_KEY
```

**Response:**
```json
{
  "data": [
    {
      "player_id": 115,
      "season": 2025,
      "games_played": 52,
      "min": "34.2",
      "pts": 27.8,
      "reb": 8.4,
      "ast": 7.2,
      "stl": 1.3,
      "blk": 0.6,
      "turnover": 3.8,
      "fg_pct": 0.512,
      "fg3_pct": 0.378,
      "ft_pct": 0.856
    }
  ]
}
```

### Get Player Game Stats

Returns box score statistics for individual games.

```
GET https://api.balldontlie.io/v1/stats
    ?player_ids[]=115
    &start_date=2026-03-01
    &end_date=2026-03-11

Headers:
    Authorization: YOUR_API_KEY
```

**Response:**
```json
{
  "data": [
    {
      "id": 1234567,
      "player": {
        "id": 115,
        "first_name": "LeBron",
        "last_name": "James",
        "position": "F",
        "team": {
          "id": 14,
          "name": "Lakers",
          "abbreviation": "LAL"
        }
      },
      "game": {
        "id": 98765,
        "date": "2026-03-10",
        "home_team_id": 14,
        "visitor_team_id": 5,
        "home_team_score": 118,
        "visitor_team_score": 112
      },
      "min": "36:24",
      "pts": 32,
      "reb": 10,
      "ast": 8,
      "stl": 2,
      "blk": 1,
      "turnover": 4,
      "fg3m": 3,
      "fg3a": 7,
      "fgm": 12,
      "fga": 22,
      "ftm": 5,
      "fta": 6
    }
  ],
  "meta": {
    "next_cursor": 1234568,
    "per_page": 25
  }
}
```

### Get Upcoming Games

Returns scheduled games for teams.

```
GET https://api.balldontlie.io/v1/games
    ?team_ids[]=14
    &start_date=2026-03-12
    &end_date=2026-03-18

Headers:
    Authorization: YOUR_API_KEY
```

**Response:**
```json
{
  "data": [
    {
      "id": 99001,
      "date": "2026-03-13",
      "season": 2025,
      "status": "scheduled",
      "home_team": {
        "id": 14,
        "name": "Lakers",
        "abbreviation": "LAL"
      },
      "visitor_team": {
        "id": 2,
        "name": "Celtics",
        "abbreviation": "BOS"
      },
      "home_team_score": null,
      "visitor_team_score": null
    }
  ]
}
```

### Get Players

Search for players by name or get player details.

```
GET https://api.balldontlie.io/v1/players
    ?search=curry

Headers:
    Authorization: YOUR_API_KEY
```

**Response:**
```json
{
  "data": [
    {
      "id": 115,
      "first_name": "Stephen",
      "last_name": "Curry",
      "position": "G",
      "height": "6-2",
      "weight": "185",
      "jersey_number": "30",
      "college": "Davidson",
      "country": "USA",
      "draft_year": 2009,
      "draft_round": 1,
      "draft_number": 7,
      "team": {
        "id": 10,
        "name": "Warriors",
        "abbreviation": "GSW"
      }
    }
  ]
}
```

## Technical Stack

- **Framework:** LangGraph - Python
- **LLM:** Claude via Anthropic API
- **External API:** BALLDONTLIE (REST, API key auth)
- **HTTP Client:** requests or httpx
- See `.claude/rules/langgraph.md` for development patterns

## Sample Interaction

```
User: "Should I start Jayson Tatum or Jaylen Brown this week?"

Agent:
1. Reads user's roster and league scoring from KB
2. Fetches season averages for both players
3. Fetches recent game stats (last 5 games) for trend analysis
4. Checks upcoming schedule and matchups for both
5. Calculates fantasy points based on league scoring rules
6. Generates recommendation:

"Start/Sit Analysis: Tatum vs Brown (Week 12)

📊 **Recommendation: Start Jayson Tatum**

**Recent Form (Last 5 Games):**
• Tatum: 28.4 pts, 9.2 reb, 5.0 ast → ~47.6 fantasy pts/game
• Brown: 24.8 pts, 5.6 reb, 3.4 ast → ~38.2 fantasy pts/game

**This Week's Matchups:**
Tatum faces CHA (28th def rating), WAS (30th) - favorable
Brown same matchups, but Tatum has higher usage rate (31.2% vs 26.8%)

**Key Factor:** Tatum averaging 4.2 more fantasy points over the last
two weeks. With two cupcake matchups, expect a big week.

**Confidence:** High (favorable matchups + hot streak)

Want me to analyze anyone else on your roster?"
```

## Example Python Code

```python
import requests
from typing import Optional

BALLDONTLIE_KEY = "YOUR_API_KEY"
BASE_URL = "https://api.balldontlie.io/v1"

def get_headers() -> dict:
    """Return authorization headers."""
    return {"Authorization": BALLDONTLIE_KEY}

def search_player(name: str) -> Optional[dict]:
    """Search for a player by name."""
    response = requests.get(
        f"{BASE_URL}/players",
        headers=get_headers(),
        params={"search": name}
    )
    data = response.json()
    players = data.get("data", [])
    return players[0] if players else None

def get_season_averages(player_ids: list[int], season: int = 2025) -> list[dict]:
    """Fetch season averages for specified players."""
    params = {"season": season}
    for pid in player_ids:
        params.setdefault("player_ids[]", []).append(pid)

    response = requests.get(
        f"{BASE_URL}/season_averages",
        headers=get_headers(),
        params=params
    )
    return response.json().get("data", [])

def get_recent_games(player_id: int, last_n_days: int = 14) -> list[dict]:
    """Fetch recent game stats for a player."""
    from datetime import datetime, timedelta

    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=last_n_days)).strftime("%Y-%m-%d")

    response = requests.get(
        f"{BASE_URL}/stats",
        headers=get_headers(),
        params={
            "player_ids[]": player_id,
            "start_date": start_date,
            "end_date": end_date
        }
    )
    return response.json().get("data", [])

def calculate_fantasy_points(stats: dict, scoring: dict) -> float:
    """Calculate fantasy points based on league scoring rules."""
    return (
        stats.get("pts", 0) * scoring.get("pts", 1) +
        stats.get("reb", 0) * scoring.get("reb", 1.2) +
        stats.get("ast", 0) * scoring.get("ast", 1.5) +
        stats.get("stl", 0) * scoring.get("stl", 3) +
        stats.get("blk", 0) * scoring.get("blk", 3) +
        stats.get("turnover", 0) * scoring.get("to", -1) +
        stats.get("fg3m", 0) * scoring.get("fg3m", 0.5)
    )

def get_upcoming_games(team_id: int, days_ahead: int = 7) -> list[dict]:
    """Fetch upcoming games for a team."""
    from datetime import datetime, timedelta

    start_date = datetime.now().strftime("%Y-%m-%d")
    end_date = (datetime.now() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")

    response = requests.get(
        f"{BASE_URL}/games",
        headers=get_headers(),
        params={
            "team_ids[]": team_id,
            "start_date": start_date,
            "end_date": end_date
        }
    )
    return response.json().get("data", [])

# Example usage
if __name__ == "__main__":
    # Search for a player
    player = search_player("Jayson Tatum")
    if player:
        print(f"Found: {player['first_name']} {player['last_name']} ({player['team']['abbreviation']})")

        # Get season averages
        averages = get_season_averages([player["id"]])
        if averages:
            avg = averages[0]
            print(f"Season averages: {avg['pts']:.1f} pts, {avg['reb']:.1f} reb, {avg['ast']:.1f} ast")

        # Get recent games
        recent = get_recent_games(player["id"], last_n_days=14)
        print(f"Games in last 14 days: {len(recent)}")

        # Calculate fantasy points for most recent game
        if recent:
            scoring = {"pts": 1, "reb": 1.2, "ast": 1.5, "stl": 3, "blk": 3, "to": -1, "fg3m": 0.5}
            fp = calculate_fantasy_points(recent[0], scoring)
            print(f"Last game fantasy points: {fp:.1f}")
```

## Knowledge Base Files

| File | Purpose |
|------|---------|
| `fantasy-team.md` | User's roster, league scoring rules, waiver wire priorities |
| `analysis-preferences.md` | Risk tolerance, preferred stat categories, how user wants advice |
