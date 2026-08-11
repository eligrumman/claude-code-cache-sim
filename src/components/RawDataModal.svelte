<script lang="ts">
  import { formatTokenCount, type RawTurn } from "../sim/captures/realSegments.js";

  interface Props {
    title: string;
    provenance: { real: boolean; source?: string; file?: string };
    rows: readonly RawTurn[];
    prominent?: boolean;
  }

  let { title, provenance, rows, prominent = false }: Props = $props();
  let open = $state(false);

  function close() { open = false; }
  function keydown(event: KeyboardEvent) {
    if (event.key === "Escape") close();
  }
</script>

<svelte:window onkeydown={keydown} />

<button class:prominent class="raw-trigger" type="button" onclick={() => open = true} aria-haspopup="dialog">
  <span aria-hidden="true">⟨/⟩</span>{#if prominent}<span>This is real. Here's the tape.</span>{/if}
</button>

{#if open}
  <div class="backdrop" role="presentation" onclick={(event) => event.currentTarget === event.target && close()}>
    <div class="modal" role="dialog" aria-modal="true" aria-label={`${title} raw data`}>
      <header>
        <div><span class="kicker">SOURCE-OF-TRUTH LOG</span><h2>{title}</h2></div>
        <button class="close" type="button" onclick={close} aria-label="Close raw data">×</button>
      </header>

      <div class:real={provenance.real} class="provenance">
        <strong>{provenance.real ? "● REAL CAPTURE" : "◐ MODELED (no real capture)"}</strong>
        {#if provenance.real}
          <span>{provenance.source}{provenance.file ? ` · ${provenance.file}` : ""}</span>
        {:else}
          <span>Engine-derived numbers, not intercepted traffic.</span>
        {/if}
      </div>

      <div class="table-wrap">
        <table>
          <thead><tr><th>turn / timestamp</th><th>system</th><th>tools</th><th>messages / prefix</th><th>cache write</th><th>cache read</th><th>fresh in</th><th>output</th></tr></thead>
          <tbody>
            {#each rows as row, index}
              <tr>
                <th><b>{row.label ?? `Turn ${index + 1}`}</b><small>{row.iso ?? "modeled turn"}</small></th>
                <td>{formatTokenCount(row.systemTok)}</td><td>{formatTokenCount(row.toolsTok)}</td><td>{formatTokenCount(row.messagesTok)}</td>
                <td>{formatTokenCount(row.cacheWrite)}</td><td>{formatTokenCount(row.cacheRead)}</td><td>{formatTokenCount(row.freshInput)}</td><td>{formatTokenCount(row.output)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <footer>Full provenance: <code>src/sim/captures/PROVENANCE.md</code></footer>
    </div>
  </div>
{/if}

<style>
  .raw-trigger{display:inline-flex;align-items:center;gap:.5rem;border:1px solid var(--line,#334155);border-radius:.45rem;background:var(--surface,#111827);color:var(--text,#e5e7eb);padding:.3rem .48rem;font:700 .72rem ui-monospace,SFMono-Regular,Consolas,monospace;cursor:pointer;white-space:nowrap}
  .raw-trigger:hover{border-color:var(--accent,#60a5fa)}
  .raw-trigger.prominent{padding:.65rem .85rem;border-color:#22c55e;color:#bbf7d0;background:#052e1a}
  .backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:1rem;background:rgba(2,6,23,.78)}
  .modal{width:min(1100px,100%);max-height:min(86vh,760px);display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--line,#334155);border-radius:.8rem;background:var(--surface,#0f172a);color:var(--text,#e5e7eb);box-shadow:0 24px 80px #0009}
  header{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;padding:1rem 1.1rem .75rem}h2{margin:.15rem 0 0;font-size:1.15rem}.kicker{color:var(--muted,#94a3b8);font:700 .65rem ui-monospace,monospace;letter-spacing:.1em}.close{border:0;background:transparent;color:inherit;font-size:1.65rem;cursor:pointer}
  .provenance{margin:0 1.1rem .8rem;padding:.65rem .75rem;border:1px solid #d97706;border-radius:.5rem;background:#451a0366;color:#fcd34d;display:flex;flex-wrap:wrap;gap:.35rem .8rem;font-size:.78rem}.provenance.real{border-color:#16a34a;background:#052e1a;color:#bbf7d0}.provenance span{color:inherit;opacity:.9}
  .table-wrap{margin:0 1.1rem;overflow:auto;overscroll-behavior:contain;border:1px solid var(--line,#334155);border-radius:.45rem}table{width:100%;min-width:850px;border-collapse:collapse;font:500 .72rem ui-monospace,SFMono-Regular,Consolas,monospace}th,td{padding:.62rem .7rem;border-bottom:1px solid var(--line,#273449);text-align:right;white-space:nowrap}thead th{position:sticky;top:0;background:var(--surface-2,#172033);color:var(--muted,#94a3b8);font-size:.64rem;text-transform:uppercase}th:first-child{text-align:left}tbody th b,tbody th small{display:block}tbody th small{margin-top:.16rem;color:var(--muted,#94a3b8);font-weight:400}
  footer{padding:.8rem 1.1rem 1rem;color:var(--muted,#94a3b8);font-size:.75rem}footer code{color:inherit}@media(max-width:600px){.backdrop{padding:.45rem}.modal{max-height:94vh}header,.provenance,footer{margin-left:.7rem;margin-right:.7rem}.table-wrap{margin:0 .7rem}}
</style>
