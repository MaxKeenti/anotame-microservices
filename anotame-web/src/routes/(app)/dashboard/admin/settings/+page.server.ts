import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

const settingsSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  ownerName: z.string().optional().or(z.literal('')),
  dailyCapacityMinutes: z.number().min(1, 'Debe ser al menos 1 minuto'),
  rfc: z.string().optional().or(z.literal('')),
  regime: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  contactPhone: z.string().optional().or(z.literal('')),
  primaryColor: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Formato de color hexadecimal inválido #RRGGBB')
    .nullable()
    .optional()
    .or(z.literal('')),
  fontFamily: z.enum(['Inter', 'Outfit', 'Merriweather'])
    .nullable()
    .optional()
    .or(z.literal('')),
});

export async function load() {
  const form = await superValidate(zod4(settingsSchema));
  return { form };
}
