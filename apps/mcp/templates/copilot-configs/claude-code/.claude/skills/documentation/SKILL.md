---
name: documentation
description: Searches for relevant documentation. Use to gather details on specific libraries or APIs. Use when you are instructed to use a specific technology, but are not given details about it in the context
---

# Searching for Developer Documentation

## 1. **Start with Official Sources**
- Add `docs` or `documentation` to your search
- Include the official site: `site:docs.python.org asyncio`
- Check GitHub repos for `/docs` folders

## 2. **Use Precise Technical Terms**
```
❌ "how to make API work"
✅ "REST API authentication bearer token"
✅ "Django ORM filter multiple conditions"
```

## 3. **Version Matters**
- Always include version numbers: `React 18 hooks`
- Add year for recent changes: `JavaScript 2024`
- Use "latest" cautiously—it may show outdated results

## 4. **Leverage Stack Overflow Effectively**
- Add `site:stackoverflow.com` for Q&A format
- Sort by votes, not just date
- Check if the accepted answer is still current

## 5. **Search GitHub for Real Examples**
```
site:github.com "import tensorflow" "image classification"
site:github.com filename:package.json "next.js"
```

## 6. **Use Quotes for Exact Matches**
- `"cannot find module"` - finds exact error messages
- `"deprecated in version"` - finds migration guides

## 7. **Exclude Noise**
```
python pandas -tutorial -beginner
node.js -npm (when you want Node core docs)
```

## 8. **Quick Reference Sites**
- DevDocs.io - aggregated documentation
- MDN for web standards
- Can I Use for browser compatibility

## 9. **When Stuck**
- Search the error message in quotes
- Add your language/framework name
- Try `"solved"` or `"workaround"` for known issues