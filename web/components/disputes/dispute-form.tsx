"use client"

import { useState } from "react"
import { useActionState } from "react"
import { AlertTriangleIcon, Loader2Icon, PaperclipIcon, XIcon } from "lucide-react"

import { openDisputeAction } from "@/app/actions/disputes"
import type { DisputeReason } from "@/lib/disputes"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { uploadEvidence } from "@/app/actions/disputes"

interface DisputeFormProps {
  paymentId: string
}

const REASON_LABELS: Record<DisputeReason, string> = {
  not_received: "Item not received",
  not_as_description: "Not as described",
  damaged: "Item damaged",
  other: "Other issue",
}

const MAX_EVIDENCE_FILES = 5
const MAX_FILE_BYTES = 5 * 1024 * 1024

export function DisputeForm({ paymentId }: DisputeFormProps) {
  const [state, formAction, pending] = useActionState(openDisputeAction, {})
  const [reason, setReason] = useState<DisputeReason | null>(null)
  const [description, setDescription] = useState("")
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [evidenceError, setEvidenceError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length + evidenceFiles.length > MAX_EVIDENCE_FILES) {
      setEvidenceError(`Maximum ${MAX_EVIDENCE_FILES} files allowed`)
      return
    }
    const invalid = files.find((f) => f.size > MAX_FILE_BYTES)
    if (invalid) {
      setEvidenceError("Each file must be 5 MB or smaller")
      return
    }
    setEvidenceError(null)
    setEvidenceFiles((prev) => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason || !description.trim()) return

    setUploading(true)
    try {
      // Upload evidence files first
      let evidenceUrls: string[] = []
      if (evidenceFiles.length > 0) {
        const result = await uploadEvidence(paymentId, evidenceFiles)
        if (result.ok) {
          evidenceUrls = result.urls
        }
      }

      // Build form data with evidence URLs
      const formData = new FormData()
      formData.append("paymentId", paymentId)
      formData.append("reason", reason)
      formData.append("description", description)
      formData.append("evidenceUrls", JSON.stringify(evidenceUrls))

      // Call the action manually
      await openDisputeAction({}, formData)
    } finally {
      setUploading(false)
    }
  }

  if (state.ok) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
        <p className="font-medium">Dispute submitted</p>
        <p className="mt-1">Our team will review it within 7 days.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
        <AlertTriangleIcon className="size-4" />
        Open a dispute
      </div>

      <div>
        <Label className="text-xs">Reason</Label>
        <div className="mt-1 flex flex-wrap gap-2">
          {(Object.keys(REASON_LABELS) as DisputeReason[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={`rounded-lg border px-2 py-1 text-xs transition ${
                reason === r
                  ? "border-amber-500 bg-amber-100 text-amber-800"
                  : "border-amber-200 bg-white text-amber-700 hover:bg-amber-50"
              }`}
            >
              {REASON_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor={`desc-${paymentId}`} className="text-xs">Description</Label>
        <Textarea
          id={`desc-${paymentId}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue..."
          rows={2}
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-xs">Evidence (optional)</Label>
        <div className="mt-1">
          <label
            htmlFor={`evidence-${paymentId}`}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-amber-300 bg-white px-3 py-2 text-xs text-amber-700 hover:bg-amber-50"
          >
            <PaperclipIcon className="size-3" />
            Add photos as evidence
            <input
              id={`evidence-${paymentId}`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        </div>
        {evidenceFiles.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {evidenceFiles.map((f, i) => (
              <li key={i} className="flex items-center justify-between rounded bg-white px-2 py-1 text-xs">
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-amber-600 hover:text-amber-800"
                  aria-label={`Remove ${f.name}`}
                >
                  <XIcon className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {evidenceError ? (
          <p className="mt-1 text-xs text-destructive">{evidenceError}</p>
        ) : null}
      </div>

      <Button
        type="submit"
        size="sm"
        disabled={!reason || !description.trim() || pending || uploading}
      >
        {uploading ? <Loader2Icon className="mr-2 size-3 animate-spin" /> : null}
        {uploading ? "Uploading..." : pending ? "Submitting..." : "Submit dispute"}
      </Button>

      {state.message ? (
        <p role="alert" className="text-xs text-destructive">{state.message}</p>
      ) : null}
    </form>
  )
}
