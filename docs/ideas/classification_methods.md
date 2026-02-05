# Content Classification Methods

**Context:** We need to classify incoming files in the Knowledge Base System to determine their category (policy, tool, workflow, context, etc.) and extract metadata for organization and retrieval.

**Goal:** Identify the best classification approach balancing accuracy, speed, cost, and implementation complexity.

---

## Method Comparison

### 1. LLM Structured Output

**How it works:** Send content to an LLM with a prompt requesting classification. Use structured output (JSON mode / tool calling) to get back a validated category.

```typescript
const response = await llm.complete({
  prompt: `Classify this document...`,
  responseFormat: CategoryOutputSchema, // Zod schema
});
```

| Aspect | Assessment |
|--------|------------|
| **Accuracy** | High - LLMs understand semantic nuance well |
| **Latency** | Slow (~1-3 seconds per classification) |
| **Cost** | Higher - pay per token for each classification |
| **Cold Start** | None - works immediately with zero examples |
| **Novel Content** | Excellent - handles ambiguous/new content well |
| **Consistency** | Moderate - may vary across calls |
| **Implementation** | Simple - single API call |

**Best for:** Low volume, complex/varied content, when you need additional extraction (summaries, tags, entities).

---

### 2. Embedding + Similarity Search

**How it works:**
1. Pre-embed example documents for each category (exemplars)
2. Embed incoming content
3. Find nearest exemplar via cosine similarity
4. Assign that category

```typescript
const embedding = await embedder.embed(content);
const nearest = await vectorDB.findNearest(embedding, { topK: 1 });
return nearest.category;
```

| Aspect | Assessment |
|--------|------------|
| **Accuracy** | Good - depends on exemplar quality |
| **Latency** | Fast (~10-50ms after embedding) |
| **Cost** | Lower - embeddings are cheap |
| **Cold Start** | Requires good exemplar documents |
| **Novel Content** | Moderate - struggles with truly new categories |
| **Consistency** | High - same input always gets same output |
| **Implementation** | Medium - need embedding pipeline + vector storage |

**Best for:** High volume, predictable content types, when you have good training examples.

---

### 3. Hybrid: Embedding First, LLM Fallback

**How it works:**
1. Try embedding-based classification
2. Check confidence (distance to nearest exemplar)
3. If low confidence → fall back to LLM
4. Optionally: add LLM-classified docs to exemplar set

```typescript
const embedding = await embedder.embed(content);
const { nearest, distance } = await vectorDB.findNearest(embedding);

if (distance < CONFIDENCE_THRESHOLD) {
  return nearest.category;
}

// Low confidence - use LLM
const result = await llmClassifier.classify(content);
await vectorDB.addExemplar(embedding, result.category); // Self-improve
return result.category;
```

| Aspect | Assessment |
|--------|------------|
| **Accuracy** | Highest - best of both approaches |
| **Latency** | Fast for common cases, slow for edge cases |
| **Cost** | Decreases over time as exemplars improve |
| **Cold Start** | Graceful - starts with LLM, builds exemplars |
| **Novel Content** | Excellent - LLM handles edge cases |
| **Consistency** | High for common cases |
| **Implementation** | Complex - two systems + confidence logic |

**Best for:** Production systems that start with limited data but need to scale.

---

### 4. Fine-Tuned Local Model

**How it works:** Train a small classification model (DistilBERT, TinyBERT) on labeled examples, run inference locally.

```typescript
const model = await loadModel('./classification-model');
const prediction = await model.predict(content);
return prediction.category;
```

| Aspect | Assessment |
|--------|------------|
| **Accuracy** | Very high with good training data |
| **Latency** | Very fast (~5-20ms) |
| **Cost** | Zero per-call cost after training |
| **Cold Start** | Requires substantial labeled data |
| **Novel Content** | Poor - limited to trained categories |
| **Consistency** | Very high - deterministic |
| **Implementation** | High - ML pipeline, training, deployment |

**Best for:** High volume with stable categories and abundant training data.

---

## Embedding Providers to Research

### Cloud APIs

| Provider | Model | Dimensions | Cost | Notes |
|----------|-------|------------|------|-------|
| **OpenAI** | text-embedding-3-small | 1536 | $0.02/1M tokens | Most popular, good quality |
| **OpenAI** | text-embedding-3-large | 3072 | $0.13/1M tokens | Higher quality, higher cost |
| **Cohere** | embed-english-v3.0 | 1024 | $0.10/1M tokens | Good multilingual support |
| **Voyage AI** | voyage-large-2 | 1536 | $0.12/1M tokens | Optimized for retrieval |
| **Google** | textembedding-gecko | 768 | Vertex pricing | Good if already on GCP |

### Local/Self-Hosted

| Model | Dimensions | RAM Required | Notes |
|-------|------------|--------------|-------|
| **all-MiniLM-L6-v2** | 384 | ~100MB | Fast, good quality for size |
| **all-mpnet-base-v2** | 768 | ~400MB | Better quality, slower |
| **bge-small-en** | 384 | ~100MB | Optimized for retrieval |
| **nomic-embed-text** | 768 | ~250MB | Good open-source option |

### Key Questions to Research

1. **Quality vs Cost:** How much accuracy do we lose with cheaper/smaller embeddings?
2. **Latency:** Local model latency vs API call overhead?
3. **Batching:** Can we batch multiple documents for efficiency?
4. **Hybrid Model:** What's a good confidence threshold for LLM fallback?

---

## Vector Storage Options

### For Local Development

| Option | Persistence | Notes |
|--------|-------------|-------|
| **In-memory + JSON** | File-based | Simplest, fine for small scale |
| **LanceDB** | File-based | Lightweight, no server needed |
| **Chroma** | File-based | Easy to use, good for dev |
| **SQLite + vector ext** | File-based | sqlite-vec extension |

### For Production

| Option | Hosted? | Notes |
|--------|---------|-------|
| **Pinecone** | Yes | Managed, scales well |
| **Weaviate** | Both | Good hybrid search |
| **Qdrant** | Both | Fast, good filtering |
| **pgvector** | Self-host | If already using Postgres |

---

## Recommended Research Path

1. **Start with benchmarking** - Collect 50-100 example documents across our categories
2. **Test embedding quality** - Try OpenAI small vs local models on our actual content
3. **Measure accuracy** - What % of documents are classified correctly?
4. **Calculate costs** - At expected volume, what does each approach cost?
5. **Prototype hybrid** - Build simple version to validate confidence threshold concept

---

## Decision Framework

| If... | Then consider... |
|-------|------------------|
| Volume < 100/day, budget available | LLM-only (simplest) |
| Volume > 1000/day, predictable content | Embedding-only |
| Mixed content, need to scale | Hybrid approach |
| Offline requirement | Local embedding model |
| Already have labeled data | Fine-tuned local model |

---

## References

- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [MTEB Leaderboard](https://huggingface.co/spaces/mteb/leaderboard) - Embedding model benchmarks
- [Sentence Transformers](https://www.sbert.net/) - Local embedding models
- [LangChain Text Splitters](https://python.langchain.com/docs/modules/data_connection/document_transformers/) - Chunking strategies
