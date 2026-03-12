# Business Context

**User:** Personal Use
**Purpose:** Proactive weather-based recommendations for daily activities

## Background

I spend a lot of time outdoors - running, hiking, cycling, and gardening. Right now I check weather apps multiple times per day, but they just show raw data. I have to mentally translate "72°F, 15mph winds, 30% precipitation" into "good day for a bike ride?" I want an agent that understands my activities and gives me actionable recommendations.

## Why This Project?

**For Data Analytics Students:** This is the most data-analytics-relevant project in the workshop. You'll interpret raw numerical data (temperature, precipitation probability, wind speed) and transform it into human-understandable recommendations—the core skill of deriving insights from data.

| Learning Focus | Data Analytics Connection |
|----------------|--------------------------|
| Data Interpretation | Transforming raw metrics into actionable insights |
| Threshold Analysis | Decision boundaries (e.g., "rain likely if >40%") |
| Multi-variate Reasoning | Combining temperature + wind + precipitation for recommendations |

**Technical Simplicity:** Open-Meteo requires zero authentication—the simplest possible API integration. You'll learn API integration patterns without credential management overhead.

## Pain Points

| Pain Point | Impact |
|------------|--------|
| Weather apps show data, not recommendations | Have to interpret conditions for each activity myself |
| Checking forecast multiple times per day | Time wasted; still sometimes get caught in bad weather |
| Each activity has different ideal conditions | Hard to remember thresholds for running vs cycling vs hiking |
| Miss optimal weather windows | Find out too late that morning was perfect for a run |

## Goals

- Get activity-specific recommendations without interpreting raw weather data
- Know the best time windows for outdoor activities each day
- Receive proactive alerts for excellent conditions ("Great cycling weather this afternoon!")
- Get simple advice on what to wear/bring
- Plan weekend activities based on forecast

## Allowed Services

This agent MAY use:

- **Open-Meteo API** (https://open-meteo.com/en/docs)
  - Get current weather conditions
  - Get hourly and daily forecasts (up to 16 days)
  - Access temperature, precipitation, wind, humidity, UV index
  - **No API key required** - completely free for non-commercial use
  - No registration needed
  - Fair use limit ~10,000 requests/day (more than enough)

This agent may NOT:

- Store location history or tracking data
- Share location with third parties
- Make purchases or reservations

## Why Open-Meteo?

This is the **simplest possible API integration** for workshop learning:

1. **Zero authentication** - No API keys, no registration, no tokens
2. **No rate limit concerns** - Generous fair-use policy
3. **Real data** - Students see actual weather for their location
4. **Rich features** - Hourly forecasts, multiple weather variables
5. **Reliable** - Open-source, community-supported

### Example API Call

```python
import requests

# No auth needed - just call the endpoint directly
url = "https://api.open-meteo.com/v1/forecast"
params = {
    "latitude": 39.74,
    "longitude": -104.99,
    "hourly": "temperature_2m,precipitation_probability,wind_speed_10m,uv_index"
}

response = requests.get(url, params=params)
weather_data = response.json()

# Example response structure (abbreviated):
# {
#   "hourly": {
#     "time": ["2026-03-12T00:00", "2026-03-12T01:00", ...],
#     "temperature_2m": [45.2, 44.8, ...],
#     "precipitation_probability": [10, 15, ...],
#     "wind_speed_10m": [8.5, 9.2, ...],
#     "uv_index": [0, 0, 1, 3, 5, 6, 5, ...]
#   }
# }
```

## Technical Stack

- **Framework:** LangGraph - Python
- **LLM:** Claude via Anthropic API
- **External API:** Open-Meteo (REST, no SDK needed)
- **HTTP Client:** requests or httpx
- See `.claude/rules/langgraph.md` for development patterns

## Sample Interaction

```
User: "Should I go for a run this afternoon?"

Agent:
1. Gets user's location (Denver, from preferences)
2. Fetches hourly forecast from Open-Meteo
3. Checks afternoon hours against running conditions from KB
4. Responds: "This afternoon looks good for running! 3-5pm has temps
   around 68°F with light winds (8mph). There's a 15% chance of
   light rain after 6pm, so I'd aim for earlier. Wear shorts and
   a light shirt - you won't need layers."
```

## Knowledge Base Files

| File | Purpose |
|------|---------|
| `activity-preferences.md` | User's activities, ideal conditions, notification preferences, location defaults |
