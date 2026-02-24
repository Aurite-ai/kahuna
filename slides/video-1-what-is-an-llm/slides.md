---
marp: true
theme: default
paginate: true
---

# What Is an LLM?

Demystifying Large Language Models

<!--
Welcome to the first video in this series on understanding LLMs and using coding copilots effectively.

By the end of this video, you'll see that despite all the fancy features and marketing terms, LLMs are remarkably simple at their core.
-->

---

# The Modern AI Landscape

Today's AI tools seem complex and magical:

- **ChatGPT** - conversations, file uploads, image generation
- **Claude Code** - coding assistance, tools, sub-agents
- **AI Assistants** - skills, plugins, integrations

Each new feature makes it feel like AI is evolving rapidly...

<!--
When you look at modern AI tools, they seem incredibly sophisticated. New features get announced constantly. It can feel overwhelming to keep up.

But here's the thing - all of this apparent complexity hides a surprisingly simple truth.
-->

---

# The Promise

By the end of this video, you'll see that:

**All of these features reduce to one simple equation.**

- One input
- One output
- That's it

<!--
I'm going to show you that no matter how many features get added, no matter how sophisticated the interface looks, it all comes down to a single mathematical equation.

Once you understand this, everything else becomes clear.
-->

---

# What Does LLM Stand For?

**L**arge **L**anguage **M**odel

The key word is **Model**.

In math and science, a "model" is an equation that takes inputs and produces outputs.

<!--
Let's break down the acronym. Large Language Model.

The word that matters most here is "Model." In mathematics and science, when we call something a model, we mean it's an equation - a function that takes inputs and produces outputs.

That's literally what an LLM is. A math equation. A very large one, but still just an equation.
-->

---

# The Core Equation

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   INPUT ──────────►  LLM  ──────────► OUTPUT        │
│   (text)          (equation)         (text)         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- **Input:** Text
- **Output:** Text

That's the entire thing.

<!--
Here it is. The entire LLM, visualized.

Text goes in. Text comes out. There's a mathematical equation in the middle that transforms the input into the output.

That's it. That's the whole thing. Everything else is just details about what text goes in and how the output text gets used.
-->

---

# It's Always Just LLMs

| Concept | Definition | Product Examples |
|---------|-------------------|------------------|
| AI Agent / Assistant | An LLM with a defined role | ChatGPT, Claude Website |
| Coding Copilot | An LLM with tools for coding | Claude Code, Cursor |

That's it. Define a role in the system prompt → you have an agent.

Add coding tools → you have a coding copilot.

<!--
Let's demystify some of these terms you've probably heard.

An AI Agent or AI Assistant - these are really the same thing. It's an LLM with a defined role. That role is specified in the system prompt. "You are a helpful assistant" - congratulations, you have an AI assistant. "You are a code reviewer that checks for security issues" - now you have an AI agent focused on security.

The only difference between "agent" and "assistant" is whether it assists the user directly or performs autonomous work. But mechanically, they're identical: an LLM with a role.

A coding copilot is just an LLM with tools that help with coding - file reading, code execution, terminal access. That's what makes Claude Code or Cursor different from the regular Claude website.

But at the core? Still just text in, text out.
-->

---

# Everything Reduces to Text Input

All those features? They're just text formatted into the input:

| Feature | What It Really Is |
|---------|-------------------|
| System Prompt | Text explaining the role and responsibility of the LLM |
| Rules | Text explaining the rules the LLM must follow |
| User Message | The text you send |
| File Uploads | File contents converted to text |
| Tool Calls | Text describing available tools |
| Sub-Agents | Start a new conversation with new text |
| Skills | Conditional text only included for specific tasks |

<!--
Let me show you something that might surprise you.

Every single feature you've seen in AI tools - system prompts, rules, file uploads, tools, sub-agents, skills - they're ALL just text that gets formatted into the input.

When you upload a file, it gets converted to text. When a tool is available, its description becomes text. Sub-agents? Just starting a new conversation with different text in the input.

There's no magic. It's all text.
-->

---

# How Text Comes Together

The input is assembled in a specific order:

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
│  5. FILE UPLOADS                                       │
│     [Contents of uploaded files as text]               │
└───────────────────────────────────────────────────────┘
```

<!--
Here's how all that text actually comes together to form the input.

First comes the system prompt - this sets up who the LLM is supposed to be.

Then rules get appended - these are guidelines the LLM must follow.

Next, if there's a skill active, its text gets added. Skills are conditional - they only appear when you're doing a specific type of task. Think of them like "mode-specific rules."

For example, in Roo Code, when you're in Architect mode, you get special rules from an ARCHITECT_MODE file. Other modes don't see those rules. Same idea with Claude Code's agent skills - they're text that only gets included for specific situations.

Then your message, and finally any file contents you've uploaded.

All of it becomes one big text input to the equation.
-->

---

# But Really, It's Just One String

All those sections? They get concatenated into one continuous text:

```
You are an AI assistant that helps with coding tasks.
Always follow these guidelines: be concise, explain
your reasoning, and ask clarifying questions. For this
specific task, focus on architecture and design. Help
me build a feature that handles user authentication.
Here is the current code: def login(username, password):
    if check_credentials(username, password): return
    create_session(username) ...
```

No structure. No sections. Just text.

<!--
But here's the key insight I want you to really internalize.

When we showed those nice labeled sections - system prompt, rules, skill, user message, file uploads - that's just how we THINK about organizing the input.

To the LLM? It's all just one continuous string of text. No headers. No separators. No structure.

Just characters, one after another. The LLM has no concept of "this part is a system prompt" and "this part is a file upload." It just sees text.

This is why managing what goes in is so important - you can't rely on the LLM to know which parts to prioritize or ignore.
-->

---

# What Most People Assume

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  "What is 2+2?"  ───►  LLM  ───►  "The answer is 4" │
│                                                     │
└─────────────────────────────────────────────────────┘
```

You send a message. The LLM sends back a response.

Simple, right?

<!--
Now let's look at how most people think about the equation.

You type "What is 2+2?", hit send, and the LLM gives you back "The answer is 4." It seems like your message goes in, and the complete response comes out.

This mental model feels intuitive. But it's actually wrong in two important ways.
-->

---

# Correction #1: The Output

The output isn't a full response. It's **one word**.

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│      "What is 2+2?"  ───►  LLM  ───►  "The"         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Each time the equation runs, it produces exactly one word.

<!--
First correction: the output.

When the LLM runs, it doesn't produce "The answer is 4." It produces just "The." One word. That's it.

Or more precisely, one "token" - which is roughly a word or part of a word.

One run of the equation equals one word of output. So how do you get a full response? The equation has to run many, many times.
-->

---

# Correction #2: The Input

The input isn't just your most recent message. It's **the entire conversation**.

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   INPUT ──────────►  LLM  ──────────► OUTPUT        │
│   (entire         (equation)         (ONE word)     │
│    conversation)                                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Every message. Every response. Every file. Everything.

<!--
Second correction: the input.

The input isn't just your latest message. It's the entire conversation - your system prompt, all your previous messages, all of the LLM's previous responses, any files you've uploaded, everything.

All of it goes into the equation. Every single time. For every single word.
-->

---

# The Full Picture

To produce a 100-word response, the equation runs 100 times.

**Each time:**
- Input = the ENTIRE conversation (including words generated so far)
- Output = ONE new word

The LLM has no memory between words. It re-reads everything, every time.

<!--
Now let's put this together.

To produce a 100-word response, the LLM doesn't run once. It runs 100 times. Once for each word.

And here's the critical part: each time it runs, it reads the ENTIRE conversation from scratch. The system prompt, all your messages, all its previous responses, and all the words it's generated so far in the current response.

The LLM has no memory between words. It's like reading a book from the beginning every time you want to read the next sentence.
-->

---

# Visualizing the Process

```
Word 1:   "What is 2+2?"───────────────────► "The"
Word 2:   "What is 2+2? The" ───────────► "answer"
Word 3:   "What is 2+2? The answer" ────► "is"
Word 4:   "What is 2+2? The answer is" ─► "4"
Output: "The answer is 4"
```

The input keeps growing. The equation keeps re-running.

<!--
Here's what that looks like visually.

For word one, the LLM reads the entire conversation and outputs "The."
For word two, it reads the entire conversation PLUS "The" and outputs "answer."
For word three, it reads everything again, including "The answer," and outputs "is."
And so on.

Notice how the input keeps growing? The LLM has to process more and more text with each word it generates. Every piece of context gets re-read for every single word.
-->

---

# Why This Matters

**Old messages don't disappear.**

This means:
- You can't "unsay" something - mistakes and tangents persist
- More context isn't always better - it can become noise
- The LLM can't "focus" or "ignore" - it processes everything

The rest of this course is entirely focused on managing what goes into that input.

<!--
So why does all of this matter?

Because nothing disappears. Once something is in the conversation, it's there forever. Every message, every file, every tangent - it all stays, getting processed over and over.

You can't unsay something. You can't ask the LLM to ignore part of the conversation. It processes everything, every time, for every word.

This means that more context isn't always better. Irrelevant content becomes noise that competes with the signal.

The rest of this course is about managing what goes into that input - because that's what determines the quality of what comes out.
-->

---

# Imagine Watching a Python Tutorial

You're watching a 30-minute Python tutorial on YouTube.

At minute 1, the YouTuber goes on a 2-minute tangent about balloon animals.

**Question:** How much do you care about that balloon section?

As a human, probably not much. "That was weird, but I'll ignore it."

Humans have **selective attention** - we filter out irrelevant content.

<!--
Let me give you a concrete way to visualize what we've been talking about.

Imagine you're a human watching a 30-minute Python tutorial on YouTube. At minute 1, the YouTuber randomly goes off on a 2-minute tangent about balloon animals. Completely irrelevant to Python.

How much do you care about that balloon section?

Probably not much. As a human, you think "that was weird" and move on. You mentally filter it out and focus on the Python content that matters.

That's because humans have selective attention. We can choose to ignore irrelevant information and focus on what's important.
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
Now let's imagine you're an LLM instead of a human.

Same 30-minute Python tutorial. But here's the catch: you can't watch the full video in one go. You can only process about 1 minute of content before you have to start over from the beginning.

So to "watch" the full tutorial, you have to watch minutes 0 through 1, then start over. Then watch minutes 0 through 2, then start over. Then 0 through 3, and so on.

Every time you make progress, you have to go back to the beginning and watch everything again.
-->

---

# The Balloon Animals Problem

Now let's ask the question again:

**How much do you care about that 2-minute balloon section?**

You're not watching it once. You're watching it **29 times**.

Every time you try to learn Python, you wade through balloons first.

This is called **context poisoning** - we'll explore it in Video 2.

<!--
Now let's bring back that balloon animal section and ask the question again.

How much do you care about that 2-minute tangent on balloon animals?

Suddenly, you care a lot more. Because you're not just watching it once and moving on. You're watching it over and over and over again.

Since the balloon section starts at minute 1, and you have to rewatch from the beginning every time you make progress, you end up watching that irrelevant balloon content 29 times.

Every time you're trying to learn Python, you first have to wade through balloon animals again. That irrelevant content isn't a one-time distraction - it's permanent noise that you process over and over.

This is called context poisoning. And we'll explore it in depth in Video 2.
-->

---

# Key Takeaways

1. **LLM = Math equation** - text in, text out
2. **All features are just text** formatted into the input
3. **One word at a time** - the equation runs once per word
4. **Entire conversation goes in** - re-read for every word generated

<!--
Let's recap what we covered.

An LLM is a math equation. Text in, text out. That's it.

All the fancy features - tools, agents, file uploads, skills - are just text that gets formatted into the input. There's no magic.

The LLM produces one word at a time, which means the equation runs many times to generate a full response.

And critically: the entire conversation - system prompt, all messages, all responses - goes into the input every time.

This is the foundation for understanding everything else in this course.
-->

---

# Coming Up Next

**Video 2: Context Poisoning**

Now that you know everything goes into the input...

What happens when the *wrong things* go in?

<!--
In the next video, we'll explore context poisoning.

Now that you understand that the entire conversation goes into the equation every time, the natural question is: what happens when bad content gets in there?

The answer is: it poisons everything. We'll see exactly why, and what to do about it.

See you in Video 2.
-->
