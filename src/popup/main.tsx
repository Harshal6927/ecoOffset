import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "../style.css"
import Popup from "./Popup"

// biome-ignore lint/style/noNonNullAssertion: <N/A>
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Popup />
  </StrictMode>,
)
