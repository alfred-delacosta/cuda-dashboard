/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { Box, LinearProgress, Typography } from "@mui/material";

interface GaugeProps {
  label: string;
  value: number | null;
  max?: number;
  display: string;
}

export function Gauge({ label, value, max = 100, display }: GaugeProps) {
  const pct = value == null || max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  const level =
    value == null ? "unknown" : pct >= 90 ? "high" : pct >= 70 ? "elevated" : "normal";

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 0.5 }}>
        <Typography variant="body2" component="span">
          {label}
        </Typography>
        <Typography variant="body2" component="span" aria-live="polite">
          {display}
          <Box component="span" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
            {`, status ${level}`}
          </Box>
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        aria-label={`${label} ${display}`}
        sx={{
          height: 10,
          borderRadius: 1,
          transition: (t) =>
            t.transitions.create("transform", { duration: t.transitions.duration.short }),
          bgcolor: (t) => (t.palette.mode === "dark" ? "grey.800" : "grey.200"),
          "& .MuiLinearProgress-bar": {
            bgcolor:
              level === "high" ? "error.main" : level === "elevated" ? "warning.main" : "primary.main",
          },
        }}
      />
    </Box>
  );
}
