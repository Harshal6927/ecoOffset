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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Header() {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-2xl" aria-hidden="true">
        🌿
      </span>
      <div>
        <h1 className="text-base font-bold text-emerald-800 leading-tight">EcoOffset</h1>
        <p className="text-xs text-gray-500 leading-tight">Sustainable shopping assistant</p>
      </div>
    </div>
  )
}

function StatusBadge({ status, platformName }: { status: TabStatus; platformName?: string }) {
  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-500">
        <span className="inline-block w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
        Checking page…
      </div>
    )
  }

  if (status === "supported") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
        <span>
          Active on <span className="font-semibold">{platformName}</span> — eco suggestions are displayed below product names.
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-500">
      <span className="inline-block w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
      <span>Not on a supported shopping page. Navigate to Amazon or eBay to see eco suggestions.</span>
    </div>
  )
}

function SupportedSites() {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Supported sites</p>
      <div className="flex gap-2">
        {SUPPORTED_PLATFORMS.map((p) => (
          <span key={p.name} className="px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-600 font-medium">
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
    <div className="mt-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">How it works</p>
      <ol className="space-y-1">
        {steps.map((step, i) => (
          <li key={step} className="flex items-start gap-2 text-xs text-gray-600">
            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px]">{i + 1}</span>
            {step}
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
    <div className="w-72 p-4 bg-white font-sans">
      <Header />
      <StatusBadge status={status} platformName={platformName} />
      <SupportedSites />
      <HowItWorks />
    </div>
  )
}
