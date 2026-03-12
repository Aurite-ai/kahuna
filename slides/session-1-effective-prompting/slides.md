---
marp: true
theme: default
paginate: true
---

# How to Prompt Effectively

A Practical Guide to Getting Better Results

<!--
By the end of this session, you'll have a practical framework for structuring prompts that actually works.

But first, we need to understand what an LLM actually is — because once you see it clearly, prompting becomes obvious.
-->

---

# What Is an LLM, Really?

Today's AI tools seem complex and magical:

- **ChatGPT** — conversations, file uploads, image generation
- **Claude Code** — coding assistance, tools, sub-agents
- **Cursor** — inline editing, chat, multi-file changes

<!--
When you look at modern AI tools, they seem incredibly sophisticated. New features get announced constantly. It can feel overwhelming to keep up.

But here's the thing — all of this hides something surprisingly simple.
-->

---

# The Core Equation

Underneath everything, an LLM is just a math equation:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   INPUT ──────────►  LLM  ──────────► OUTPUT        │
│   (text)          (equation)         (text)         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**That's it.** Text in, text out.

If you want better output, you need better input.

<!--
An LLM is a math equation. Text goes in, text comes out.

That's the whole thing. If you want better output, you need better input. That's what this session is about.
-->

---

# All Features Are Just Text

Every feature you see in AI tools reduces to text in the input:

| Feature | What It Really Is |
|---------|-------------------|
| System Prompt | Text explaining the role of the LLM |
| Rules | Text explaining constraints |
| User Message | The text you send |
| File Uploads | File contents converted to text |
| Tool Calls | Text describing available tools |
| Sub-Agents | Start a new conversation with new text |
| Skills | Conditional text for specific tasks |

<!--
Every single feature you've seen — system prompts, rules, file uploads, tools, sub-agents, skills — they're ALL just text that gets formatted into the input.

When you upload a file, it gets converted to text. When a tool is available, its description becomes text. Sub-agents? Just starting a new conversation with different text.

There's no magic. It's all text.
-->

---

# How Text Comes Together

```
┌───────────────────────────────────────────────────────┐
│  1. SYSTEM PROMPT                                      │
│     "You are an AI assistant that helps with..."       │
├───────────────────────────────────────────────────────┤
│  2. RULES                                              │
│     "Always follow these guidelines..."                │
├───────────────────────────────────────────────────────┤
│  3. SKILL (conditional)                                │
│     "For this specific task, also do..."               │
├───────────────────────────────────────────────────────┤
│  4. USER MESSAGE                                       │
│     "Help me build a feature that..."                  │
├───────────────────────────────────────────────────────┤
│  5. FILE CONTENTS                                      │
│     [Contents of uploaded/read files as text]          │
└───────────────────────────────────────────────────────┘
```

All of it becomes one text input to the equation.

<!--
Here's how all that text actually comes together.

System prompt sets up who the LLM is. Rules are guidelines. Skills are conditional — they only appear for specific tasks. Then your message, and any file contents.

All of it concatenates into one big text input.
-->

---

# But Really, It's Just One String

All those sections? They get concatenated into one continuous text:

```
You are an AI assistant that helps with coding tasks.
Always follow these guidelines: be concise, explain
your reasoning. For this task, focus on architecture.
Help me build a feature that handles authentication.
Here is the current code: def login(username, password):
    if check_credentials(username, password): return
    create_session(username) ...
```

No structure. No sections. **Just text.**

The LLM has no concept of "this part is a system prompt" vs "this part is your message." It just sees characters, one after another.

<!--
Here's the key insight I want you to really internalize.

Those nice labeled sections — system prompt, rules, skill, user message, files — that's just how WE think about organizing the input.

To the LLM? It's all just one continuous string of text. No headers. No separators. No structure.

The LLM has no concept of "this part is a system prompt" and "this part is a file upload." It just sees text.

This is why managing what goes in is so important.
-->

---

# But Here's the Catch

Most people think the equation works like this:

```
"What is 2+2?" ───────► LLM ───────► "The answer is 4"
```

Your question goes in, the full answer comes out. Simple, right?

**Actually, that's wrong in two important ways.**

<!--
Most people have a mental model where you send a question and get back a complete response. It seems intuitive.

But this mental model is actually wrong — and understanding why is the key to prompting well.
-->

---

# Correction #1: One Word at a Time

The LLM doesn't produce a full response. It produces **one word**.

```
Word 1:   "What is 2+2?" ──────────────────► "The"
Word 2:   "What is 2+2? The" ──────────────► "answer"
Word 3:   "What is 2+2? The answer" ───────► "is"
Word 4:   "What is 2+2? The answer is" ────► "4"
```

Each time the equation runs, it outputs exactly one word.

To generate a 100-word response, the equation runs 100 times.

<!--
First correction: the output isn't a full response. It's one word. Or more precisely, one "token" — roughly a word or part of a word.

One run of the equation equals one word of output. To get a full response, the equation runs many, many times.
-->

---

# Correction #2: The Entire Conversation

The input isn't just your latest message. It's **everything**:

- The system prompt
- All your previous messages
- All the AI's previous responses
- Any files you've uploaded
- Everything generated so far in the current response

**All of it gets re-read. Every time. For every single word.**

<!--
Second correction: the input isn't just your latest message. It's the entire conversation — system prompt, all your messages, all responses, all files, everything.

And here's the critical part: the LLM has no memory between words. It re-reads everything from scratch for every single word it generates.
-->

---

# Why This Matters

Nothing disappears. Once something is in the conversation, it's there forever.

- You can't "unsay" something
- More context isn't always better — it can become noise
- The LLM processes everything, every time

This leads to our first major problem...

<!--
So why does this matter?

Because nothing disappears. Every message, every file, every tangent — it all stays, getting processed over and over.

You can't unsay something. You can't ask the LLM to ignore part of the conversation. It processes everything, every time, for every word.

This leads to our first major problem.
-->

---

# Imagine Watching a Python Tutorial

You're watching a 30-minute Python tutorial on YouTube.

At minute 1, the YouTuber goes on a 2-minute tangent about balloon animals.

**Question:** How much do you care about that balloon section?

<!--
Let me give you a concrete way to visualize what we've been talking about.

Imagine you're watching a 30-minute Python tutorial. At minute 1, the YouTuber randomly goes off on a 2-minute tangent about balloon animals. Completely irrelevant to Python.

How much do you care about that balloon section?
-->

---

# As a Human

Probably not much.

"That was weird, but I'll ignore it."

You have **selective attention** — you can filter out irrelevant content and focus on what matters.

<!--
Probably not much. As a human, you think "that was weird" and move on. You mentally filter it out and focus on the Python content.

That's because humans have selective attention. We can choose to ignore irrelevant information.
-->

---

# Now Imagine You're an LLM

Same tutorial. But there's a catch:

**You can only watch 1 minute before starting over.**

To "watch" the full 30-minute tutorial, you must:
- Watch minutes 0-1, then start over
- Watch minutes 0-2, then start over
- Watch minutes 0-3, then start over
- ...continue until you've reached minute 30

<!--
Now imagine you're an LLM instead of a human.

Same 30-minute tutorial. But you can only process about 1 minute before you have to start over from the beginning.

So to "watch" the full tutorial, you have to watch minutes 0 through 1, then start over. Then 0 through 2, then start over. And so on.

Every time you make progress, you go back to the beginning.
-->

---

# The Balloon Animals Problem

Now ask the question again:

**How much do you care about that 2-minute balloon section?**

You're not watching it once. You're watching it **29 times**.

Every time you try to learn Python, you wade through balloons first.

<!--
Now let's bring back that balloon animal section.

How much do you care about it now?

Suddenly, you care a lot more. Because you're not just watching it once and moving on. You're watching it 29 times.

Every time you're trying to learn Python, you first have to wade through balloon animals again. That irrelevant content isn't a one-time distraction — it's permanent noise.
-->

---

# This Is Context Poisoning

When wrong content gets into the input, it pollutes everything:

- **Tangents** become permanent distractions
- **Mistakes** get reinforced, not forgotten
- **Confusion** compounds with every word generated

The LLM doesn't have selective attention. **It processes everything.**

So managing what goes in is critical.

<!--
This is called context poisoning.

When bad content gets into the conversation, it doesn't just distract once. It gets processed over and over, competing with the relevant content for the model's attention.

The LLM doesn't have selective attention like you do. It processes everything. So managing what goes in is absolutely critical.
-->

---

# So How Do You Write Good Prompts?

We've established:
1. LLM = text in, text out (one word at a time)
2. Everything stays in the input forever
3. Context poisoning is real

Now you need a practical approach.

<!--
So we've established the fundamentals. The LLM is a text equation. Everything stays in the input. Context poisoning is real.

The question is: how do you actually write good prompts? Let's start with a common mistake that reveals two different approaches.
-->

---

# The XY Problem

You have problem **X**. You think solution **Y** will work.

You ask about **Y** instead of **X**.

```
You: "How do I get the last 3 characters of a filename?"
AI:  filename[-3:]

You: "That gave me 'txt' not '.txt'"
AI:  Oh, you wanted the extension? Use os.path.splitext()
```

You asked about your **solution** (Y), not your **problem** (X).

<!--
Here's a common mistake: the XY problem.

You want file extensions. You think "I'll get the last 3 characters." You ask about that.

The AI answers perfectly — filename[-3:]. But that's not what you needed.

You asked about your solution, not your problem. The AI can only work with what you give it.
-->

---

# Two Ways to Prompt

The XY problem reveals two fundamentally different approaches:

| Approach | What You Tell the AI |
|----------|----------------------|
| **Y** — Your solution | "Do these specific steps" |
| **X** — Your problem | "Here's what I need; figure out how" |

Both are valid. But they work very differently.

<!--
This actually reveals two different ways you can prompt.

You can tell the AI your solution — the specific steps to follow.

Or you can tell the AI your problem — what you need, and let it figure out how to get there.

Both are valid approaches. But they work very differently.
-->

---

# Literal Instructions (Enumerative)

When you **know exactly what you want and how to get there**:

```
1. Read the file config.json
2. Find the key "api_endpoint"
3. Replace its value with "https://prod.example.com"
4. Write the file back
```

You're enumerating the steps. The AI follows them literally.

**Use when:** Simple tasks, specific procedures, no decisions needed.

<!--
The first approach: Literal Instructions. Also called enumerative prompting.

You spell out exactly what to do, step by step. The AI follows your instructions literally. No interpretation, no decisions — just execution.

This works great when you know exactly what you want and the path to get there is clear.
-->

---

# The Limitation

Literal instructions work for simple tasks.

But what about:
- "Build a user authentication system"
- "Refactor this module for better testability"
- "Fix the performance issue in this function"

You don't know every step. You need the AI to **make decisions**.

<!--
But literal instructions have a limitation.

For simple, well-defined tasks, they're great. But what about complex tasks where you don't know every step? Where you need the AI to figure out the approach?

You need a different kind of prompt — one that gives the AI room to make decisions.
-->

---

# Decision-Making Prompts (Generative)

When you **know what success looks like but not every step**:

Instead of listing steps, you define:
- What you're trying to achieve
- What constraints must be respected
- What approaches you prefer
- Where to start

The AI generates the approach within your boundaries.

<!--
The second approach: Decision-Making prompts. Also called generative prompting.

Instead of telling the AI exactly what to do, you tell it what success looks like and what constraints apply. The AI figures out how to get there.

You're not enumerating steps — you're generating a solution within boundaries.
-->

---

# Teaching Chess

Imagine you're teaching someone chess.

You **can't** give them a flowchart of every possible game:
- "If they play e4, you play d5..."
- "If they then play Nf3, you play Nc6..."

There are more possible chess games than atoms in the universe.

You can't enumerate the right path ahead of time.

<!--
Imagine you're teaching someone to play chess.

You can't give them a flowchart. You can't say "if they move here, you move there." There are more possible chess games than atoms in the universe.

You can't enumerate the right path ahead of time. So how do you teach chess?
-->

---

# How Do You Actually Teach Chess?

You teach:

| | What You Teach |
|-----------|----------------|
| **Goal** | Checkmate the king |
| **Rules** | How pieces move, what's legal |
| **Strategies** | Control the center, develop pieces early |
| **Opening** | A starting position to work from |

Then they figure out the moves. Within your boundaries.

<!--
Instead of enumerating moves, you teach them the goal — checkmate the king.

You teach them the rules — how pieces move, what moves are legal.

You teach them strategies — control the center, develop your pieces early, castle to protect your king.

And you might teach them an opening — a known starting position to work from.

Then they play. They figure out the actual moves. Within the boundaries you've given them.
-->

---

# Writing a Prompt Is the Same

You can't enumerate every step for complex tasks.

So instead, you define:

| | What You Define |
|-----------|-----------------|
| **Goal** | What success looks like |
| **Rules** | Hard constraints (must/must not) |
| **Strategies** | Soft preferences (prefer/avoid) |
| **Opening** | How to begin |

Then the AI figures out the approach. Within your boundaries.

<!--
Writing a decision-making prompt is exactly the same.

You can't enumerate every step for "build a test automation agent." So you define the goal, the rules, the strategies, and an opening.

The AI figures out the actual steps. Within the boundaries you've given it.

This is the G/R/S/O framework. Let's go through each component.
-->

---

# Goal: What Success Looks Like

**Bad goals:**
- "Help me with this"
- "Make this better"
- "Fix what's wrong"

**Good goals:**
- "Create a script that downloads all PDF files from this folder"
- "Add a button that saves the form data to a spreadsheet"
- "Find why the login page shows a blank screen after clicking submit"

<!--
The Goal defines what success looks like. If you can't describe success, how will you know when you've achieved it?

Bad goals are vague. "Help me" with what? "Better" in what way?

Good goals are specific. You can look at the result and know whether it worked.
-->

---

# Goal Quality Check

Ask yourself:

- Can someone verify success by looking at the output?
- Would two people agree on whether this succeeded?
- Does this distinguish good from mediocre?

If no to any of these, your goal isn't specific enough.

<!--
Quick quality check. Can someone verify success by looking at the output? Would two people agree? Does it distinguish good from mediocre?

If you're answering no to any of these, tighten up your goal before you hit send.
-->

---

# Rules: Hard Constraints

Rules are **must/must not** constraints. Violation = failure.

**Examples:**
- Must work with the existing database
- Must not require users to install anything new
- Must keep the current file structure
- Must complete in under 5 seconds

Cross a rule and the output is wrong — full stop.

<!--
Rules are hard constraints. Cross them and the output is wrong — no negotiation.

These aren't preferences. They're bright lines. The AI needs to know them up front.
-->

---

# Why Rules Matter

Rules eliminate entire regions of output space.

**Without "must not require new installations":**
→ AI might suggest tools that need complex setup

**With "must not require new installations":**
→ AI must use what's already available

The AI isn't smarter — it's searching a smaller space.

<!--
Rules don't make the AI smarter. They eliminate entire categories of wrong answers.

Without the "no new installations" rule, the AI might suggest tools that require complex setup — might be great solutions, but wrong if you can't install them.

The rule eliminates those possibilities before the AI even considers them.
-->

---

# Strategies: Soft Preferences

Strategies are **prefer/avoid** guidelines. Violation = suboptimal, not failure.

**Examples:**
- Prefer simple solutions over clever ones
- Add comments explaining what each section does
- Avoid making changes to files outside the project folder
- Optimize for readability

<!--
Strategies are softer than rules. They're preferences, not requirements.

"Prefer simple solutions" — if the AI does something clever, that's not wrong. It's just not what you wanted. Strategies guide without constraining.
-->

---

# Rules vs. Strategies

| Rules | Strategies |
|-------|------------|
| Must / Must not | Prefer / Avoid |
| Violation = failure | Violation = suboptimal |
| Hard constraint | Soft guidance |
| Eliminates options | Weights options |

**Ask:** If the AI violates this, is the output wrong or just not ideal?

<!--
Here's the key distinction. If the AI ignores this, is the output wrong? Then it's a rule. If it's just not ideal? That's a strategy.

Getting this distinction right helps the AI prioritize correctly.
-->

---

# Opening: How to Begin

The first words commit the trajectory.

**Why it matters:**
- LLMs predict the next word based on everything before
- A wrong start requires "recovering" instead of "building"
- Early decisions compound

**Examples:**
- "Start by reading the existing code to understand the structure"
- "First, list what files already exist in this folder"
- "Begin by asking me clarifying questions"

<!--
The Opening is how you tell the AI to begin. This might seem minor, but it locks in the trajectory.

Start wrong, and you're recovering instead of building. The first few words set the direction for everything that follows.
-->

---

# Putting It Together

**Literal Instructions (enumerative):**
> "Open the settings file, find the email field, change it to my new email, save."

**Decision-Making with G/R/S/O (generative):**
> **Goal:** Create a tool that backs up my important folders daily
>
> **Rules:**
> - Must run automatically without me clicking anything
> - Must not delete the original files
> - Must work on my Windows laptop
>
> **Strategies:**
> - Keep it simple — I don't need fancy features
> - Add a log so I can see what was backed up
>
> **Opening:** Start by asking which folders I want to back up

<!--
Here's both approaches side by side.

Literal instructions are direct: do this, then this, then this.

Decision-making prompts define what success looks like and let the AI figure out how. Same task can be prompted either way — choose based on how much decision-making you want the AI to do.
-->

---

# When to Use Which

| Literal Instructions | Decision-Making (G/R/S/O) |
|---------------------|---------------------------|
| Simple, well-defined tasks | Complex, open-ended tasks |
| You know every step | You know the goal, not the path |
| No decisions needed | Decisions required |
| Quick fixes, small changes | Building new things, solving problems |

**Most real work benefits from G/R/S/O.**

<!--
When do you use which?

Literal instructions work for simple tasks where you know exactly what to do. Changing a setting, renaming files, small tweaks.

Decision-making prompts with G/R/S/O work for everything else — which is most real work. Building tools, automating tasks, solving problems. Anything where you need the AI to think.
-->

---

# Cheat Sheet

**For Decision-Making Prompts:**

```markdown
## Goal
[What success looks like — specific and measurable]

## Rules
[Hard constraints: must/must not]

## Strategies
[Soft preferences: prefer/avoid]

## Opening
[How to begin the task]
```

<!--
Here's your cheat sheet for decision-making prompts.

Goal, Rules, Strategies, Opening. Use this structure when you need the AI to make decisions within your boundaries.
-->

---

# Key Takeaways

1. **LLM = text in, text out** — one word at a time, entire conversation re-read
2. **Context poisoning is real** — manage what goes in carefully
3. **Two approaches:** Literal Instructions (enumerative) vs. Decision-Making (generative)
4. **Use G/R/S/O** for decision-making prompts — Goal, Rules, Strategies, Opening

<!--
Let's recap.

An LLM is text in, text out — one word at a time, re-reading everything each time.

Context poisoning is real. Bad content doesn't disappear.

There are two ways to prompt: literal instructions for simple tasks, and decision-making prompts for complex ones.

For decision-making prompts, use G/R/S/O. It gives the AI the structure it needs to make good decisions.
-->

---

# Try It: Kahuna

A tool that helps manage context for your AI copilot.

**Step 1:** Install Claude Code
→ https://code.claude.com/docs/en/quickstart

**Step 2:** Install Kahuna
→ https://www.npmjs.com/package/@aurite-ai/kahuna

**Step 3:** Say "Set up Kahuna" in your project

**Step 4:** Teach it context from our shared drive (example context for AI agents)

<!--
If you want to practice with a real tool, try Kahuna.

First, install Claude Code — that's the coding copilot from Anthropic. Then install the Kahuna package from npm.

Once it's set up, you can teach it context. We have example documents in our shared Google Drive folder that you can use to practice.
-->

---

# Questions?

Use the G/R/S/O cheat sheet for your next complex task.

```markdown
## Goal
[What success looks like]

## Rules
[Must/must not constraints]

## Strategies
[Prefer/avoid guidelines]

## Opening
[How to begin]
```
