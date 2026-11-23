/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { CssBaseline } from "@mui/material";
import App from "./App";
import { AppThemeProvider } from "./theme";

function readNonce(): string | undefined {
  const meta = document.querySelector('meta[name="csp-nonce"]');
  const content = meta?.getAttribute("content") ?? undefined;
  if (!content || content === "__CSP_NONCE__") return undefined;
  return content;
}

const nonce = readNonce();
const cache = createCache({ key: "css", nonce, prepend: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CacheProvider value={cache}>
      <AppThemeProvider>
        <CssBaseline />
        <App />
      </AppThemeProvider>
    </CacheProvider>
  </StrictMode>,
);
