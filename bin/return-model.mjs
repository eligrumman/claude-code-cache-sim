// Predicts whether you'll come back to an idle Claude Code session before its cache expires, from
// signals already in your local transcripts. A small logistic regression, trained on your own history.

const HOUR = 3_600_000;

// How the conversation stopped. Hebrew and English, since that's how people actually talk to Claude.
const ASKED = /\?\s*$|would you like|should i |do you want|want me to|let me know|shall i|which (one|option)|האם|רוצה ש|תרצה|להמשיך|מה דעתך|איזה מה/i;
const DONE = /\b(done|completed|all set|pushed|committed|merged|deployed|finished|shipped)\b|סיימתי|הושלם|דחפתי|מוזג|מוכן/i;
const THANKS = /^\s*(thanks|thank you|thx|ty|great|perfect|awesome|nice|cool|ok|okay|lgtm|תודה|מעולה|אחלה|סבבה|יופי|מושלם|תותח)\b/i;

function textOf(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.filter((block) => block?.type === "text").map((block) => block.text ?? "").join("\n");
}

/** What a session's transcript says beyond token usage: your prompts and Claude's replies, timestamped. */
export function parseSignals(lines) {
  const prompts = [];
  const replies = [];
  let cwd = null;
  for (const line of lines) {
    if (!line.trim()) continue;
    let event;
    try { event = JSON.parse(line); } catch { continue; }
    if (event.isSidechain || event.isMeta) continue;
    const at = Date.parse(event.timestamp);
    if (!Number.isFinite(at)) continue;
    cwd = event.cwd ?? cwd;
    const content = event.message?.content;
    if (event.type === "user") {
      const isToolResult = Array.isArray(content) && content.some((block) => block?.type === "tool_result");
      const text = textOf(content);
      if (!isToolResult && text.trim()) prompts.push({ at, text: text.slice(0, 300) });
    } else if (event.type === "assistant") {
      const text = textOf(content);
      if (text.trim()) replies.push({ at, text: text.slice(-400) });
    }
  }
  return { prompts, replies, cwd };
}

/** Every prompt across all sessions, sorted, so "were you active elsewhere since?" is a quick lookup. */
export function activityIndex(sessions) {
  const all = [];
  for (const s of sessions) for (const p of s.prompts ?? []) all.push({ at: p.at, session: s.sessionId, cwd: s.cwd });
  return all.sort((a, b) => a.at - b.at);
}

function firstAtOrAfter(index, time) {
  let lo = 0;
  let hi = index.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (index[mid].at <= time) lo = mid + 1; else hi = mid; }
  return lo;
}

/** Did you type anything in another session (optionally: in the same project) between `from` and `to`? */
export function activeElsewhere(index, session, cwd, from, to, sameProject) {
  for (let i = firstAtOrAfter(index, from); i < index.length && index[i].at <= to; i += 1) {
    const row = index[i];
    if (row.session !== session && (!sameProject || (cwd && row.cwd === cwd))) return true;
  }
  return false;
}

/** The fixed facts about how a session stopped, as of `start` (when it went idle). */
export function stopSignals(signals, start, prefix) {
  const reply = [...(signals.replies ?? [])].reverse().find((r) => r.at <= start + 1000);
  const prompt = [...(signals.prompts ?? [])].reverse().find((p) => p.at <= start + 1000);
  const prompts = (signals.prompts ?? []).filter((p) => p.at <= start + 1000);
  return {
    asked: reply ? ASKED.test(reply.text.trim()) : false,
    done: reply ? DONE.test(reply.text) : false,
    thanks: prompt ? THANKS.test(prompt.text) && prompt.text.length < 80 : false,
    turns: prompts.length,
    recent: prompts.filter((p) => p.at > start - HOUR).length,
    prefix,
  };
}

export const FEATURES = [
  ["asked", "Claude ended by asking you something"],
  ["done", "Claude said the task was done"],
  ["thanks", "your last message was a thanks / ok"],
  ["sameProject", "you've since typed in another session in the same project"],
  ["elsewhere", "you've since typed in some other session"],
  ["turns", "how long the session was (prompts, log)"],
  ["recent", "prompts in the hour before you left (log)"],
  ["big", "session size (log)"],
  ["idle", "hours away so far (log)"],
  ["workHours", "it's between 9:00 and 19:00"],
  ["weekend", "it's Friday or Saturday"],
];

/** Feature vector for "will you be back within the next `windowMs`?", asked at time `at`. */
export function featuresAt(period, at, index) {
  const s = period.signals;
  const date = new Date(at);
  const hour = date.getHours() + date.getMinutes() / 60;
  return [
    s.asked ? 1 : 0,
    s.done ? 1 : 0,
    s.thanks ? 1 : 0,
    index && activeElsewhere(index, period.session, period.cwd, period.start, at, true) ? 1 : 0,
    index && activeElsewhere(index, period.session, period.cwd, period.start, at, false) ? 1 : 0,
    Math.log1p(s.turns),
    Math.log1p(s.recent),
    Math.log(Math.max(s.prefix, 1000) / 100_000),
    Math.log((at - period.start) / HOUR),
    hour >= 9 && hour < 19 ? 1 : 0,
    date.getDay() === 5 || date.getDay() === 6 ? 1 : 0,
  ];
}

const sigmoid = (z) => 1 / (1 + Math.exp(-z));

/** Logistic regression by plain gradient descent with a little L2. Small data, so this is plenty. */
export function train(rows, { iterations = 600, rate = 0.3, l2 = 0.01 } = {}) {
  const n = rows.length;
  const k = rows[0]?.x.length ?? FEATURES.length;
  if (!n) return { weights: new Array(k).fill(0), bias: 0, mean: new Array(k).fill(0), scale: new Array(k).fill(1) };
  const mean = new Array(k).fill(0);
  const scale = new Array(k).fill(0);
  for (const { x } of rows) x.forEach((v, j) => { mean[j] += v / n; });
  for (const { x } of rows) x.forEach((v, j) => { scale[j] += (v - mean[j]) ** 2 / n; });
  for (let j = 0; j < k; j += 1) scale[j] = Math.sqrt(scale[j]) || 1;
  const xs = rows.map(({ x }) => x.map((v, j) => (v - mean[j]) / scale[j]));
  const weights = new Array(k).fill(0);
  const positives = rows.filter((r) => r.y).length;
  let bias = Math.log((positives + 1) / (n - positives + 1));
  for (let it = 0; it < iterations; it += 1) {
    const grad = new Array(k).fill(0);
    let gradBias = 0;
    for (let i = 0; i < n; i += 1) {
      const err = sigmoid(bias + xs[i].reduce((z, v, j) => z + v * weights[j], 0)) - rows[i].y;
      gradBias += err / n;
      for (let j = 0; j < k; j += 1) grad[j] += (err * xs[i][j]) / n;
    }
    bias -= rate * gradBias;
    for (let j = 0; j < k; j += 1) weights[j] -= rate * (grad[j] + l2 * weights[j]);
  }
  return { weights, bias, mean, scale };
}

export function predict(model, x) {
  return sigmoid(model.bias + x.reduce((z, v, j) => z + ((v - model.mean[j]) / model.scale[j]) * model.weights[j], 0));
}

/** Which signals push "you'll be back" up or down, strongest first, as odds multipliers per typical change. */
export function explain(model) {
  return FEATURES.map(([key, label], j) => ({ key, label, odds: Math.exp(model.weights[j]) }))
    .sort((a, b) => Math.abs(Math.log(b.odds)) - Math.abs(Math.log(a.odds)));
}
