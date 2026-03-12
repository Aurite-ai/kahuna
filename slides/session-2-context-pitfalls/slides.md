---
marp: true
theme: default
paginate: true
---

# Common Pitfalls + Kahuna

Why Long Conversations Go Wrong

<!--
Welcome to Session 2. Last time we learned GRSO — a framework for structuring prompts.

Today we're going to explore why even well-structured prompts can fail when conversations get long. And we'll see how tools like Kahuna can help.
-->

---

# Quick Recap: GRSO

| Component | Purpose |
|-----------|---------|
| **G**oal | What success looks like |
| **R**ules | Hard constraints (must/must not) |
| **S**trategies | Soft preferences (prefer/avoid) |
| **O**pening | How to begin |

You're now structuring prompts effectively.

But what happens in long conversations?

<!--
Quick recap from last session. GRSO — Goal, Rules, Strategies, Opening. This framework helps you write clear prompts.

But here's the thing: even with perfect prompts, long conversations tend to go wrong. Today we'll understand why.
-->

---

# A Simple Mental Model

Remember: LLMs are text-in, text-out equations.

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   INPUT ──────────►  LLM  ──────────► OUTPUT        │
│   (entire         (equation)         (ONE word)     │
│    conversation)                                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Key insight:** The entire conversation goes in. Every time. For every word.

<!--
Let me expand on the mental model from Session 1.

The input isn't just your latest message. It's the ENTIRE conversation — your system prompt, all previous messages, all previous responses, every file you've uploaded.

All of it goes in. Every time. For every word the AI generates.
-->

---

# What This Really Means

To produce a 100-word response:

- The equation runs **100 times**
- Each time, it reads the **entire** conversation
- Including all the words it just generated

The LLM has no memory between words. It re-reads everything, every time.

<!--
This is the crucial insight most people miss.

The LLM doesn't produce a full response in one shot. It produces one word at a time. For a 100-word response, the equation runs 100 times.

And each time? It reads everything from the beginning. The system prompt, all your messages, all its previous responses, all the words it's generated so far.

No memory between words. Complete re-read every time.
-->

---

# Imagine You're Watching a Python Tutorial

You're watching a 30-minute Python tutorial on YouTube.

At minute 1, the YouTuber goes on a **2-minute tangent about balloon animals**.

Completely irrelevant to Python.

**Question:** As a human, how much do you care about that balloon section?

<!--
Let me give you a concrete way to visualize this.

Imagine you're watching a 30-minute Python tutorial on YouTube. At minute 1, the YouTuber randomly goes off on a 2-minute tangent about balloon animals. Nothing to do with Python.

How much do you care about that section?

Probably not much. As a human, you think "that was weird" and move on. You mentally filter it out.
-->

---

# Humans Have Selective Attention

You can:
- Choose to ignore irrelevant information
- Focus on what matters
- Skip ahead mentally
- Forget unimportant tangents

The balloon section is a one-time distraction.

You watch it once, dismiss it, and learn Python.

<!--
This works because humans have selective attention. You can choose to ignore things. You can focus on what matters. You can mentally skip past irrelevant content.

So the balloon section is just a minor distraction. You watch it once, dismiss it, and continue learning Python.
-->

---

# Now Imagine You're an LLM

Same 30-minute Python tutorial.

**But there's a catch:** You can only process about 1 minute at a time before you have to start over.

To "watch" the full tutorial, you must:
- Watch minutes 0-1, then start over
- Watch minutes 0-2, then start over
- Watch minutes 0-3, then start over
- Continue until you reach minute 30...

<!--
Now imagine you're an LLM watching the same tutorial.

You can only process about 1 minute before you have to start over. So to "watch" the full 30 minutes, you watch 0 to 1, then start over. Watch 0 to 2, start over. Watch 0 to 3, start over.

Every time you make progress, you go back to the beginning.
-->

---

# The Balloon Animals Problem

**How much do you care about that 2-minute balloon section now?**

You're not watching it once.

You're watching it **29 times**.

Every time you try to learn Python, you wade through balloon animals first.

<!--
Now let's bring back those balloon animals.

As an LLM, you're not watching that irrelevant section once. You're watching it 29 times. Every single time you try to make progress on Python, you first have to process two minutes of balloon content.

That irrelevant tangent isn't a one-time distraction. It's permanent noise you process over and over.
-->

---

# This Is Context Poisoning

**Context poisoning:** When irrelevant content permanently degrades performance because it's processed repeatedly.

In LLM conversations:
- You can't "unsay" something
- Mistakes and tangents persist forever
- More context isn't always better
- Every message gets re-processed for every word

<!--
This is called context poisoning. Irrelevant content doesn't just waste one word of attention — it wastes attention on every subsequent word.

You can't unsay something. You can't ask the LLM to ignore part of the conversation. That content stays there, getting processed over and over.

More context isn't always better. Sometimes it's actively harmful.
-->

---

# The Pattern Breaking Analogy

Imagine completing a pattern:

```
a, b, c, _
```

Easy. The answer is `d`.

Now try:

```
a, b, c, z, _
```

What's the answer? `d`? Or does `z` start a new pattern?

The `z` doesn't just add noise — it **breaks the pattern**.

<!--
Here's another way to think about it.

Completing "a, b, c, _" is easy. The answer is d.

But "a, b, c, z, _"? Now it's ambiguous. Did z break the pattern? Is it a typo? Does a new pattern start?

The z doesn't just add noise — it actively breaks the pattern. The LLM can't "ignore" it. It has to account for it.
-->

---

# Once Poisoned, It Can't Recover

```
a, b, c, z, d, e, f, g, _
```

You might think: "Just continue the alphabet, ignore z."

But the LLM sees ALL of it, EVERY time.

The z is there. Permanently. Affecting every prediction.

Context poisoning is **irreversible** within a conversation.

<!--
You might think the LLM could recover. Just continue the alphabet, ignore the z.

But remember: the LLM sees everything, every time. The z doesn't go away. It's there, permanently, affecting every subsequent prediction.

Context poisoning is irreversible within a conversation. The only fix is to start fresh.
-->

---

# Real-World Context Poisoning

| What Happens | Why It Poisons |
|--------------|----------------|
| Wrong approach discussed, then abandoned | AI keeps referencing it |
| User frustration expressed in messages | AI becomes apologetic/defensive |
| Off-topic tangent or debugging session | Pollutes all future context |
| Too much irrelevant code loaded | Signal drowns in noise |
| Conflicting instructions over time | AI can't resolve contradiction |

<!--
Here's what context poisoning looks like in real work.

You discuss one approach, then abandon it. But the AI keeps referencing it because it's still in context.

You express frustration. Now the AI becomes apologetic and defensive in every response.

You go on a debugging tangent. That debugging context pollutes all future work.

You load too much code. Now the relevant code is lost in noise.

These aren't "AI being dumb." This is context poisoning.
-->

---

# Why Long Conversations Fail

**Short conversation:**
- Clear context
- Focused on current task
- Little accumulated noise

**Long conversation:**
- Accumulated tangents
- Abandoned approaches still present
- Emotional residue from frustrations
- Too much context, not enough signal

<!--
This explains why long conversations tend to fail.

Short conversations have clear, focused context. There's little noise to compete with your signal.

Long conversations accumulate tangents, abandoned approaches, frustration, debugging sessions. The signal-to-noise ratio degrades with every message.
-->

---

# The Simple Fix

**Start new conversations more often.**

When you notice:
- Confusion or circular responses
- AI referencing abandoned approaches
- Conversation getting long
- Context becoming noisy

Don't try to fix it in place. **Start fresh.**

<!--
The simplest fix is also the most effective: start new conversations more often.

When you notice confusion, when the AI keeps referencing old approaches, when the conversation is getting long — don't try to fix it. Start fresh.

A new conversation means fresh context. No accumulated poison.
-->

---

# But That Loses All Your Progress!

Yes. And that's the core problem.

Starting fresh means:
- Re-explaining context
- Re-loading relevant files
- Rebuilding the AI's understanding

What if we could have **clean context** without losing **accumulated knowledge**?

<!--
But here's the problem. Starting fresh means re-explaining everything. Re-loading files. Rebuilding understanding from scratch.

What if there was a way to get clean context without losing everything you've learned?
-->

---

# The Orchestrator Pattern

Break complex work into **isolated subtasks**.

```
┌─────────────────────────────────────────────────────┐
│  Task: "Build a user authentication system"          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Subtask 1: Research ───► Research Report            │
│       (clean context)         (deliverable)          │
│                                    │                 │
│  Subtask 2: Design ◄───────────────┘                 │
│       (clean context)   ───► Design Doc              │
│                                    │                 │
│  Subtask 3: Implement ◄────────────┘                 │
│       (clean context)   ───► Code                    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

<!--
The solution is the Orchestrator Pattern. Break complex work into isolated subtasks.

Each subtask runs in its own clean context. Only the deliverable carries forward — not the conversation.

Research produces a report. Design reads the report, produces a design doc. Implementation reads the design doc, produces code.

Each phase has clean context. No accumulated poison.
-->

---

# Deliverables, Not Conversations

**Key insight:** Transfer **deliverables**, not **conversations**.

| Bad | Good |
|-----|------|
| "Continue where we left off" | "Here's the research report. Now design based on this." |
| "Remember what we discussed?" | "Requirements are in this doc. Implement to spec." |
| One long conversation | Multiple focused conversations |

<!--
The key insight: transfer deliverables, not conversations.

Don't say "continue where we left off." That brings all the context poison with you.

Instead, produce a clean deliverable — a report, a design doc, a spec — and start fresh with just that artifact.

The new conversation sees only what it needs. Clean signal, no noise.
-->

---

# Enter Kahuna

**Kahuna** is an MCP server that helps manage context automatically.

What it does:
- Builds a **knowledge base** from your investigations
- Creates **navigation guides** for quick orientation
- Structures **prompts automatically** with rule files

<!--
This is where Kahuna comes in. Kahuna is an MCP server — a tool that integrates with Claude Code — that helps manage context automatically.

It builds a knowledge base from your investigations. It creates navigation guides. It structures prompts with rules so you don't have to GRSO every message manually.

Let me show you how it works.
-->

---

# Kahuna's Key Tools

| Tool | What It Does |
|------|--------------|
| `learn` | Records knowledge from investigation into the KB |
| `prepare-context` | Creates navigation guide for a codebase |
| Rule files | Structure prompts automatically |

<!--
Kahuna has three main capabilities.

The learn tool records what you discover during investigation. Instead of that knowledge existing only in your conversation (where it becomes poison), it goes into a knowledge base.

The prepare-context tool creates navigation guides — structured documentation that helps the AI quickly understand a codebase without loading everything into context.

And rule files structure every prompt automatically, so you get GRSO without typing it each time.
-->

---

# How `learn` Works

During investigation, you discover things:
- "This function handles authentication"
- "The config is in /etc/app/config.yaml"
- "Don't use the legacy API, it's deprecated"

**Without Kahuna:** This lives in your conversation. Accumulates. Becomes poison.

**With Kahuna:** `learn` captures it in the knowledge base. Fresh conversations can access it.

<!--
Let me walk through each tool.

During investigation, you learn things. Where the config is. Which API to use. How authentication works.

Without Kahuna, this knowledge lives only in your conversation. As the conversation grows, it becomes poison — mixed with debugging, tangents, frustration.

With Kahuna, the learn tool captures this knowledge in a structured knowledge base. Fresh conversations can access it without inheriting the poison.
-->

---

# How `prepare-context` Works

Large codebases have a problem: too much code to load.

**Without preparation:**
- Load everything → context overload
- Load nothing → AI doesn't understand the codebase
- Load selectively → you have to know what's relevant

**With `prepare-context`:**
- Creates a navigation guide
- AI can orient quickly
- Knows where to look without loading everything

<!--
The prepare-context tool solves the "too much code" problem.

Without it, you either load everything (context overload), load nothing (AI is blind), or load selectively (but you have to know what's relevant already).

With prepare-context, Kahuna creates a navigation guide — a structured overview of the codebase. The AI can orient quickly and know where to look without loading everything.
-->

---

# How Rule Files Work

Remember GRSO? Imagine not having to write it every time.

```markdown
# Project Rules

## Goal
All code changes must maintain existing test coverage.

## Rules
- Use Python 3.10+ syntax
- No external dependencies without approval
- Follow existing code style

## Strategies
- Prefer type hints
- Write docstrings for public functions
```

This loads automatically for every conversation.

<!--
Rule files are the final piece. Remember how GRSO structures prompts? Rule files do this automatically.

You write your project's goal, rules, and strategies once. They load into every conversation automatically. You don't have to repeat yourself.

Every new conversation starts with the right constraints, without you having to type them.
-->

---

# Demo: Kahuna Workflow

Let's see how this works in practice.

**Scenario:** Working on a codebase you've never seen before.

1. Run `prepare-context` to create navigation guide
2. Start investigating — use `learn` to capture findings
3. Rule files ensure consistent prompts
4. When context gets noisy, start fresh — knowledge persists

<!--
[LIVE DEMO]

Let me show you how this works in practice.

We have a codebase we've never seen. Let's run prepare-context to create a navigation guide.

Now we can investigate. When we discover something important, we use learn to capture it.

Notice the rule files are already structuring our prompts.

If the conversation gets noisy, we can start fresh. But our knowledge persists in the KB.
-->

---

# Before Kahuna vs. After

| Before | After |
|--------|-------|
| Long conversations accumulate poison | Fresh conversations with persistent knowledge |
| Re-explain everything when starting fresh | Knowledge base carries forward |
| Load entire codebase or guess what's relevant | Navigation guide for quick orientation |
| Write GRSO every message | Rule files structure automatically |

<!--
Here's the before and after.

Before: long conversations accumulate poison. Starting fresh means losing everything. Loading code is all or nothing.

After: conversations stay clean. Knowledge persists across sessions. Navigation guides help you orient. Rules structure prompts automatically.

You get the benefit of accumulated knowledge without the cost of accumulated poison.
-->

---

# The Three-Tier Information Strategy

| Tier | What | Why |
|------|------|-----|
| **Code** | The source itself | Ground truth |
| **Documentation** | Structured KB entries | Navigable knowledge |
| **Navigation** | Index/guide | Quick orientation |

Load from the right tier:
- Need exact implementation? Load code.
- Need understanding? Check documentation.
- Need to find something? Use navigation.

<!--
Kahuna implements a three-tier information strategy.

Tier 1 is code — the source of truth. When you need exact implementation details, you load code.

Tier 2 is documentation — structured knowledge base entries. When you need understanding without implementation details, you read documentation.

Tier 3 is navigation — indexes and guides. When you need to find where something is, you use navigation.

This keeps your context lean. You only load what you need for the current task.
-->

---

# Key Takeaways

1. **Context poisoning is real** — irrelevant content degrades all future output
2. **Start fresh more often** — don't try to fix poisoned context
3. **Transfer deliverables, not conversations** — clean artifacts, fresh context
4. **Kahuna helps automate this** — KB, navigation guides, rule files

<!--
Let's recap.

Context poisoning is real. Irrelevant content doesn't just waste attention once — it degrades every future word.

Start fresh more often. Don't try to rehabilitate a poisoned conversation.

Transfer deliverables, not conversations. A clean artifact in fresh context beats a long conversation with accumulated noise.

And Kahuna helps automate this: knowledge bases, navigation guides, and rule files that work for you.
-->

---

# Practical Tips

**Do:**
- Break complex tasks into subtasks
- Start new conversations when things get messy
- Use deliverables to transfer knowledge
- Let tools like Kahuna manage context

**Don't:**
- Keep one conversation going forever
- Expect the AI to "ignore" earlier messages
- Load everything "just in case"
- Mix research, design, and implementation in one conversation

<!--
Here are practical tips you can apply today.

Do break complex tasks into subtasks. Do start fresh when things get messy. Do use deliverables to transfer knowledge.

Don't keep one conversation forever. Don't expect the AI to ignore messages. Don't load everything just in case. Don't mix research, design, and implementation.
-->

---

# Coming Up Next

**Session 3: Hands-On Workshop**

- Work through a real task together
- Apply GRSO and context management
- Practice with Claude Code (+ Kahuna demo)

<!--
In Session 3, we'll put all of this into practice. We'll work through a real task together, applying GRSO and context management principles.

You'll get hands-on practice with Claude Code, and we'll demonstrate how Kahuna fits into the workflow.

Come ready to code!
-->

---

# Questions?

**Remember:**
- Context poisoning is irreversible
- Start fresh more often
- Transfer deliverables, not conversations

<!--
[Q&A time]
-->
