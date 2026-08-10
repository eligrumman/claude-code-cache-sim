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
    border-radius: 20px 17px 22px 16px;
  }
</style>
