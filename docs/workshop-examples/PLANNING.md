# Workshop Example Projects - Planning Document

**Purpose:** Plan 5 buildable workshop projects for data analytics graduate students learning AI agent development with Kahuna
**Date:** 2026-03-12
**Status:** Complete ✓

---

## Executive Summary

This document outlines **5 workshop example projects** designed for data analytics graduate students learning AI agent development. The user maintains their own **Customer Support Agent** as Project 1 (not included here).

### Final Project Lineup

| # | Project Name | Type | Status | Notes |
|---|--------------|------|--------|-------|
| 1 | Customer Support Agent | Business | User's example | Not in this folder |
| 2 | Stock Market Analyzer | Data Analytics | **NEW** | Replaced Email Triage Assistant |
| 3 | Weather Advisory Agent | Personal | **KEPT** | - |
| 4 | Sports Analytics Agent | Data Analytics | **NEW** | Replaced Recipe Meal Planner |
| 5 | Research Paper Discovery | Academic | **NEW** | Replaced Meeting Summarizer |
| 6 | Volunteer Coordinator | Nonprofit | **KEPT** | - |

### Changes from Previous Plan

| Old Project | New Project | Reason for Change |
|-------------|-------------|-------------------|
| Email Triage Assistant | Stock Market Analyzer | Better data analytics fit; financial data analysis more relevant |
| Recipe Meal Planner | Sports Analytics Agent | Analytics-focused domain; pattern recognition emphasis |
| Meeting Summarizer | Research Paper Discovery | Academic research more relevant to graduate students |

### What Was Kept

| Project | Reason |
|---------|--------|
| Weather Advisory Agent | Strong data interpretation focus; no-auth API simplicity |
| Volunteer Coordinator | Complex matching/optimization; good capstone challenge |

---

## Directory Structure

```
docs/internal/workshop-examples/
├── PLANNING.md (this file)
├── QUALITY-REVIEW.md (archived review)
├── ALTERNATIVE-IDEAS.md (decision record)
├── 02-stock-market-analyzer/
├── 03-weather-advisory-agent/
├── 04-sports-analytics-agent/
├── 05-research-paper-agent/
└── 06-volunteer-coordinator/
```

---

## Project Summaries

### Project 2: Stock Market Analyzer
**Location:** `02-stock-market-analyzer/`

Financial data analysis agent that interprets market trends, analyzes stock performance, and provides data-driven insights. Excellent fit for data analytics students familiar with financial datasets.

### Project 3: Weather Advisory Agent
**Location:** `03-weather-advisory-agent/`

Proactive weather-based recommendations for outdoor activities. Uses Open-Meteo API (no auth required). Core skill: translating raw numerical data into actionable recommendations.

### Project 4: Sports Analytics Agent
**Location:** `04-sports-analytics-agent/`

Sports performance and statistics analysis agent. Pattern recognition, trend analysis, and predictive insights - all familiar concepts from data analytics coursework.

### Project 5: Research Paper Discovery
**Location:** `05-research-paper-agent/`

Academic research discovery and summarization agent. Helps graduate students find and synthesize relevant papers - directly applicable to their academic work.

### Project 6: Volunteer Coordinator
**Location:** `06-volunteer-coordinator/`

Volunteer-to-shift matching and scheduling agent. Uses Notion API for database operations. Demonstrates optimization and constraint satisfaction in a nonprofit context.

---

## Implementation Status

All 5 workshop projects are complete and ready for use.

- [x] Project 2: Stock Market Analyzer
- [x] Project 3: Weather Advisory Agent
- [x] Project 4: Sports Analytics Agent
- [x] Project 5: Research Paper Discovery
- [x] Project 6: Volunteer Coordinator

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-12 | **Final cleanup:** Removed replaced examples (Email Triage, Recipe Planner, Meeting Summarizer). Marked as complete. |
| 2026-03-12 | Replaced 3 projects with more data-analytics-focused alternatives |
| 2026-03-12 | Initial 6-project plan created |
