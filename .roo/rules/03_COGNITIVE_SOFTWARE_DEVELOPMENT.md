# Cognitive Software Development

## Core Principle

> **For cognitive systems, design flows from information structure — not from mechanisms or intuition. Define the structure; the operations emerge as logical necessities.**

Kahuna is a cognitive system — it processes knowledge, manages attention, and supports memory across sessions. Traditional software methodologies don't address these problems. Cognitive software development provides the framework.

---

## Prompt Specificity Principle

> **LLM performance scales inversely with responsibility breadth.**

The more focused the prompt (including loaded rules), the better the output quality.

| Level | Implication |
|-------|-------------|
| **Rule Documents** | Minimum viable rule set; reference material linked, not loaded |
| **Agent Prompts** | Single responsibility per agent; narrow task scope |
| **Context Selection** | Retrieve only what's relevant; less is more |
| **KB Entry Design** | Focused entries that serve specific use cases |

**Practical Application:** If context can be linked rather than loaded, link it. If guidance is rarely needed, move to reference. If detail doesn't inform immediate action, it's reference material.

---

## Right Abstraction Level

The productive abstraction level for cognitive system design:

> **Computational functions with defined interfaces, validated by triple parallel, justified by physics constraints.**

| Level | Status | Example |
|-------|--------|---------|
| **Too Abstract** | ❌ Avoid | "Brain and AI ARE mathematically identical" |
| **Too Abstract** | ❌ Avoid | "Systems work BECAUSE they minimize free energy" |
| **Just Right** | ✅ Use | "Retrieval subsystem queries index, returns ranked candidates" |
| **Just Right** | ✅ Use | "Consolidation pipeline: Extract → Integrate → Verify" |
| **Too Concrete** | ❌ Avoid | "Use cosine similarity with threshold 0.7" |
| **Too Concrete** | ❌ Avoid | "Synaptic plasticity mechanisms" |

---

## Anti-Patterns

Avoid these common mistakes:

1. **Mathematical Identity Claims** — "X and Y ARE the same" → Say "similarly described"
2. **QM Integration** — Quantum mechanics as foundation → Stick to triple parallel
3. **Emergence Without Mechanism** — "X emerges from Y" without derivation → Show the chain
4. **Necessity From Constraints** — "Constraints REQUIRE X" → Say "create pressure toward"
5. **Framework Reification** — "Works BECAUSE of FEP" → Use as heuristic only
6. **Sequential Subsystem Design** — Fully design one before others → Grow in parallel

→ Full descriptions: [Cognitive Methodology Reference](../../docs/reference/cognitive-methodology.md#anti-patterns-full-descriptions)

---

## When To Use

| Use Cognitive SW Dev When | Use Traditional Dev When |
|--------------------------|--------------------------|
| System processes knowledge | Data processing is mechanical |
| "Attention" or "relevance" matters | All inputs treated equally |
| Memory/retrieval is core | Stateless or simple state |
| LLMs or cognitive components | No cognitive components |

---

## Quick Reference

### Derivation Checklist

When designing a cognitive function:

- [ ] What constraints apply? (Physics, capacity, consistency)
- [ ] What does triple parallel show? (Brain, computer, AI)
- [ ] What's the structural invariant? (What MUST be true)
- [ ] What claim strength applies? (Established, Derived, Observed, Hypothesis)
- [ ] What are the interfaces? (Inputs, outputs, contracts)
- [ ] Right abstraction level? (Functions, not mechanisms or ontology)

### Common Mistakes Checklist

Before finalizing a design:

- [ ] No mathematical identity claims?
- [ ] No framework reification?
- [ ] Parallel development (not sequential)?

---

## Success Criteria

**Working:** Features trace to information structure requirements; computational models exist before implementation; interfaces are explicit and stable; claim strengths are explicit.

**Failing:** "It seemed right" justifications; systems resist integration; anti-patterns appear; empirical results can't be explained by models.

---

## Reference

For detailed methodology, theory, techniques, and glossary:
→ [Cognitive Methodology Reference](../../docs/reference/cognitive-methodology.md)

---

## Changelog

- v3.0 (2026-03-07): Consolidated; added Prompt Specificity Principle; reference material moved to `docs/reference/cognitive-methodology.md`
- v2.0 (2026-03-07): Added derivation pattern, triple parallel, anti-patterns, parallel development
- v1.0 (2026-03-04): Initial methodology definition
