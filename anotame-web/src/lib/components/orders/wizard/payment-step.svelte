<script lang="ts">
  let { onNext, onBack } = $props<{ onNext: () => void, onBack: () => void }>();
</script>

<div class="p-8 text-center text-muted-foreground">
  Paso 3: Pago (En desarrollo)
  <div class="mt-4 flex gap-4 justify-center">
      <button class="px-4 py-2 bg-secondary rounded text-sm" onclick={onBack}>Back</button>
  </div>
</div>
