<script lang="ts">
	import { onMount, untrack, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { orderWizardState } from '$lib/services/orders/OrderWizardState.svelte';
	import { authService } from '$lib/services/auth.svelte';
	import {
		apiService,
		API_SALES,
		API_OPERATIONS,
		ApiValidationError
	} from '$lib/services/api.svelte';
	import { ApiError } from '$lib/services/ApiError';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Form from '$lib/components/ui/form';
	import { CreditCard, DollarSign, Wallet, AlertTriangle, Loader2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { AdaptiveDateTimePicker } from '$lib/components/ui/responsive';
	import { superForm, defaults, setError } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	let props = $props<{ onNext: () => void; onBack: () => void }>();

	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	let draft = $derived(orderWizardState.activeDraft || ({} as any));

	let total = $derived(
		(draft?.items || []).reduce((acc: number, item: any) => {
			const itemTotal = (item.services || []).reduce(
				(sAcc: number, s: any) => sAcc + (s.unitPrice || 0) + (s.adjustmentAmount || 0),
				0
			);
			return acc + itemTotal;
		}, 0)
	);

	const paymentSchema = z.object({
		paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER']).default('CASH'),
		amountPaid: z.number().min(0, 'El monto no puede ser negativo').default(0),
		committedDeadline: z
			.string()
			.min(1, 'La fecha de entrega es obligatoria')
			.refine((v) => {
				const selected = new Date(v);
				const now = new Date();
				// 5 minute grace period to account for clock drift
				return selected >= new Date(now.getTime() - 5 * 60 * 1000);
			}, 'La fecha de entrega debe ser hoy o en el futuro'),
		notes: z.string().optional().or(z.literal(''))
	});

	const superform = superForm(defaults(zod4(paymentSchema)), {
		id: 'payment-step',
		SPA: true,
		validators: zod4(paymentSchema),
		async onUpdate({ form: f }) {
			if (!f.valid) return;
			if (!draft?.customer || !draft?.items || draft?.items.length === 0) {
				error = 'Faltan datos requeridos (Cliente o Prendas)';
				return;
			}
			error = null;
			isSubmitting = true;
			try {
				let deadlineStr = f.data.committedDeadline;
				if (deadlineStr.length === 10) {
					deadlineStr = `${deadlineStr}T18:00:00`;
				} else {
					deadlineStr = deadlineStr.slice(0, 16) + ':00';
				}

				// Append local timezone offset (e.g. -06:00)
				const date = new Date();
				const offsetMinutes = -date.getTimezoneOffset();
				const sign = offsetMinutes >= 0 ? '+' : '-';
				const hh = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0');
				const mm = String(Math.abs(offsetMinutes) % 60).padStart(2, '0');
				deadlineStr = `${deadlineStr}${sign}${hh}:${mm}`;

				const payload: any = {
					committedDeadline: deadlineStr,
					notes: f.data.notes || '',
					amountPaid: f.data.amountPaid,
					paymentMethod: f.data.paymentMethod
				};

				// For creation (not edit), include customer, items, and price list
				if (!draft?.isEditing) {
					const orderItems = (draft?.items || []).map((item: any) => ({
						garmentTypeId: item.garmentTypeId || item.garmentId || '',
						garmentName: item.garmentName || '',
						quantity: item.quantity ?? 1,
						notes: item.notes || '',
						services:
							item.services?.map((s: any) => ({
								serviceId: s.serviceId,
								serviceName: s.serviceName,
								unitPrice: s.unitPrice,
								adjustmentAmount: s.adjustmentAmount,
								adjustmentReason: s.adjustmentReason,
								durationMin: s.durationMin
							})) || []
					}));
					payload.customer = draft?.customer;
					payload.items = orderItems;
					if (draft?.priceListId) {
						payload.priceListId = draft.priceListId;
						payload.priceListName = draft.priceListName ?? null;
					}
				}

				if (draft?.isEditing && draft?.id) {
					await apiService.updateOrder(draft.id, payload);
					const targetId = draft?.id;
					// Clear draft before navigation to avoid UI "blink" back to Step 1
					orderWizardState.clearActiveDraft();
					toast.success('Pedido guardado correctamente.');
					await goto(`/dashboard/orders/${targetId}`);
				} else {
					const res = await apiService.request<any>(`${API_SALES}/orders`, {
						method: 'POST',
						body: JSON.stringify(payload)
					});
					toast.success('Nota confirmada exitosamente');
					const targetId = res?.id;

					// Navigate first, then cleanup to avoid UI "blink" to Step 1
					if (targetId) {
						await goto(`/dashboard/orders/${targetId}?action=print`);
					} else {
						await goto('/dashboard/orders');
					}
					orderWizardState.completeActiveDraft();
				}
			} catch (e: any) {
				console.error(e);
				if (e instanceof ApiValidationError) {
					// Iterate through the backend errors and apply them to the form fields
					for (const [field, message] of Object.entries(e.validationErrors)) {
						const fieldName = field as keyof z.infer<typeof paymentSchema>;
						setError(f, fieldName, message);
					}
					const errorMessages = Object.entries(e.validationErrors)
						.map(([field, msg]) => `${field}: ${msg}`)
						.join(', ');
					toast.error('Error de Validación', {
						description: errorMessages || 'Hay errores en los campos marcados'
					});
				} else if (e instanceof ApiError && e.status === 409) {
					if (draft?.isEditing) {
						toast.error('No es posible editar este pedido.');
					} else {
						error = `Conflicto de base de datos: Es posible que el número de ticket ya exista o haya un problema con los datos del cliente. Por favor, intenta de nuevo.`;
						toast.error('Error al procesar la nota', { description: e.message });
					}
				} else {
					error = `Error: ${e.message}`;
					toast.error('Error al procesar la nota', { description: e.message });
				}
			} finally {
				isSubmitting = false;
			}
		}
	});

	const { form, enhance } = superform;

	let balance = $derived(Math.max(0, total - ($form.amountPaid || 0)));

	onMount(() => {
		// Initialize form from existing draft when component mounts (for edit mode where draft already has values)
		if (
			draft?.paymentMethod ||
			draft?.amountPaid !== undefined ||
			draft?.committedDeadline ||
			draft?.notes
		) {
			$form.paymentMethod = draft?.paymentMethod || 'CASH';
			$form.amountPaid = draft?.amountPaid ?? 0;
			// For edit mode, always set committedDeadline from draft (required field)
			$form.committedDeadline = draft?.committedDeadline
				? draft.committedDeadline.slice(0, 16)
				: defaultDeadline();
			$form.notes = draft?.notes || '';
		}
	});

	// Sync $form fields into orderWizardState so workload display and balance derived values stay accurate
	$effect(() => {
		// We only want to re-run when form fields change, not when the global draft itself changes
		const currentForm = $form;

		untrack(() => {
			const d = orderWizardState.activeDraft;
			if (!d) return;

			const hasChanged =
				d.paymentMethod !== currentForm.paymentMethod ||
				d.amountPaid !== currentForm.amountPaid ||
				d.committedDeadline !== currentForm.committedDeadline ||
				d.notes !== currentForm.notes;

			if (hasChanged) {
				orderWizardState.updateActiveDraft({
					paymentMethod: currentForm.paymentMethod,
					amountPaid: currentForm.amountPaid,
					committedDeadline: currentForm.committedDeadline,
					notes: currentForm.notes
				});
			}
		});
	});

	// Workload validation logic
	let capacity = $state(480);
	let dailyWorkload = $state<any[]>([]);

	onMount(async () => {
		try {
			const [estData, metricsData] = await Promise.all([
				apiService.request<any>(`${API_OPERATIONS}/establishment`),
				apiService.request<any>(`${API_SALES}/orders/kpi/dashboard`)
			]);
			if (estData?.dailyCapacityMinutes) capacity = estData.dailyCapacityMinutes;
			if (metricsData?.dailyWorkload) dailyWorkload = metricsData.dailyWorkload;
		} catch (e) {
			console.warn('Could not fetch capacity metrics', e);
		}
	});

	let selectedDayWorkload = $derived.by(() => {
		if (!draft?.committedDeadline || dailyWorkload.length === 0) return 0;
		const selectedDate = draft?.committedDeadline.slice(0, 10);
		const day = dailyWorkload.find((d: any) => d.date === selectedDate);
		return day ? day.totalMinutesUsed : 0;
	});

	let totalMinutes = $derived(orderWizardState.totalMinutes);
	let projectedOccupancy = $derived(selectedDayWorkload + totalMinutes);
	let occupancyPercentage = $derived(
		Math.min(100, Math.round((projectedOccupancy / capacity) * 100))
	);
	let isCluttered = $derived(projectedOccupancy > capacity);

	function defaultDeadline(): string {
		const now = new Date();
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T18:00`;
	}

	let minDeadline = $derived.by(() => {
		const now = new Date();
		// 5 minute grace period
		const graceTime = now.getTime() - 5 * 60000;
		const nowLocal = new Date(graceTime);
		const offset = nowLocal.getTimezoneOffset() * 60000;
		return new Date(nowLocal.getTime() - offset).toISOString().slice(0, 16);
	});
</script>

<form method="POST" use:enhance class="flex flex-col h-full gap-6">
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-semibold">Paso 3: Pago y Confirmación</h2>
	</div>

	<div class="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
		<!-- Total Section -->
		<div class="text-center py-6 bg-muted/20 rounded-xl">
			<div class="text-muted-foreground uppercase text-sm font-semibold tracking-wider">
				Total a Pagar
			</div>
			<div class="text-5xl font-bold font-mono mt-2">${total.toFixed(2)}</div>
		</div>

		<!-- Payment Method -->
		<div class="space-y-4">
			<label class="text-sm font-medium" for="payment-method">Método de Pago</label>
			<div class="grid grid-cols-3 gap-4" id="payment-method">
				<Button
					type="button"
					variant="outline"
					onclick={() => {
						$form.paymentMethod = 'CASH';
					}}
					class={`h-auto flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${$form.paymentMethod === 'CASH' || !$form.paymentMethod ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' : 'border-border'}`}
				>
					<DollarSign class="w-8 h-8 mb-2" />
					<span class="font-semibold">Efectivo</span>
				</Button>
				<Button
					type="button"
					variant="outline"
					onclick={() => {
						$form.paymentMethod = 'CARD';
					}}
					class={`h-auto flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${$form.paymentMethod === 'CARD' ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' : 'border-border'}`}
				>
					<CreditCard class="w-8 h-8 mb-2" />
					<span class="font-semibold">Tarjeta</span>
				</Button>
				<Button
					type="button"
					variant="outline"
					onclick={() => {
						$form.paymentMethod = 'TRANSFER';
					}}
					class={`h-auto flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${$form.paymentMethod === 'TRANSFER' ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' : 'border-border'}`}
				>
					<Wallet class="w-8 h-8 mb-2" />
					<span class="font-semibold">Transf.</span>
				</Button>
			</div>
		</div>

		<!-- Payment Amounts -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<Form.Field form={superform} name="amountPaid">
				{#snippet children({ constraints })}
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Monto Recibido</Form.Label>
							<div class="relative">
								<span class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xl"
									>$</span
								>
								<Input
									{...props}
									{...constraints}
									type="number"
									min="0"
									step="0.01"
									class="pl-8 text-2xl font-bold h-14 rounded-xl"
									bind:value={$form.amountPaid}
									placeholder="0.00"
								/>
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
					<!-- Quick Buttons -->
					<div class="flex gap-2 mt-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={() => {
								$form.amountPaid = total;
							}}>Total</Button
						>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={() => {
								$form.amountPaid = total / 2;
							}}>50%</Button
						>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={() => {
								$form.amountPaid = 0;
							}}>0</Button
						>
					</div>
				{/snippet}
			</Form.Field>

			<div
				class="bg-card border border-border p-4 rounded-xl flex flex-col justify-center items-center shadow-sm"
			>
				<div class="text-sm text-muted-foreground">Saldo Pendiente</div>
				<div class={`text-4xl font-bold mt-1 ${balance > 0 ? 'text-destructive' : 'text-primary'}`}>
					${balance.toFixed(2)}
				</div>
			</div>
		</div>

		<!-- Deadline & Notes -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
			<Form.Field form={superform} name="committedDeadline">
				{#snippet children({ constraints })}
					<Form.Label>Fecha de Entrega</Form.Label>
					<!-- Adaptive: Calendar + Time popover on desktop, native datetime-local on mobile -->
					<AdaptiveDateTimePicker
						id="delivery-date"
						value={$form.committedDeadline}
						min={minDeadline}
						onValueChange={(v) => {
							$form.committedDeadline = v;
						}}
						placeholder="Seleccionar fecha y hora..."
						class="rounded-xl text-lg"
					/>
					<Form.FieldErrors />
				{/snippet}
			</Form.Field>
			<Form.Field form={superform} name="notes">
				{#snippet children({ constraints })}
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Notas Generales de Nota</Form.Label>
							<Input
								{...props}
								{...constraints}
								id="order-notes"
								placeholder="Detalles sobre entrega, atención, etc."
								class="h-12 rounded-xl text-lg"
								bind:value={$form.notes}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				{/snippet}
			</Form.Field>

			{#if draft?.committedDeadline}
				<div
					class="mt-3 p-4 rounded-xl border border-border bg-muted/30 space-y-3 animate-in fade-in slide-in-from-top-2"
				>
					<div class="flex justify-between items-center text-sm">
						<span class="font-medium">Ocupación para este día:</span>
						<span class="font-bold {isCluttered ? 'text-destructive' : 'text-primary'}">
							{projectedOccupancy} / {capacity} min ({occupancyPercentage}%)
						</span>
					</div>
					<div class="h-2 w-full bg-secondary rounded-full overflow-hidden">
						<div
							class="h-full {isCluttered
								? 'bg-destructive'
								: 'bg-primary'} transition-all duration-500"
							style="width: {occupancyPercentage}%"
						></div>
					</div>

					{#if isCluttered}
						<div
							class="bg-destructive/10 border border-destructive/20 p-3 rounded-lg flex gap-2 animate-in zoom-in-95"
						>
							<AlertTriangle class="h-4 w-4 text-destructive shrink-0 mt-0.5" />
							<div>
								<h5 class="text-xs font-bold text-destructive">¡Día Saturado!</h5>
								<p class="text-[10px] text-destructive/80 leading-relaxed font-medium">
									Esta fecha ya cuenta con mucha carga. Considera otra fecha para asegurar la
									entrega a tiempo.
								</p>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	{#if error}
		<div
			class="p-3 bg-destructive/10 text-destructive rounded-xl text-center text-sm font-medium shadow-sm transition-all border border-destructive/20"
		>
			{error}
		</div>
	{/if}

	<div class="border-t border-border pt-4 mt-auto flex justify-between gap-4">
		<Button
			type="button"
			variant="outline"
			onclick={props.onBack}
			class="flex-1 rounded-xl h-10 sm:h-14 text-sm sm:text-lg touch-manipulation"
			disabled={isSubmitting}
		>
			Atrás
		</Button>
		<Button
			type="submit"
			disabled={isSubmitting}
			class="flex-1 rounded-xl h-10 sm:h-14 text-sm sm:text-lg font-bold shadow-md touch-manipulation uppercase tracking-wide"
		>
			{#if isSubmitting}
				<Loader2 class="w-4 h-4 mr-2 animate-spin" />
				Procesando...
			{:else}
				{draft?.isEditing ? 'Actualizar Nota' : 'Confirmar Nota'}
			{/if}
		</Button>
	</div>
</form>
