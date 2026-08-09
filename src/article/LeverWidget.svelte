<script lang="ts">
  import ConversationView from "../sandbox/ConversationView.svelte";
  import type { MessageLedgerOptions, ScriptedMessage } from "../sandbox/model.js";

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

<ConversationView
  {script} options={off} {offScript} {onScript} {offLabel} {onLabel}
  {off} {on} {startOn}
/>
