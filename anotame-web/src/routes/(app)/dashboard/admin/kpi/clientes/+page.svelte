<script lang="ts">
  import FinancialKpiPanel from '$lib/components/dashboard/financial-kpi-panel.svelte';
  import { LeadText, StatePanel } from '$lib/components/common';
  import * as m from '$lib/paraglide/messages';
  import { getKpiDashboard } from '../kpiContext';

  const dashboard = getKpiDashboard();
</script>

{#if dashboard.isLoading}
  <StatePanel message={m['kpi.loading']()} />
{:else}
  <div class="space-y-6">
    <LeadText text={m['kpi.section.customersDesc']()} />

    <FinancialKpiPanel atRiskDaysThreshold={dashboard.atRiskDaysThreshold} />
  </div>
{/if}
