import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import * as m from '$lib/paraglide/messages';

// Built per-request (inside load) rather than at module scope so Paraglide
// resolves the active locale from the request context. A module-level schema
// would evaluate the message functions once at import time — always in the
// base locale — instead of the caller's language.
function buildSettingsSchema() {
  return z.object({
    name: z.string().min(1, m['adminSettings.zod.nameRequired']()),
    ownerName: z.string().optional().or(z.literal('')),
    dailyCapacityMinutes: z.number().min(1, m['adminSettings.zod.minCapacity']()),
    rfc: z.string().optional().or(z.literal('')),
    regime: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    contactPhone: z.string().optional().or(z.literal('')),
    primaryColor: z.string()
      .regex(/^#[0-9A-Fa-f]{6}$/, m['adminSettings.zod.colorFormat']())
      .nullable()
      .optional()
      .or(z.literal('')),
    fontFamily: z.enum(['Inter', 'Outfit', 'Merriweather'])
      .nullable()
      .optional()
      .or(z.literal('')),
  });
}

export async function load() {
  const form = await superValidate(zod4(buildSettingsSchema()));
  return { form };
}
