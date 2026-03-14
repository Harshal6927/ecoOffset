import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "../style.css"
import Popup from "./Popup"

// popup/index.html guarantees a #root element exists — non-null assertion is safe.
// biome-ignore lint/style/noNonNullAssertion: element is guaranteed by popup/index.html
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Popup />
  </StrictMode>,
)
