chrome.runtime.onInstalled.addListener(() => {
  // biome-ignore lint/suspicious/noConsoleLog: background debug logging
  console.log("EcoOffset background service worker installed")
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== "string") {
    return
  }

  switch (message.type) {
    case "PING":
      sendResponse({ ok: true })
      break
    case "METRIC_EVENT":
      // For now, just log metrics events. This can be extended to persist
      // them to chrome.storage or a backend.
      // biome-ignore lint/suspicious/noConsoleLog: background debug logging
      console.log("EcoOffset metric event", message.payload, "from", sender.tab?.url)
      break
    default:
      break
  }
})


