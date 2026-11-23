/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { Link, Paper, Typography } from "@mui/material";
import type { CudaInfo, SystemInfo } from "../api";
import { na } from "../format";

export function CudaCard({
  system,
  cuda,
}: {
  system: SystemInfo | null;
  cuda: CudaInfo | null;
}) {
  const toolkit = cuda?.toolkit;
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

      {!toolkit?.installed && (
        <Typography variant="body2">
          Install a toolkit from{" "}
          <Link
            href="https://developer.nvidia.com/cuda-downloads"
            target="_blank"
            rel="noopener noreferrer"
          >
            NVIDIA CUDA downloads
          </Link>
          . Recommendation arrives in Phase 2.
        </Typography>
      )}

      {system?.platform === "wsl" && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          WSL note: the driver comes from the Windows host. nvidia-smi is often under
          /usr/lib/wsl/lib. nvcc exists only if a toolkit is installed inside WSL. Process lists
          are often empty here.
        </Typography>
      )}
    </Paper>
  );
}
