import { useEffect, useState } from "react"

/**
 * List of platforms the popup recognises by URL pattern.
 *
 * IMPORTANT: This list intentionally duplicates the platform detection logic
 * from src/platforms/. The popup runs in a separate extension context and
 * cannot import content-script modules, so the duplication is by design.
 * When you add a new platform adapter in src/platforms/, remember to add its
 * pattern here too.
 */
const SUPPORTED_PLATFORMS: { name: string; pattern: RegExp }[] = [
  { name: "Amazon", pattern: /amazon\.[a-z.]+/i },
  { name: "eBay", pattern: /ebay\.[a-z.]+/i },
]

type TabStatus = "loading" | "supported" | "unsupported"

interface StatusState {
  status: TabStatus
  platformName?: string
  url?: string
}

/**
 * Returns the display name of the first platform whose URL pattern matches
 * `url`, or null if the URL doesn't match any supported platform.
 */
function detectPlatformFromUrl(url: string): string | null {
  const match = SUPPORTED_PLATFORMS.find((p) => p.pattern.test(url))
  return match?.name ?? null
}

/**
 * Custom hook that queries the active tab's URL and resolves it to one of
 * three states: "loading" (query pending), "supported" (recognised platform),
 * or "unsupported" (unrecognised URL).
 */
function useTabStatus(): StatusState {
  const [state, setState] = useState<StatusState>({ status: "loading" })

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url ?? ""
      const platformName = detectPlatformFromUrl(url)
      setState({
        status: platformName ? "supported" : "unsupported",
        platformName: platformName ?? undefined,
        url,
      })
    })
  }, [])

  return state
}

function BrandMark() {
  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-white/90 shadow-[0_10px_24px_rgba(16,185,129,0.16)]">
      <div className="h-5 w-5 rounded-full bg-emerald-500/20" />
      <div className="absolute h-6 w-3 -rotate-45 rounded-full bg-emerald-600" />
      <div className="absolute h-3 w-3 translate-x-2 translate-y-1 rounded-full bg-emerald-300" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Header() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-100/90 bg-[linear-gradient(145deg,#f8fffb_0%,#f0fbf4_48%,#e7f6ee_100%)] px-4 py-4 shadow-[0_18px_44px_rgba(6,95,70,0.10)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.22),transparent_68%)]" />
      <div className="relative flex items-center gap-3">
        <BrandMark />
        <div className="min-w-0">
          <p className="mb-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-emerald-700/60">Browser Extension</p>
          <h1 className="text-[1.7rem] font-semibold leading-none text-emerald-950">EcoOffset</h1>
          <p className="mt-2 text-sm leading-5 text-slate-600">Sustainable shopping assistant</p>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status, platformName }: { status: TabStatus; platformName?: string }) {
  if (status === "loading") {
    return (
      <div className="flex items-start gap-3 rounded-[20px] border border-slate-200 bg-white/92 px-4 py-3 text-sm text-slate-600 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
        <span className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-slate-300 animate-pulse" />
        <span className="leading-6">Checking page...</span>
      </div>
    )
  }

  if (status === "supported") {
    return (
      <div className="flex items-start gap-3 rounded-[20px] border border-emerald-200/90 bg-[linear-gradient(145deg,rgba(240,253,244,0.98),rgba(220,252,231,0.92))] px-4 py-3 text-sm text-emerald-950 shadow-[0_14px_32px_rgba(16,185,129,0.10)]">
        <span className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.12)]" />
        <span className="leading-6">
          Active on <span className="font-semibold">{platformName}</span> - eco suggestions are displayed below product names.
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 rounded-[20px] border border-slate-200 bg-white/92 px-4 py-3 text-sm text-slate-600 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <span className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-slate-400" />
      <span className="leading-6">Not on a supported shopping page. Navigate to Amazon or eBay to see eco suggestions.</span>
    </div>
  )
}

function SupportedSites() {
  return (
    <div className="rounded-[20px] border border-white/80 bg-white/90 px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">Supported sites</p>
      <div className="flex flex-wrap gap-2.5">
        {SUPPORTED_PLATFORMS.map((p) => (
          <span
            key={p.name}
            className="rounded-full border border-emerald-100 bg-[linear-gradient(145deg,#fbfffd,#f0faf5)] px-3 py-1.5 text-xs font-semibold text-emerald-800"
          >
            {p.name}
          </span>
        ))}
      </div>
    </div>
  )
}

function HowItWorks() {
  const steps = ["Open any product page on a supported site", "Look for the green eco badge below the product title", "Click it to see eco-friendly alternatives and tips"]

  return (
    <div className="rounded-[20px] border border-white/80 bg-white/90 px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">How it works</p>
      <ol className="space-y-2.5">
        {steps.map((step, i) => (
          <li key={step} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/85 px-3 py-2.5 text-sm leading-5 text-slate-600">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main popup component
// ---------------------------------------------------------------------------

export default function Popup() {
  const { status, platformName } = useTabStatus()

  return (
    <div className="w-90 bg-[radial-gradient(circle_at_top,#f6fff9_0%,#eef9f3_44%,#e7f3ec_100%)] p-3 font-sans text-slate-800">
      <div className="rounded-[28px] border border-white/80 bg-white/55 p-3 shadow-[0_24px_64px_rgba(6,78,59,0.12)] backdrop-blur-xl">
        <div className="space-y-3">
          <Header />
          <StatusBadge status={status} platformName={platformName} />
          <SupportedSites />
          <HowItWorks />
        </div>
      </div>
    </div>
  )
}
