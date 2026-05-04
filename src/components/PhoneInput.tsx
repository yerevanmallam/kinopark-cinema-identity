"use client";

import { useState } from "react";

interface Props {
  onSubmit: (phone: string) => void;
  loading: boolean;
  prefill?: string;
}

/**
 * Armenian phone input. KinoPark accepts 8-digit Armenian mobile numbers
 * with the +374 country code. Pill-shaped container + orange CTA matches
 * the site's button system exactly (40px radius, #CA4C16, white text).
 */
export function PhoneInput({ onSubmit, loading, prefill }: Props) {
  const [phone, setPhone] = useState(prefill ?? "");
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);

  const digits = phone.replace(/\D/g, "");
  const isValid = digits.length === 8;
  const showError = touched && digits.length > 0 && !isValid;
  const formatted = formatArmenianMobile(digits);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (isValid) onSubmit(`+374${digits}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl flex flex-col"
      style={{
        gap: "0.5rem",
        padding: "0.4rem",
        borderRadius: "999px",
        background: "rgba(255, 255, 255, 0.04)",
        border: focused
          ? "1px solid rgba(202, 76, 22, 0.45)"
          : "1px solid rgba(255, 255, 255, 0.10)",
        backdropFilter: "blur(8px)",
        transition: "border-color 200ms ease",
      }}
    >
      <div className="flex items-center" style={{ gap: "0.25rem" }}>
        {/* Country code chip */}
        <div
          className="flex items-center shrink-0"
          style={{
            paddingLeft: "1.25rem",
            paddingRight: "0.85rem",
            color: "rgba(252, 252, 253, 0.85)",
            fontSize: "0.95rem",
            fontWeight: 500,
            letterSpacing: "0.02em",
            gap: "0.5rem",
          }}
        >
          <span aria-hidden style={{ fontSize: "1rem" }}>🇦🇲</span>
          <span>+374</span>
          <span style={{ width: "1px", height: "20px", background: "rgba(255, 255, 255, 0.12)" }} />
        </div>

        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={formatted}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, "").slice(0, 8);
            setPhone(next);
            setTouched(false);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setTouched(true);
          }}
          placeholder="77 12 34 56"
          disabled={loading}
          className="flex-1 bg-transparent outline-none disabled:opacity-50"
          style={{
            fontSize: "1rem",
            padding: "0.95rem 0.4rem",
            color: "#FCFCFD",
            fontWeight: 500,
            letterSpacing: "0.04em",
          }}
        />

        <button
          type="submit"
          disabled={loading || !isValid}
          className="kp-pill shrink-0"
          style={{ paddingInline: "1.6rem" }}
        >
          {loading ? "Reading…" : "Find My Character"}
        </button>
      </div>

      {showError && (
        <p
          style={{
            fontSize: "0.78rem",
            color: "rgba(255, 150, 130, 0.85)",
            paddingLeft: "1.25rem",
          }}
        >
          Enter the 8 digits of your Armenian mobile number.
        </p>
      )}
    </form>
  );
}

function formatArmenianMobile(digits: string): string {
  if (!digits) return "";
  return digits.match(/.{1,2}/g)?.join(" ") ?? digits;
}
