/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { useCallback, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Paper,
  Typography,
} from "@mui/material";
import { fetchRaw, type RawResult } from "../api";

const RAW_IDS = [
  "smi.query",
  "smi.xml",
  "smi.apps",
  "smi.list",
  "smi.summary",
  "smi.topo",
  "nvcc.version",
] as const;

export function RawAccordions() {
  const [cache, setCache] = useState<Record<string, RawResult | "loading" | "error">>({});
  const [announce, setAnnounce] = useState("");

  const load = useCallback(async (id: string) => {
    setCache((c) => ({ ...c, [id]: "loading" }));
    try {
      const result = await fetchRaw(id);
      setCache((c) => ({ ...c, [id]: result }));
    } catch {
      setCache((c) => ({ ...c, [id]: "error" }));
    }
  }, []);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setAnnounce("Copied to clipboard");
    } catch {
      setAnnounce("Copy failed");
    }
  };

  return (
    <Paper
      elevation={0}
      component="section"
      aria-labelledby="raw-heading"
      sx={{ p: 2, border: 1, borderColor: "divider" }}
    >
      <Typography id="raw-heading" variant="h2" component="h2" gutterBottom>
        Raw command output
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Allowlisted NVIDIA commands only. Expand to load; identifiers may be redacted.
      </Typography>
      <Box aria-live="polite" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {announce}
      </Box>
      {RAW_IDS.map((id) => {
        const entry = cache[id];
        return (
          <Accordion
            key={id}
            disableGutters
            onChange={(_e, expanded) => {
              if (expanded && !entry) void load(id);
            }}
            sx={{
              "&:before": { display: "none" },
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <AccordionSummary
              aria-controls={`${id}-content`}
              id={`${id}-header`}
              sx={{ minHeight: 44, "& .MuiAccordionSummary-content": { my: 1 } }}
            >
              <Typography>{id}</Typography>
            </AccordionSummary>
            <AccordionDetails id={`${id}-content`}>
              {entry === "loading" && <Typography>Loading...</Typography>}
              {entry === "error" && <Typography color="error">Failed to load</Typography>}
              {entry && entry !== "loading" && entry !== "error" && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontFamily: "monospace" }}>
                    {entry.displayCommand}
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => void copy(entry.output)}
                    sx={{ mb: 1 }}
                  >
                    Copy
                  </Button>
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      p: 1.5,
                      overflow: "auto",
                      bgcolor: (t) => (t.palette.mode === "dark" ? "grey.900" : "grey.100"),
                      borderRadius: 1,
                      fontSize: "0.75rem",
                      maxHeight: 320,
                    }}
                  >
                    {entry.output || "(empty)"}
                  </Box>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Paper>
  );
}
