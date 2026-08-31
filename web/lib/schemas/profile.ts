import { z } from "zod"

export const onboardingSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  city: z.string().min(1, "Enter your city"),
  subCity: z.string().optional(),
  phone: z.string().optional(),
  telegramUsername: z.string().optional(),
  bio: z.string().max(300, "Bio must be 300 characters or fewer").optional(),
})

export const editProfileSchema = z.object({
  city: z.string().min(1, "Enter your city").max(100),
  subCity: z.string().max(100).optional(),
  phone: z.string().max(30, "Phone number is too long").optional(),
  telegramUsername: z
    .string()
    .max(50, "Too long")
    .transform((v) => (v ? v.replace(/^@/, "") : v))
    .optional(),
  bio: z.string().max(300, "Bio must be 300 characters or fewer").optional(),
  phonePublic: z.boolean().optional(),
})

export const startSellingSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  city: z.string().min(1, "Enter your city"),
})

export type OnboardingInput = z.infer<typeof onboardingSchema>
export type EditProfileInput = z.infer<typeof editProfileSchema>
export type StartSellingInput = z.infer<typeof startSellingSchema>

export function parseOnboardingForm(formData: FormData): Record<string, unknown> {
  return {
    fullName: formData.get("fullName"),
    city: formData.get("city"),
    subCity: formData.get("subCity"),
    phone: formData.get("phone"),
    telegramUsername: formData.get("telegramUsername"),
    bio: formData.get("bio"),
  }
}

export function parseEditProfileForm(formData: FormData): Record<string, unknown> {
  return {
    city: formData.get("city"),
    subCity: formData.get("subCity") || undefined,
    phone: formData.get("phone") || undefined,
    telegramUsername: formData.get("telegramUsername") || undefined,
    bio: formData.get("bio") || undefined,
    phonePublic: formData.get("phonePublic") === "on",
  }
}

export function parseStartSellingForm(formData: FormData): Record<string, unknown> {
  return {
    fullName: formData.get("fullName"),
    city: formData.get("city"),
  }
}
