import { z } from 'zod'

const modeInfoSchema = z
  .object({
    dmg_dealt: z.number().optional(),
    dmg_taken: z.number().optional(),
    healing: z.number().optional(),
    shielding: z.number().optional(),
    ability_haste: z.number().optional(),
    mana_regen: z.number().optional(),
    energy_regen: z.number().optional(),
    attack_speed: z.number().optional(),
    movement_speed: z.number().optional(),
    tenacity: z.number().optional()
  })
  .nullable()

const balanceSchema = z
  .object({
    ar: modeInfoSchema,
    aram: modeInfoSchema,
    nb: modeInfoSchema,
    ofa: modeInfoSchema,
    urf: modeInfoSchema,
    usb: modeInfoSchema
  })
  .partial()

const infoSchema = z.object({
  id: z.number(),
  balance: balanceSchema
})

export const fandomBalanceSchema = z.record(z.string(), infoSchema)

export type FandomBalance = z.infer<typeof fandomBalanceSchema>
