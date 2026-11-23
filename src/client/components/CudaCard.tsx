/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { Alert, Box, Link, List, ListItem, Paper, Typography } from "@mui/material";
import type { CudaInfo, SystemInfo } from "../api";
import { na } from "../format";

function statusSeverity(
  status: CudaInfo["recommendation"]["status"] | undefined,
): "info" | "success" | "warning" | "error" {
  switch (status) {
    case "current":
      return "success";
    case "upgrade":
    case "install":
      return "info";
    case "newer_than_driver":
      return "warning";
    default:
      return "info";
  }
}

export function CudaCard({
  system,
  cuda,
}: {
  system: SystemInfo | null;
  cuda: CudaInfo | null;
}) {
  const toolkit = cuda?.toolkit;
  const rec = cuda?.recommendation;

  return (
    <Paper
      elevation={0}
      component="section"
      aria-labelledby="cuda-heading"
      sx={{ p: 2, border: 1, borderColor: "divider" }}
    >
      <Typography id="cuda-heading" variant="h2" component="h2" gutterBottom>
        CUDA and driver
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Driver version: {na(system?.driverVersion ?? null)}
      </Typography>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        Driver supports up to CUDA {na(cuda?.driverMaxCuda ?? system?.driverMaxCuda ?? null)}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {cuda?.explanation ??
          "This is the newest CUDA version your installed driver can support. It is not the CUDA toolkit installed on this machine."}
      </Typography>

      <Typography variant="body2" sx={{ mb: 1 }}>
        Toolkit installed: {toolkit?.installed ? "Yes" : "No"}
        {toolkit?.versions?.length ? ` (versions: ${toolkit.versions.join(", ")})` : ""}
        {toolkit?.active ? ` Active nvcc: ${toolkit.active}` : ""}
      </Typography>

      {rec && (
        <Alert
          severity={statusSeverity(rec.status)}
          sx={{ mb: 2 }}
          role="status"
          aria-label={`Toolkit recommendation: ${rec.message}`}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Recommendation
            {rec.recommendedToolkit ? `: CUDA Toolkit ${rec.recommendedToolkit}` : ""}
            {rec.driverBranch ? ` (${rec.driverBranch})` : ""}
          </Typography>
          <Typography variant="body2">{rec.message}</Typography>
          {rec.notes && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {rec.notes}
            </Typography>
          )}
          <Typography variant="body2" sx={{ mt: 1 }}>
            <Link href={rec.downloadsUrl} target="_blank" rel="noopener noreferrer">
              NVIDIA CUDA downloads
            </Link>
            {" · "}
            Catalog last checked {rec.lastChecked}
          </Typography>
        </Alert>
      )}

      {rec?.sources?.length ? (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary" id="rec-sources-label">
            Sources
          </Typography>
          <List dense aria-labelledby="rec-sources-label" sx={{ py: 0 }}>
            {rec.sources.map((s) => (
              <ListItem key={s.url} sx={{ py: 0.25, px: 0, minHeight: 44 }}>
                <Link href={s.url} target="_blank" rel="noopener noreferrer" variant="body2">
                  {s.title}
                </Link>
              </ListItem>
            ))}
          </List>
        </Box>
      ) : null}

      {system?.platform === "wsl" && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          WSL note: the driver comes from the Windows host. nvidia-smi is often under
          /usr/lib/wsl/lib. nvcc exists only if a toolkit is installed inside WSL. Process lists
          are often empty here. See docs/lan-access.md for LAN reach from other devices.
        </Typography>
      )}
    </Paper>
  );
}
