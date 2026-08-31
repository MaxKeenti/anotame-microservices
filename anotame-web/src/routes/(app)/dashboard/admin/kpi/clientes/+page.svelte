<script lang="ts">
  import FinancialKpiPanel from '$lib/components/dashboard/FinancialKpiPanel.svelte';
  import * as m from '$lib/paraglide/messages';
  import { getKpiDashboard } from '../kpiContext';

  const dashboard = getKpiDashboard();
</script>

{#if dashboard.isLoading}
  <div class="flex h-64 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
    {m['kpi.loading']()}
  </div>
{:else}
  <div class="space-y-6">
    <p class="max-w-3xl text-sm text-muted-foreground">
      {m['kpi.section.customersDesc']()}
    </p>

    <FinancialKpiPanel atRiskDaysThreshold={dashboard.atRiskDaysThreshold} />
  </div>
{/if}
