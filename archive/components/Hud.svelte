<script lang="ts">
  import type { GameState } from "../game/types.js";
  let { st }: { st: GameState } = $props();

  const days = $derived(Math.round(st.endMin / st.dayLen));
  const curDay = $derived(Math.floor(st.clockMin / st.dayLen));
  const into = $derived((st.clockMin % st.dayLen) / 60);
  const pct = $derived(Math.max(0, Math.min(100, ((st.budget - st.wallet) / st.budget) * 100)));
  const walletCls = $derived(st.wallet < 0 ? "dead" : st.wallet < st.budget * 0.18 ? "low" : "");
  const faceCls = $derived(st.tedium < 34 ? "fresh" : st.tedium < 67 ? "tired" : "fried");
  const faceTxt = $derived(st.tedium < 34 ? "[ - _ - ]" : st.tedium < 67 ? "[ >_< ]" : "[ x_x ]");
  const walletTxt = $derived(
    st.wallet < 0 ? "-$" + Math.abs(st.wallet).toFixed(2) : "$" + st.wallet.toFixed(2),
  );
</script>

<div class="hud">
  <div class="hud-cell wallet {walletCls}">
    <span class="k">Wallet</span>
    <span class="wallet-v">{walletTxt}</span>
    <span class="quota">{pct.toFixed(0)}% of monthly cap</span>
  </div>
  <div class="hud-cell clock-wrap">
    <span class="k">Month</span>
    <div class="clockstrip">
      {#each Array(days) as _, d}
        <div class="daycell {d < curDay ? 'done' : d === curDay ? 'cur' : ''}"></div>
      {/each}
    </div>
    <span class="clocklabel">
      Day {curDay + 1} - {into.toFixed(1)} h into a 5.0 h block{st.manualHours > 0
        ? "  |  +" + st.manualHours.toFixed(1) + "h hand-coding"
        : ""}
    </span>
  </div>
  <div class="hud-cell tedium">
    <span class="k">Bob (tedium)</span>
    <div class="bobface {faceCls}">{faceTxt}</div>
    <div class="tedbar {st.tedium >= 67 ? 'hot' : ''}"><i style="width:{st.tedium}%"></i></div>
  </div>
</div>
