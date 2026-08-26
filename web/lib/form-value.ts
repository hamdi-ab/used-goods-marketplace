/**
 * Shared form value extraction helper for server actions.
 * Not a server action itself — pure utility.
 */
export function formValue(formData: FormData, key: string): string | undefined {
  const v = formData.get(key)
  return typeof v === "string" && v.length > 0 ? v : undefined
}
