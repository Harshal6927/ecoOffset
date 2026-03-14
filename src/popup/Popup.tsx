import { useEffect, useState } from "react"

type Preferences = {
  suggestAlternatives: boolean
  footprintSensitivity: "balanced" | "max_reduction" | "price_friendly"
}

const defaultPreferences: Preferences = {
  suggestAlternatives: true,
  footprintSensitivity: "balanced",
}

function loadPreferences(callback: (prefs: Preferences) => void) {
  if (!chrome?.storage?.sync) {
    callback(defaultPreferences)
    return
  }

  chrome.storage.sync.get(defaultPreferences, (result) => {
    const prefs: Preferences = {
      suggestAlternatives:
        typeof result.suggestAlternatives === "boolean"
          ? result.suggestAlternatives
          : defaultPreferences.suggestAlternatives,
      footprintSensitivity:
        result.footprintSensitivity ?? defaultPreferences.footprintSensitivity,
    }
    callback(prefs)
  })
}

function savePreferences(prefs: Preferences) {
  if (!chrome?.storage?.sync) return
  chrome.storage.sync.set(prefs)
}

export default function Popup() {
  const [preferences, setPreferences] = useState<Preferences | null>(null)

  useEffect(() => {
    loadPreferences((prefs) => {
      setPreferences(prefs)
    })
  }, [])

  if (!preferences) {
    return (
      <div
        style={{
          width: "320px",
          padding: "24px",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: "0 0 8px", fontSize: "22px", color: "#2d6a4f" }}>EcoOffset</h1>
        <p style={{ margin: 0, color: "#555", fontSize: "14px" }}>Loading settings…</p>
      </div>
    )
  }

  const handleToggleSuggest = (checked: boolean) => {
    const next = { ...preferences, suggestAlternatives: checked }
    setPreferences(next)
    savePreferences(next)
  }

  const handleSensitivityChange = (value: Preferences["footprintSensitivity"]) => {
    const next = { ...preferences, footprintSensitivity: value }
    setPreferences(next)
    savePreferences(next)
  }

  return (
    <div
      style={{
        width: "320px",
        padding: "20px 16px 16px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <header style={{ marginBottom: "12px" }}>
        <h1
          style={{
            margin: "0 0 4px",
            fontSize: "20px",
            color: "#1b4332",
          }}
        >
          EcoOffset
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            color: "#555",
          }}
        >
          Get suggestions for products with a lower estimated carbon footprint while you shop.
        </p>
      </header>

      <section
        style={{
          borderRadius: "8px",
          border: "1px solid #d3e4d8",
          padding: "10px 12px",
          marginBottom: "12px",
          background: "#f6fbf8",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#1b4332" }}>
              Suggest greener alternatives
            </div>
            <div style={{ fontSize: "12px", color: "#555", marginTop: "2px" }}>
              Show options with a lower estimated footprint on product and cart pages.
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences.suggestAlternatives}
            onChange={(event) => handleToggleSuggest(event.target.checked)}
          />
        </label>
      </section>

      <section
        style={{
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
          padding: "10px 12px",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#1b4332",
            marginBottom: "6px",
          }}
        >
          Balance between footprint and price
        </div>
        <select
          value={preferences.footprintSensitivity}
          onChange={(event) =>
            handleSensitivityChange(event.target.value as Preferences["footprintSensitivity"])
          }
          style={{
            width: "100%",
            fontSize: "13px",
            padding: "6px 8px",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
          }}
        >
          <option value="balanced">Balanced</option>
          <option value="max_reduction">Max footprint reduction</option>
          <option value="price_friendly">Stay close to current price</option>
        </select>
        <p style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
          This guides how strongly EcoOffset trades off carbon reduction vs. price when ranking
          alternatives.
        </p>
      </section>

      <footer style={{ marginTop: "4px", textAlign: "left" }}>
        <p style={{ fontSize: "11px", color: "#777", margin: 0 }}>
          Your settings are stored in your browser and used only to personalize suggestions.
        </p>
      </footer>
    </div>
  )
}

