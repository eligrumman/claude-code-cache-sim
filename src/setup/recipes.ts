export type RecipeId =
  | "ttl"
  | "keep-warm"
  | "same-prompt"
  | "large-context"
  | "auto-approve"
  | "route"
  | "delegate"
  | "compact"
  | "lazy";

export type RecipeMechanism =
  | "env"
  | "settings.json"
  | "CLAUDE.md"
  | "slash-command"
  | "agent-file"
  | "behavioral";

export interface SetupRecipe {
  id: RecipeId;
  title: string;
  what: string;
  mechanism: RecipeMechanism;
  snippet: string;
  caveat: string;
}

export const recipes: readonly SetupRecipe[] = [
  {
    id: "ttl",
    title: "Cache TTL",
    what: "Choose 5-min (cheaper writes) or 1-hour (survives longer breaks) prefix-cache lifetime.",
    mechanism: "env",
    snippet: `# API key / Bedrock / Vertex default is 5-min; opt into 1-hour:
export ENABLE_PROMPT_CACHING_1H=1`,
    caveat: "On Claude subscription (Pro/Max) 1-hour is automatic by default; on API keys / cloud providers the default is 5-min. Version/provider dependent.",
  },
  {
    id: "keep-warm",
    title: "Keep a cached prefix alive",
    what: "Avoid a cold rebuild after a break.",
    mechanism: "behavioral",
    snippet: `# No explicit keep-alive ping exists. Keep sending requests, or after a
# break restore an already-cached earlier point:
/rewind <turn-number>`,
    caveat: "TTL is passive — silence past the TTL expires the cache. /rewind restores an already-cached turn rather than pinging.",
  },
  {
    id: "same-prompt",
    title: "Shared prefix for subagents",
    what: "Give parallel subagents byte-identical instruction prefixes so they share stable system-prompt content.",
    mechanism: "agent-file",
    snippet: `# ~/.claude/agents/researcher.md
---
name: researcher
description: Deep research agent for search + analysis.
model: sonnet
tools: Read, Grep, WebSearch, WebFetch
---
You are a research specialist. Search comprehensively; flag uncertainties.`,
    caveat: "Subagents build their own cache from turn 1 — the shared part is stable system-prompt content (CLAUDE.md, rules). Explore/Plan agents skip CLAUDE.md by design.",
  },
  {
    id: "large-context",
    title: "Stable context ordering",
    what: "Keep stable system/repo context first, changing task last, so the prefix stays cache-hittable.",
    mechanism: "CLAUDE.md",
    snippet: `# CLAUDE.md — keep this stable between turns
## Architecture
[stable conventions]
## Build commands
npm run dev
npm run test
# Then in chat, reference task files by name (Claude reads them fresh)
# instead of pasting them, so the stable prefix above stays a cache hit.`,
    caveat: "Claude Code already orders context by stability; you influence it by keeping CLAUDE.md/rules stable and deferring file-specific context to on-demand reads. Changing MCP tool defs mid-session invalidates the cache.",
  },
  {
    id: "auto-approve",
    title: "Fewer approval round-trips",
    what: "Cut permission prompts so messages stay within the cache TTL.",
    mechanism: "settings.json",
    snippet: `// .claude/settings.json — auto-accept edits
{ "permissions": { "defaultMode": "acceptEdits" } }
// or scope specific safe commands:
{ "permissions": { "allow": ["Bash(npm run *)", "Bash(git commit *)", "Read(.)"] } }`,
    caveat: "acceptEdits auto-approves edits + common fs ops. Deny rules always win. Keep destructive ops gated. No --dangerously-skip-permissions in interactive Claude Code (SDK/non-interactive only).",
  },
  {
    id: "route",
    title: "Model + effort selection",
    what: "Pick model per task; effort controls reasoning spend.",
    mechanism: "slash-command",
    snippet: `# switch model mid-session (invalidates cache — prefer at start)
/model sonnet
// persistent default — .claude/settings.json
{ "model": "sonnet" }`,
    caveat: "Model + effort are part of the cache key — switching mid-session invalidates the whole cache. Subagents inherit the parent model unless a model: field overrides.",
  },
  {
    id: "delegate",
    title: "Give subagents smaller backpacks",
    what: "Spawn scoped agents so the 1M main context isn't dragged through every task.",
    mechanism: "agent-file",
    snippet: `# .claude/agents/refactorer.md
---
name: refactorer
description: Refactor for readability/perf. Use when asked to refactor/consolidate.
model: sonnet
tools: Read, Edit, Bash, Grep
---
Analyze, apply changes incrementally, verify with tests.
# then: "Use the refactorer agent to clean up the auth module."`,
    caveat: "Project agents live in .claude/agents/; global in ~/.claude/agents/. Each subagent has its own scoped context + inherited permissions.",
  },
  {
    id: "compact",
    title: "Auto-compact / manual compact",
    what: "Summarize history before it dominates input.",
    mechanism: "slash-command",
    snippet: `# manual compact at a natural break (cheapest while cache warm)
/compact
// settings.json — compact threshold (tokens)
{ "autoCompactWindow": 500000 }
# disable auto-compact
export DISABLE_AUTO_COMPACT=1`,
    caveat: "autoCompactWindow default is model-tuned; lower = compact more often. Compaction invalidates the conversation layer but keeps stable system/project layers. Version dependent.",
  },
  {
    id: "lazy",
    title: "Lazy-load skills + MCP tools",
    what: "Load skill bodies / MCP schemas on demand, not all at startup.",
    mechanism: "env",
    snippet: `# ~/.claude/skills/api-guide/SKILL.md
---
description: REST API design reference. Use when asked about API design/HTTP.
---
[large body loads only when invoked]
# MCP tool schemas are deferred by default (names listed, schemas on demand).
# Force all schemas upfront if you want predictability:
export ENABLE_TOOL_SEARCH=false`,
    caveat: "Skill descriptions (~one line each) load at startup; full bodies load on invoke. MCP tools deferred by default on models supporting tool search; some gateways/providers load them into the prefix. Version dependent.",
  },
] as const;

export const recipeById = Object.fromEntries(
  recipes.map((recipe) => [recipe.id, recipe]),
) as Record<RecipeId, SetupRecipe>;

export interface DiagnoseAnswer {
  id: string;
  label: string;
  points: number;
  recommendation?: string;
  recipeId?: RecipeId;
}

export interface DiagnoseQuestion {
  id: string;
  prompt: string;
  answers: readonly DiagnoseAnswer[];
}

export const diagnoseQuestions: readonly DiagnoseQuestion[] = [
  { id: "ttl", prompt: "Cache TTL configured for your provider?", answers: [
    { id: "set", label: "Set, or subscription default", points: 10 },
    { id: "unsure", label: "Unsure", points: 5, recommendation: "Set ENABLE_PROMPT_CACHING_1H=1 on API keys.", recipeId: "ttl" },
    { id: "unknown", label: "Unknown", points: 0, recommendation: "Set ENABLE_PROMPT_CACHING_1H=1 on API keys.", recipeId: "ttl" },
  ] },
  { id: "permissions", prompt: "Permission prompts interrupting flow?", answers: [
    { id: "rare", label: "Rare / scoped", points: 10 },
    { id: "few", label: "A few", points: 8, recommendation: "Use acceptEdits + allow rules.", recipeId: "auto-approve" },
    { id: "frequent", label: "Frequent", points: 5, recommendation: "Use acceptEdits + allow rules.", recipeId: "auto-approve" },
    { id: "constant", label: "Constant", points: 0, recommendation: "Use acceptEdits + allow rules.", recipeId: "auto-approve" },
  ] },
  { id: "models", prompt: "Switch models mid-session?", answers: [
    { id: "never", label: "Never", points: 10 },
    { id: "rare", label: "Rarely", points: 8, recommendation: "Set a default model; use subagents instead of mid-session /model.", recipeId: "route" },
    { id: "occasional", label: "Occasionally", points: 5, recommendation: "Set a default model; use subagents instead of mid-session /model.", recipeId: "route" },
    { id: "frequent", label: "Frequently", points: 0, recommendation: "Set a default model; use subagents instead of mid-session /model.", recipeId: "route" },
  ] },
  { id: "subagents", prompt: "Use subagents for side tasks?", answers: [
    { id: "custom", label: "2+ custom agents", points: 10 },
    { id: "sometimes", label: "Sometimes", points: 8, recommendation: "Define researcher + refactorer agents.", recipeId: "delegate" },
    { id: "rare", label: "Rarely", points: 5, recommendation: "Define researcher + refactorer agents.", recipeId: "delegate" },
    { id: "never", label: "Never", points: 0, recommendation: "Define researcher + refactorer agents.", recipeId: "delegate" },
  ] },
  { id: "claude-md", prompt: "CLAUDE.md stable?", answers: [
    { id: "very", label: "Very stable", points: 10 },
    { id: "mostly", label: "Mostly stable", points: 8, recommendation: "Move ephemeral notes to MEMORY.md.", recipeId: "large-context" },
    { id: "changes", label: "Often changes", points: 5, recommendation: "Move ephemeral notes to MEMORY.md.", recipeId: "large-context" },
    { id: "rewrite", label: "Rewrite mid-session", points: 0, recommendation: "Move ephemeral notes to MEMORY.md.", recipeId: "large-context" },
  ] },
  { id: "references", prompt: "Large refs in skills, not CLAUDE.md?", answers: [
    { id: "yes", label: "Yes", points: 10 },
    { id: "partial", label: "Partially", points: 8, recommendation: "Move >100-line refs to skills.", recipeId: "lazy" },
    { id: "mostly", label: "Mostly in CLAUDE.md", points: 5, recommendation: "Move >100-line refs to skills.", recipeId: "lazy" },
    { id: "none", label: "No large refs", points: 10 },
  ] },
  { id: "mcp", prompt: "MCP tools deferred?", answers: [
    { id: "search", label: "Tool search on", points: 10 },
    { id: "unsure", label: "Unsure", points: 5, recommendation: "Leave tool search default on.", recipeId: "lazy" },
    { id: "upfront", label: "Forced upfront", points: 5, recommendation: "Leave tool search default on.", recipeId: "lazy" },
    { id: "none", label: "No MCP", points: 10 },
  ] },
  { id: "compact", prompt: "Compact at breaks?", answers: [
    { id: "manual", label: "Manually", points: 10 },
    { id: "auto", label: "Automatically", points: 10 },
    { id: "rare", label: "Rarely / sessions are short", points: 10 },
    { id: "unknown", label: "Unknown", points: 5, recommendation: "Enable autoCompactWindow.", recipeId: "compact" },
  ] },
  { id: "agent-models", prompt: "Subagent models tuned?", answers: [
    { id: "yes", label: "Yes", points: 10 },
    { id: "mostly", label: "Mostly inherit", points: 8, recommendation: "Add model: haiku/sonnet to agent frontmatter.", recipeId: "delegate" },
    { id: "all", label: "All inherit", points: 5, recommendation: "Add model: haiku/sonnet to agent frontmatter.", recipeId: "delegate" },
    { id: "none", label: "No subagents", points: 5, recommendation: "Add model: haiku/sonnet to agent frontmatter.", recipeId: "delegate" },
  ] },
] as const;

export type Grade = "A" | "B" | "C" | "D" | "F";

export const gradeCopy: Record<Grade, string> = {
  A: "cache-efficient",
  B: "good foundation",
  C: "room to improve",
  D: "not prioritized yet",
  F: "big efficiency gap",
};

export function diagnoseScore(answerIds: Readonly<Record<string, string>>): number {
  const raw = diagnoseQuestions.reduce((total, question) => {
    const answer = question.answers.find((candidate) => candidate.id === answerIds[question.id]);
    return total + (answer?.points ?? 0);
  }, 0);
  return Math.round((raw / (diagnoseQuestions.length * 10)) * 100);
}

export function gradeForScore(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}
