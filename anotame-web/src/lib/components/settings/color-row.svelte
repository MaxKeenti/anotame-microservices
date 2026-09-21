<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import * as m from '$lib/paraglide/messages';

  /** One overridable theme colour: swatch, name, hex entry, and a reset. */
  interface Props {
    /** Localized colour name. */
    label: string;
    /** Colour currently in effect, used for the swatch. */
    preview: string;
    /** The reader's override, empty when the theme default applies. */
    value: string;
    /** Hex shown as the placeholder when no override is set. */
    placeholder: string;
    onInput: (value: string) => void;
    onReset: () => void;
  }

  let { label, preview, value, placeholder, onInput, onReset }: Props = $props();
</script>

<div class="flex items-center gap-3">
  <div
    class="h-8 w-8 shrink-0 rounded-full border border-border"
    style="background-color: {preview}"
    aria-hidden="true"
  ></div>
  <span class="w-28 shrink-0 text-sm font-medium">{label}</span>
  <Input
    type="text"
    class="h-11 flex-1 font-mono text-sm"
    aria-label={m['settings.label.colorHex']({ name: label })}
    {placeholder}
    {value}
    oninput={(e) => onInput(e.currentTarget.value)}
  />
  {#if value}
    <Button variant="ghost" size="sm" class="shrink-0" onclick={onReset}>
      {m['settings.palette.restore']()}
    </Button>
  {/if}
</div>
