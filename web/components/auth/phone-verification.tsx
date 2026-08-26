"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { markPhoneVerified } from "@/app/actions/phone-verification"

type PhoneVerificationProps = {
  initialPhone?: string
  verified?: boolean
  mockMode?: boolean
}

const MOCK_OTP = "123456"

export function PhoneVerification({ initialPhone = "", verified = false, mockMode = false }: PhoneVerificationProps) {
  const [phone, setPhone] = useState(initialPhone)
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"phone" | "otp" | "success">(verified ? "success" : "phone")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sendOtp() {
    setError(null)
    setLoading(true)
    if (mockMode) {
      // Demo mock: simulate sending OTP. The test code is always "123456".
      setLoading(false)
      setStep("otp")
      return
    }
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({ phone })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setStep("otp")
  }

  async function verifyOtp() {
    setError(null)
    setLoading(true)
    if (mockMode) {
      // Demo mock: only accept the test OTP "123456".
      if (otp !== MOCK_OTP) {
        setLoading(false)
        setError("Invalid code. Use 123456 for the demo.")
        return
      }
      await markPhoneVerified()
      setLoading(false)
      setStep("success")
      return
    }
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" })
    if (error) {
      setLoading(false)
      setError("Invalid code. Please try again.")
      return
    }
    await markPhoneVerified()
    setLoading(false)
    setStep("success")
  }

  if (step === "success") {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="default" className="bg-green-600 hover:bg-green-600">
          Phone verified
        </Badge>
        <span className="text-sm text-muted-foreground">{phone}</span>
      </div>
    )
  }

  if (step === "otp") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="otp">
            {mockMode
              ? `Enter the 6-digit code (demo code: ${MOCK_OTP})`
              : `Enter the 6-digit code sent to ${phone}`}
          </Label>
          <Input
            id="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="button" onClick={verifyOtp} disabled={loading || otp.length !== 6}>
            {loading ? "Verifying…" : "Verify"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setStep("phone")}>
            Change number
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+251 91 234 5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="button" onClick={sendOtp} disabled={loading || !phone}>
        {loading ? "Sending…" : "Send verification code"}
      </Button>
    </div>
  )
}
