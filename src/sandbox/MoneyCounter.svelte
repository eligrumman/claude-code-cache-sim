<script lang="ts">
  let { value, label, tone = "neutral" }: { value: number; label: string; tone?: "neutral" | "good" | "bad" } = $props();
  let shown = $state(0);

  $effect(() => {
    const target = value;
    const start = shown;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - started) / 320);
      const eased = 1 - Math.pow(1 - p, 3);
      shown = start + (target - start) * eased;
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  });
</script>

<div class="money {tone}" aria-label={`${label}: $${value.toFixed(2)}`}>
  <strong class="toy-num">${shown.toFixed(2)}</strong>
  <span>{label}</span>
</div>

<style>
  .money { text-align: center; min-width: 0; transition: color .3s ease, transform .3s ease; }
  strong { display: block; font-size: clamp(2rem, 6vw, 4rem); line-height: 1; letter-spacing: -.055em; font-variant-numeric: tabular-nums; }
  span { display: block; margin-top: .45rem; color: var(--toy-muted); font-size: .82rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
  .good { color: var(--toy-green-ink); transform: translateY(3px); }
  .bad { color: var(--toy-red-ink); transform: translateY(-3px); }
  .neutral { color: var(--toy-ink); }
</style>
