/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { Box, Chip, Paper, Typography } from "@mui/material";
import type { GpuMetrics } from "../api";
import { Gauge } from "./Gauge";
import { na, pct } from "../format";

export function GpuCard({ gpu }: { gpu: GpuMetrics }) {
  const title = gpu.name ?? `GPU ${gpu.index ?? "?"}`;
  return (
    <Paper
      elevation={0}
      component="article"
      aria-label={title}
      sx={{
        p: 2,
        border: 1,
        borderColor: "divider",
        transition: (t) =>
          t.transitions.create(["opacity", "transform"], {
            duration: t.transitions.duration.short,
          }),
      }}
    >
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", mb: 1.5 }}>
        <Typography variant="h2" component="h2" sx={{ m: 0 }}>
          {title}
        </Typography>
        <Chip size="small" label={`CC ${na(gpu.computeCap)}`} />
        <Chip size="small" label={`P-state ${na(gpu.pstate)}`} />
      </Box>

      <Gauge label="GPU utilization" value={gpu.utilizationGpu} display={pct(gpu.utilizationGpu)} />
      <Gauge
        label="Memory"
        value={gpu.memoryUsedMiB}
        max={gpu.memoryTotalMiB ?? 100}
        display={
          gpu.memoryUsedMiB != null && gpu.memoryTotalMiB != null
            ? `${gpu.memoryUsedMiB} / ${gpu.memoryTotalMiB} MiB`
            : "Not available"
        }
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 1.5,
          mt: 1,
        }}
      >
        <Metric label="Temperature" value={na(gpu.temperatureGpu, " C")} />
        <Metric
          label="Power"
          value={
            gpu.powerDrawW != null && gpu.powerLimitW != null
              ? `${gpu.powerDrawW} / ${gpu.powerLimitW} W`
              : "Not available"
          }
        />
        <Metric label="Fan" value={pct(gpu.fanSpeed)} />
        <Metric
          label="SM clock"
          value={
            gpu.clocksSm != null && gpu.clocksMaxSm != null
              ? `${gpu.clocksSm} / ${gpu.clocksMaxSm} MHz`
              : "Not available"
          }
        />
      </Box>
    </Paper>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}
