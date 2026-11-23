/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import {
  fetchCuda,
  fetchSystem,
  type CudaInfo,
  type SamplePayload,
  type SystemInfo,
} from "./api";
import { GpuCard } from "./components/GpuCard";
import { CudaCard } from "./components/CudaCard";
import { ProcessesTable } from "./components/ProcessesTable";
import { RawAccordions } from "./components/RawAccordions";

export default function App() {
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [cuda, setCuda] = useState<CudaInfo | null>(null);
  const [sample, setSample] = useState<SamplePayload | null>(null);
  const [live, setLive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Connecting...");
  const [loadError, setLoadError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const loadStatic = useCallback(async () => {
    try {
      const [sys, cu] = await Promise.all([fetchSystem(), fetchCuda()]);
      setSystem(sys);
      setCuda(cu);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load system info");
    }
  }, []);

  const closeStream = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setLive(false);
  }, []);

  const openStream = useCallback(() => {
    closeStream();
    const es = new EventSource("/api/stream");
    esRef.current = es;
    es.onopen = () => {
      setLive(true);
      setStatusMsg("Live updates on");
    };
    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data) as SamplePayload;
        setSample(payload);
        setLive(true);
      } catch {
        // ignore malformed
      }
    };
    es.onerror = () => {
      setLive(false);
      setStatusMsg("Stream disconnected");
    };
  }, [closeStream]);

  useEffect(() => {
    void loadStatic();
  }, [loadStatic]);

  useEffect(() => {
    if (!paused) {
      openStream();
      setStatusMsg("Live updates on");
    } else {
      closeStream();
      setStatusMsg("Paused");
    }
    return () => closeStream();
  }, [paused, openStream, closeStream]);

  const noDriver = system != null && !system.smi.found;

  return (
    <Box sx={{ minHeight: "100vh", pb: 6 }}>
      <Box
        component="header"
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          py: 1.5,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <Container maxWidth="md">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="h1" component="h1" sx={{ m: 0 }}>
                CUDA Dashboard
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1, flexWrap: "wrap" }}>
                <Chip
                  label={`${system?.appHostname ?? "..."}:${system?.port ?? "..."}`}
                  color="primary"
                  variant="outlined"
                />
                {system && (
                  <Chip
                    label={system.platform.toUpperCase()}
                    color={system.platform === "wsl" ? "secondary" : "default"}
                  />
                )}
                <Chip
                  icon={
                    <Box
                      component="span"
                      aria-hidden
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: live && !paused ? "success.main" : "grey.500",
                        display: "inline-block",
                        ml: 1,
                        transition: (t) =>
                          t.transitions.create("opacity", {
                            duration: t.transitions.duration.short,
                          }),
                      }}
                    />
                  }
                  label={live && !paused ? "Live" : "Idle"}
                  variant="outlined"
                />
              </Stack>
            </Box>
            <Button
              variant="contained"
              onClick={() => setPaused((p) => !p)}
              aria-pressed={paused}
            >
              {paused ? "Resume" : "Pause"}
            </Button>
          </Stack>
          <Typography
            variant="body2"
            color="text.secondary"
            aria-live="polite"
            sx={{ mt: 1 }}
          >
            {statusMsg}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ mt: 3 }} component="main">
        {loadError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {loadError}
          </Alert>
        )}

        {noDriver && (
          <Alert severity="warning" sx={{ mb: 2 }} role="status">
            No NVIDIA driver tools were found on this machine. Install an NVIDIA GPU driver so
            nvidia-smi is available, then refresh. The rest of the page stays available for raw
            command attempts and settings checks.
          </Alert>
        )}

        <Stack spacing={2.5}>
          <CudaCard system={system} cuda={cuda} />

          <Box component="section" aria-labelledby="gpus-heading">
            <Typography id="gpus-heading" variant="h2" component="h2" gutterBottom>
              GPUs
            </Typography>
            {(sample?.gpus?.length ?? 0) === 0 ? (
              <Alert severity="info">
                {noDriver
                  ? "No GPU metrics to show until nvidia-smi is available."
                  : "Waiting for GPU metrics..."}
              </Alert>
            ) : (
              <Stack spacing={2}>
                {sample!.gpus.map((gpu, i) => (
                  <GpuCard key={`${gpu.index ?? "g"}-${gpu.name ?? i}`} gpu={gpu} />
                ))}
              </Stack>
            )}
          </Box>

          <ProcessesTable processes={sample?.processes ?? null} />
          <RawAccordions />
        </Stack>
      </Container>

      <Box
        component="footer"
        sx={{
          mt: 4,
          py: 3,
          borderTop: 1,
          borderColor: "divider",
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Typography variant="body2" color="text.secondary">
            LAN only, no login; anyone on your network can view this.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Copyright Advanced Software and AI Solutions LLC
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
