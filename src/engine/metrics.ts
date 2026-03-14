type EventBase = {
  timestamp: number
  pageUrl: string
  context: "product" | "cart"
}

type SuggestionShownEvent = EventBase & {
  type: "suggestion_shown"
  alternativeId: string
}

type SuggestionClickedEvent = EventBase & {
  type: "suggestion_clicked"
  alternativeId: string
}

type SuggestionDismissedEvent = EventBase & {
  type: "suggestion_dismissed"
  alternativeId: string
}

export type MetricsEvent =
  | SuggestionShownEvent
  | SuggestionClickedEvent
  | SuggestionDismissedEvent

export function recordEvent(event: MetricsEvent) {
  try {
    // Fire-and-forget to the background script, which can decide
    // whether and how to persist these events.
    chrome.runtime.sendMessage({ type: "METRIC_EVENT", payload: event })
  } catch {
    // Ignore if runtime is not available.
  }
}

