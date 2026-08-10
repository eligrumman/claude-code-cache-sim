<script lang="ts">
  import ConversationView from "../sandbox/ConversationView.svelte";
  import type { MessageLedgerOptions, ScriptedMessage } from "../sim/ledger.js";

  interface Props {
    script: ScriptedMessage[];
    offScript?: ScriptedMessage[];
    onScript?: ScriptedMessage[];
    offLabel: string;
    onLabel: string;
    off: MessageLedgerOptions;
    on: MessageLedgerOptions;
    startOn?: boolean;
  }

  let { script, offScript, onScript, offLabel, onLabel, off, on, startOn = false }: Props = $props();
</script>

<div class="lever-scroll" data-testid="lever-scroll">
  <ConversationView
    {script} options={off} {offScript} {onScript} {offLabel} {onLabel}
    {off} {on} {startOn}
  />
</div>

<style>
  .lever-scroll {
    width: 100%;
    height: min(660px, 78vh);
    min-height: 430px;
    overflow-y: auto;
    overflow-x: hidden;
    border-radius: 20px 17px 22px 16px;
    scrollbar-gutter: stable;
  }

  .lever-scroll :global(.stage) {
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .lever-scroll :global(.chat),
  .lever-scroll :global(.ledger) {
    min-height: min-content;
  }

  @media (max-width: 650px) {
    .lever-scroll {
      height: min(570px, 74vh);
      min-height: 390px;
      scrollbar-gutter: auto;
    }
  }
</style>
