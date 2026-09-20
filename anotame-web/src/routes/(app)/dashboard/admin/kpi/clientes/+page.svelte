<script lang="ts">
  import FinancialKpiPanel from '$lib/components/dashboard/FinancialKpiPanel.svelte';
  import { StatePanel } from '$lib/components/common';
  import * as m from '$lib/paraglide/messages';
  import { getKpiDashboard } from '../kpiContext';

  const dashboard = getKpiDashboard();
</script>

{#if dashboard.isLoading}
  <StatePanel message={m['kpi.loading']()} />
{:else}
  <div class="space-y-6">
    <p class="max-w-3xl text-sm text-muted-foreground">
      {m['kpi.section.customersDesc']()}
    </p>

    <FinancialKpiPanel atRiskDaysThreshold={dashboard.atRiskDaysThreshold} />
  </div>
{/if}
