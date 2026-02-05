# Level 1: Customer Support Agent - Evaluation Criteria

Use this rubric to evaluate the copilot's performance on the Customer Support Agent scenario.

---

## Scoring Overview

| Category | Weight | Max Score |
|----------|--------|-----------|
| Technical Correctness | 30% | 30 |
| Security | 25% | 25 |
| Code Quality | 20% | 20 |
| Conversation Quality | 15% | 15 |
| Completeness | 10% | 10 |
| **Total** | **100%** | **100** |

---

## Category 1: Technical Correctness (30 points)

### 1.1 Agent Runs Successfully (10 points)

| Score | Criteria |
|-------|----------|
| 10 | Agent runs without errors, responds to questions, uses tool correctly |
| 7 | Agent runs with minor issues (warnings, but functional) |
| 4 | Agent runs but has significant functional issues |
| 0 | Agent fails to start or crashes on basic queries |

### 1.2 Tool Implementation (10 points)

| Score | Criteria |
|-------|----------|
| 10 | Tool correctly reads files, returns content, handles errors gracefully |
| 7 | Tool works but missing error handling or edge cases |
| 4 | Tool partially works but has bugs |
| 0 | Tool doesn't function or is missing |

### 1.3 Knowledge Base Answers (10 points)

| Score | Criteria |
|-------|----------|
| 10 | Agent accurately answers questions using KB content, cites sources |
| 7 | Agent answers correctly but doesn't cite sources |
| 4 | Agent answers but with inaccuracies or missing information |
| 0 | Agent cannot answer questions from knowledge base |

---

## Category 2: Security (25 points)

### 2.1 Path Traversal Protection (15 points)

**Test with these inputs:**
- `../main.py` - Should be blocked
- `knowledge-base/../secrets.txt` - Should be blocked
- `/etc/passwd` - Should be blocked
- `../../.env` - Should be blocked

| Score | Criteria |
|-------|----------|
| 15 | All path traversal attempts blocked with appropriate error |
| 10 | Most attempts blocked but some edge cases slip through |
| 5 | Basic protection but easily bypassed |
| 0 | No path traversal protection |

### 2.2 Absolute Path Blocking (5 points)

| Score | Criteria |
|-------|----------|
| 5 | Absolute paths are blocked |
| 2 | Some absolute paths blocked, others allowed |
| 0 | Absolute paths not blocked |

### 2.3 Error Message Security (5 points)

| Score | Criteria |
|-------|----------|
| 5 | Error messages don't leak sensitive information (no full paths, no stack traces) |
| 2 | Minor information leakage but not exploitable |
| 0 | Error messages reveal sensitive path information |

---

## Category 3: Code Quality (20 points)

### 3.1 Code Structure (8 points)

| Score | Criteria |
|-------|----------|
| 8 | Clean separation of concerns, well-organized files, follows LangGraph patterns |
| 6 | Good structure with minor organizational issues |
| 4 | Functional but poorly organized |
| 0 | Disorganized, hard to follow |

### 3.2 Documentation (6 points)

| Score | Criteria |
|-------|----------|
| 6 | Clear docstrings, helpful comments, README with setup instructions |
| 4 | Basic documentation present |
| 2 | Minimal or unclear documentation |
| 0 | No documentation |

### 3.3 Error Handling (6 points)

| Score | Criteria |
|-------|----------|
| 6 | Comprehensive error handling with user-friendly messages |
| 4 | Basic error handling present |
| 2 | Minimal error handling |
| 0 | No error handling, crashes on errors |

---

## Category 4: Conversation Quality (15 points)

### 4.1 Requirement Discovery (8 points)

Did the copilot ask good clarifying questions to uncover:
- What files exist and where they are located?
- What types of questions the agent should answer?
- Security requirements?
- Conversation memory needs?

| Score | Criteria |
|-------|----------|
| 8 | Asked comprehensive questions, uncovered most requirements naturally |
| 6 | Asked good questions but missed some areas |
| 4 | Asked basic questions only |
| 2 | Minimal questioning, assumed too much |
| 0 | No clarifying questions, jumped straight to implementation |

### 4.2 User Guidance (4 points)

| Score | Criteria |
|-------|----------|
| 4 | Explained decisions clearly, guided user through setup and usage |
| 3 | Good explanations but some gaps |
| 2 | Minimal explanations |
| 0 | No explanation of decisions |

### 4.3 Iteration Quality (3 points)

| Score | Criteria |
|-------|----------|
| 3 | Tested incrementally, fixed issues when found, iterated well |
| 2 | Some iteration but missed opportunities |
| 1 | Minimal iteration |
| 0 | No testing or iteration |

---

## Category 5: Completeness (10 points)

### 5.1 All Requirements Met (5 points)

Check against requirements.md:
- [ ] FR-1: Knowledge base access
- [ ] FR-2: Question answering
- [ ] FR-3: Out-of-scope handling
- [ ] FR-4: Conversation memory

| Score | Criteria |
|-------|----------|
| 5 | All functional requirements implemented |
| 3 | Most requirements implemented |
| 1 | Some requirements missing |
| 0 | Major requirements missing |

### 5.2 Knowledge Base Files Created (3 points)

| Score | Criteria |
|-------|----------|
| 3 | All 4 knowledge base files created with appropriate content |
| 2 | Knowledge base created but content differs from spec |
| 1 | Partial knowledge base |
| 0 | No knowledge base files |

### 5.3 Runnable Solution (2 points)

| Score | Criteria |
|-------|----------|
| 2 | Solution runs with clear instructions |
| 1 | Solution runs but setup unclear |
| 0 | Solution doesn't run |

---

## Quick Evaluation Checklist

Use this for rapid pass/fail assessment:

### Must Pass (Automatic Fail if Not Met)
- [ ] Agent starts without errors
- [ ] Agent can read knowledge base files
- [ ] Agent answers at least one question correctly
- [ ] Path traversal attacks are blocked
- [ ] Solution includes the tool implementation

### Should Pass (Strong Indicator of Quality)
- [ ] Agent cites sources in answers
- [ ] Agent handles unknown questions gracefully
- [ ] Copilot asked clarifying questions
- [ ] Code has documentation/comments
- [ ] Error messages are user-friendly

### Nice to Have (Bonus Points)
- [ ] Conversation memory implemented
- [ ] Agent suggests follow-up questions
- [ ] Comprehensive error handling
- [ ] Unit tests included
- [ ] Logging/observability added

---

## Sample Evaluation Notes Template

```markdown
# Evaluation: Level 1 Customer Support Agent

**Date:** YYYY-MM-DD
**Copilot Config:** [config name]
**Evaluator:** [name]

## Scores

| Category | Score | Max | Notes |
|----------|-------|-----|-------|
| Technical Correctness | | 30 | |
| Security | | 25 | |
| Code Quality | | 20 | |
| Conversation Quality | | 15 | |
| Completeness | | 10 | |
| **Total** | | **100** | |

## Conversation Summary

[Brief description of the conversation flow]

## Strengths

-

## Weaknesses

-

## Security Test Results

| Test | Result |
|------|--------|
| `../main.py` | |
| `/etc/passwd` | |
| `knowledge-base/../.env` | |

## Functional Test Results

| Test Question | Correct Answer? | Source Cited? |
|--------------|-----------------|---------------|
| "How much does it cost?" | | |
| "What are support hours?" | | |
| "What's the CEO's email?" | | |

## Recommendations

[What should be improved in the copilot configuration?]
```

---

## Grade Interpretation

| Total Score | Grade | Interpretation |
|-------------|-------|----------------|
| 90-100 | A | Excellent - Ready for production-like scenarios |
| 80-89 | B | Good - Minor improvements needed |
| 70-79 | C | Acceptable - Notable gaps to address |
| 60-69 | D | Below expectations - Significant issues |
| <60 | F | Failing - Major rework needed |
