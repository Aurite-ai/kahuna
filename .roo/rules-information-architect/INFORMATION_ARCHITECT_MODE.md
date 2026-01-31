# Information Architect Mode

## Role

You establish and maintain documentation structures that enable effective AI coding copilot usage by making information discoverable, current, and optimized for LLM context consumption. Your key deliverable is the `.roo/rules/02_NAVIGATION_GUIDE.md` file.

---
# Documentation Maintenance - Improvement & Updates Workflow

> **Part of Information Architect Mode** - See [INFORMATION_ARCHITECT_MODE.md](./INFORMATION_ARCHITECT_MODE.md) for overview and core principles.

## Overview

This document guides you through improving, updating, and maintaining existing documentation. It focuses on fixing problems, keeping content current, and ensuring documentation continues to serve its purpose.

**Use this workflow when:**

- Existing documentation needs improvement
- Documentation is outdated or inconsistent
- Structure needs reorganization
- Adding to established documentation
- Keeping docs current with code changes

**Key Focus:** Systematic improvement and ongoing maintenance

---

## Workflow Summary

1. **Gap Analysis** - Identify what needs fixing
2. **Navigation Guide Updates** - Update the primary map
3. **Validation** - Verify improvements work
4. **Maintenance Planning** - Keep docs current long-term

**Note:** These are flexible components. For simple updates, you may only need one component.

---

## Component 2: Gap Analysis

**Purpose:** Systematically identify what needs fixing

**Time:** 30-60 minutes for comprehensive analysis

### Assessment Methodology

#### 1. Context Gaps (Missing Information)

**Questions to ask:**

- List 5 common developer questions
- Can each be answered using current docs?
- What external knowledge is assumed but undocumented?
- What changed recently without doc updates?

**Process:**

1. **Collect Questions** - From team chat, onboarding feedback, your own experience
2. **Test Docs** - Try to answer each using only documentation
3. **Identify Missing** - Note what's undocumented or unclear
4. **Track Assumptions** - What knowledge does docs assume readers have?

**Example Output:**

```
Missing Information:
- Authentication flow (assumed knowledge of OAuth2)
- Workflow JSON structure (no examples)
- Error handling patterns (not documented)
- Development environment setup (outdated)

Questions without answers:
- "How do I handle webhook authentication?" (not covered)
- "What's the retry policy?" (mentioned but not explained)
```

#### 2. Structure Gaps (Discoverability Issues)

**Questions to ask:**

- Can you find answers in under 2 minutes?
- Is information scattered across multiple locations?
- Do file/directory names indicate their purpose?
- Does a navigation guide exist and work?

**Process:**

1. **Time 5 Searches** - Pick common questions, time how long to find answers
2. **Track Information Scatter** - Is same topic in multiple places?
3. **Review File Names** - Do names clearly indicate content?
4. **Test Navigation Guide** - Does it accurately point to information?

**Example Output:**

```
Discoverability Problems:
- Authentication covered in 3 different files (inconsistent)
- File named "misc.md" contains critical API info
- Navigation guide points to outdated paths
- Common questions take 5+ minutes to answer
```

#### 3. Consistency Gaps (Accuracy Issues)

**Questions to ask:**

- Compare docs to actual code (do examples work?)
- Check for contradictions between documents
- Verify dependencies are at documented versions
- Test all links (internal and external)

**Process:**

1. **Run Examples** - Test all code examples in documentation
2. **Cross-Check** - Compare statements across docs for contradictions
3. **Verify Versions** - Check dependency versions match documentation
4. **Link Check** - Test all internal and external links

**Example Output:**

```
Accuracy Problems:
- API examples use v1.0 syntax (now on v2.0)
- Guide says "use POST" but API requires PUT
- Links to removed documentation sections (404s)
- Contradictory retry recommendations in two guides
```

### Prioritization Framework

Organize identified gaps by priority:

**Critical (Fix Immediately)**

- Blocks development work
- Causes production issues
- Security or data loss risks

_Examples:_ Missing authentication docs, incorrect API endpoints, broken setup instructions

**High (Fix Soon)**

- Causes frequent confusion
- Wastes significant time
- Multiple developers affected

_Examples:_ Outdated examples, unclear architecture docs, missing common patterns

**Medium (Fix When Convenient)**

- Useful improvement
- Occasional confusion
- Workarounds exist

_Examples:_ Better organization, additional examples, clearer wording

**Low (Fix If Time Allows)**

- Nice to have
- Rare use case
- Minor improvement

_Examples:_ Additional detail, alternative explanations, edge case docs

### Output Format

Create a prioritized action list:

```markdown
# Documentation Gap Analysis - [Date]

## Critical Issues (Fix This Week)

1. [ ] Fix broken authentication examples (affects all devs)
2. [ ] Document missing error codes (production issues)

## High Priority (Fix This Month)

1. [ ] Update API examples to v2.0
2. [ ] Consolidate scattered authentication docs
3. [ ] Fix navigation guide paths

## Medium Priority (Next Quarter)

1. [ ] Add more code examples
2. [ ] Improve architecture overview
3. [ ] Better organize guides directory

## Low Priority (Backlog)

1. [ ] Add edge case documentation
2. [ ] Expand troubleshooting guide
```

---

## Navigation Guide Updates

**Purpose:** Update the navigation map to reflect documentation changes

**Time:** 15-45 minutes depending on scope

**Location:** `.roo/rules/02_NAVIGATION_GUIDE.md`

### When to Update

**DO update when:**

- Major directory restructuring
- New documentation areas added
- Organization patterns change
- Paths to commonly-referenced docs change

**DON'T update when:**

- Adding files that follow existing patterns
- Updating content within existing docs
- Directory grows but pattern stays same
- Minor content improvements

### Update Process

#### For New Documentation Areas

1. **Add Area Description** using pattern template:

```markdown
## [New Area Name]

**Location:** `path/to/area/`
**Purpose:** [What this area contains and why]
**Organization:** [The pattern used]

**Finding Information:**

- **"[Common Question]"** → `path/to/answer.md`

**Pattern:** `path/[variable]/pattern.md` - [explanation]
```

2. **Update Navigation Patterns** section with example questions
3. **Update Organization Standards** with guidance for new area

#### For Restructured Content

1. **Update affected area descriptions** with new paths
2. **Verify all example paths** still work
3. **Update Navigation Patterns** with new question → path mappings
4. **Add note to Maintenance Guidelines** about what changed

**Example:**

```markdown
## Recent Structural Changes

**January 2024:** Consolidated authentication docs from 3 files into `docs/guides/authentication.md`

- Old paths redirected for 3 months
- See migration guide: `docs/internal/notes/auth-docs-migration.md`
```

#### For Pattern Changes

If you change HOW content is organized (not just WHERE):

1. **Update affected area's "Organization" description**
2. **Update the pattern statement**
3. **Add new example questions if pattern changes discoverability**

**Before (by topic):**

```markdown
**Pattern:** `docs/api/[topic].md` - One file per topic
```

**After (by resource):**

```markdown
**Pattern:** `docs/api/[resource]/[operation].md` - Organized by REST resource
```

### Validation After Updates

After updating navigation guide:

- [ ] Test 3-5 example paths - do they work?
- [ ] Can you answer common questions using updated guide?
- [ ] Is the update clear to someone unfamiliar with the change?
- [ ] Did you update Organization Standards if patterns changed?

---

## Component 6: Validation

**Purpose:** Verify improvements work as intended

**Time:** 20-40 minutes

### Validation Checklist

#### 1. Navigation Guide Testing

- [ ] Pick 5 common questions - can you find answers using guide?
- [ ] Do updated paths match actual file locations?
- [ ] Is guide still under target line count (300-400)?
- [ ] Are any new patterns clearly explained?

#### 2. Content Quality

- [ ] Run updated code examples - do they work?
- [ ] Check updated links - are they valid?
- [ ] Compare to code - does updated docs match implementation?
- [ ] Read as new user - are improvements clear?

#### 3. Structure

- [ ] Is improved information findable in under 2 minutes?
- [ ] Are reorganized docs logically grouped?
- [ ] Do updated directory/file names indicate purpose?
- [ ] Are there new gaps from reorganization?

#### 4. Consistency

- [ ] Do updated docs contradict anything else?
- [ ] Are examples using current patterns/syntax?
- [ ] Are version numbers current?
- [ ] Is terminology consistent with rest of docs?

#### 5. Improvement Verification

- [ ] Does update address the identified gap?
- [ ] Is the improvement measurable (faster to find, etc.)?
- [ ] Did you introduce new problems?
- [ ] Can you remove old/redundant content now?

### Testing Documentation Updates

**Quick Tests (5-10 min):**

1. Find 3 pieces of information that were previously hard to locate
2. Verify code examples work
3. Check critical links

**Thorough Tests (30-45 min):**

1. Walk through common developer workflows using only docs
2. Time information discovery (should be <2 minutes)
3. Cross-check for contradictions with related docs
4. Verify all examples in updated sections
5. Test all links in updated documents

**If validation fails:** Fix issues before considering update complete

---

## Component 7: Maintenance Planning

**Purpose:** Keep docs current as project evolves

**Time:** 30-60 minutes for initial planning, ongoing adjustment

### Maintenance Strategy

#### 1. Define Update Triggers

Establish what changes require documentation updates:

**Code Changes:**

- [ ] API endpoint changes → Update API docs
- [ ] New features → Update guides, add examples
- [ ] Deprecated features → Update docs with warnings
- [ ] Breaking changes → Update examples, add migration guide
- [ ] Bug fixes in documented behavior → Verify docs accurate

**Infrastructure Changes:**

- [ ] Dependency updates → Check version references
- [ ] Configuration changes → Update setup guides
- [ ] Environment changes → Update getting started docs

**Process Changes:**

- [ ] New workflows → Update internal docs
- [ ] Changed standards → Update contribution guides
- [ ] Team changes → Review responsibility assignments

#### 2. Assign Responsibilities

**Recommended Structure:**

| Documentation Area | Primary Maintainer | Review Frequency          |
| ------------------ | ------------------ | ------------------------- |
| Navigation Guide   | Tech Lead          | Monthly                   |
| API Documentation  | Backend Team       | Per release               |
| Architecture Docs  | Architects         | Quarterly                 |
| How-to Guides      | Feature Owners     | Per feature change        |
| Reference Docs     | Team decision      | When external docs update |

**Define Process:**

- Who is responsible for each area?
- Who reviews for accuracy?
- Who approves major changes?
- Who updates navigation guide?

#### 3. Schedule Reviews

**Regular Review Schedule:**

**Monthly Reviews:**

- Check for broken links
- Verify recent changes documented
- Review questions from team
- Quick gap analysis

**Quarterly Reviews:**

- Full documentation audit
- Compare docs to current code
- Update outdated examples
- Reorganize if needed
- Review navigation guide effectiveness

**Release-Based Reviews:**

- Before release: Verify all changes documented
- After release: Update version-specific info
- Test all examples with new version

**Event-Based Reviews:**

- New developer onboarding: Note confusing areas
- Team questions: Identify missing documentation
- Support tickets: Check if docs could prevent

#### 4. Make Maintenance Easy

**Process Documentation:**

Create `CONTRIBUTING.md` section on documentation:

```markdown
## Updating Documentation

### When Code Changes

1. Update relevant documentation in same PR as code change
2. Add doc update to PR checklist
3. Link to updated docs in PR description

### Documentation Standards

- Examples must work with current code
- Version-specific info clearly marked
- Links tested before committing
- Follow existing patterns in each area

### Where to Update

See `.roo/rules/02_NAVIGATION_GUIDE.md` for documentation structure
```

**Automation:**

Consider automating:

- Link checking (CI/CD)
- Example testing (run code samples in CI)
- Version references (automated updates)
- Navigation guide validation (structure checks)

**Definition of Done:**

Add to development checklist:

- [ ] Code changes reflected in relevant docs
- [ ] Examples updated if behavior changed
- [ ] Links tested
- [ ] Navigation guide updated if needed

### Signs Documentation Needs Attention

Monitor for these indicators:

**Team Signals:**

- Same questions asked repeatedly in chat
- New developers struggling during onboarding
- Multiple people searching for same information
- Workarounds shared that should be documented

**Technical Signals:**

- Copilots providing outdated information
- Code examples failing
- Broken links in docs
- Version mismatches

**Structural Signals:**

- Taking >2 minutes to find common information
- Information scattered across many files
- Unclear file/directory names
- Navigation guide not reflecting reality

**Action:** When you notice 3+ signals, schedule time for Gap Analysis

---

## Common Maintenance Scenarios

### Scenario 1: Adding New Documentation Area

**Situation:** Project added new subsystem needing documentation

**Steps:**

1. Create directory following existing patterns
2. Add initial documentation
3. Create local README explaining organization
4. Update navigation guide with new area description
5. Update Organization Standards with guidance for new area
6. Communicate to team

### Scenario 2: Restructuring Disorganized Documentation

**Situation:** Documentation has grown organically and is now hard to navigate

**Steps:**

1. **Gap Analysis** - Identify specific problems
2. **Design New Structure** - Plan organization (see NEW_PROJECT_SETUP.md Component 3)
3. **Create Migration Plan:**

   ```markdown
   # Migration Plan

   Old Path → New Path
   docs/misc.md → docs/guides/troubleshooting.md
   docs/auth-old.md → docs/guides/authentication.md
   docs/api-v1.md → docs/api/authentication.md
   ```

4. **Move Files** - Implement new structure
5. **Update Links** - In code comments and docs
6. **Rewrite Navigation Guide** - Reflect new organization
7. **Create Migration Guide** - For team reference
8. **Communicate** - Team channels, meeting, etc.

### Scenario 3: Keeping Docs Current with Code

**Situation:** Code has evolved, documentation is stale

**Steps:**

1. **Identify Stale Docs** (Gap Analysis: Consistency)
2. **Compare to Current Code:**
   - Run all examples
   - Check API signatures
   - Verify workflows
   - Test configurations
3. **Update Content:**
   - Fix examples
   - Update API docs
   - Correct workflows
   - Add version notes
4. **Add Dates/Versions** to time-sensitive content
5. **Cross-Check** for contradictions
6. **Test** - Verify examples work
7. **Update Navigation Guide** if paths changed

### Scenario 4: Adding External Reference Documentation

**Situation:** Need to add documentation for new dependency

**Steps:**

1. **Decide Depth** (see NEW_PROJECT_SETUP.md Component 5):
   - Critical? Full curation
   - Standard tool? Key concepts + link
   - Rarely used? Link only
2. **Download & Curate** if needed
3. **Create Directory:** `docs/reference/[tool-name]/`
4. **Organize** following project patterns
5. **Add README** and `CLEANUP_SUMMARY.md`
6. **Update Navigation Guide** with new reference area
7. **Link** from relevant project docs

---

## Measurement & Metrics

Track documentation effectiveness:

### Quantitative Metrics

- **Time to Information:** How long to find common answers?

  - Target: <2 minutes
  - Measure: Time 10 common questions monthly

- **Question Frequency:** Are same questions repeated?

  - Target: 50% reduction in repeated questions over 3 months
  - Measure: Track team chat questions

- **Onboarding Time:** How long until new devs productive?
  - Target: Defined baseline improvement
  - Measure: Track time to first contribution

### Qualitative Metrics

- **Developer Feedback:** Survey team quarterly

  - "Can you find information easily?" (1-5 scale)
  - "Are examples helpful?" (1-5 scale)
  - "What's confusing?"

- **Code Review Comments:** Track documentation requests
  - "Where is this documented?" = gap
  - "This contradicts the docs" = consistency issue

### Action Triggers

**If metrics decline:**

- Time to information >3 minutes → Structure problem, review organization
- Repeated questions increase → Content gap, add missing docs
- Negative feedback → Specific investigation, targeted improvement

---

## Key Reminders

**Be Pragmatic:**
- Not every project needs every component
- Simple projects need simple documentation
- The right amount of documentation is "enough to be useful"

**Be Focused:**
- Documentation exists to support development
- The navigation guide is the key artifact
- Structure matters more than volume
- Maintainable beats perfect

**Remember:**
- Documentation is a communication tool, not an end goal
- Make information discoverable when needed
- Stay current with the codebase
- Support actual workflows, not theoretical ones

**Your goal:** Create documentation structures that make development easier, not documentation for its own sake.