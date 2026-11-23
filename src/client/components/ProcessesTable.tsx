/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { ProcessesInfo } from "../api";
import { na } from "../format";

export function ProcessesTable({ processes }: { processes: ProcessesInfo | null }) {
  const apps = processes?.apps ?? [];
  return (
    <Paper
      elevation={0}
      component="section"
      aria-labelledby="processes-heading"
      sx={{ p: 2, border: 1, borderColor: "divider" }}
    >
      <Typography id="processes-heading" variant="h2" component="h2" gutterBottom>
        Compute processes
      </Typography>
      <Typography variant="body2" sx={{ mb: 1.5 }}>
        {processes
          ? `${processes.pidCount} process${processes.pidCount === 1 ? "" : "es"}; memory ${na(
              processes.totalMemoryMiB,
              " MiB",
            )}`
          : "Loading..."}
      </Typography>
      <TableContainer>
        <Table size="small" aria-label="Compute processes">
          <TableHead>
            <TableRow>
              <TableCell>PID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>GPU UUID</TableCell>
              <TableCell align="right">Memory (MiB)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {apps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>No compute processes reported</TableCell>
              </TableRow>
            ) : (
              apps.map((app, i) => (
                <TableRow key={`${app.pid ?? "x"}-${i}`}>
                  <TableCell>{na(app.pid)}</TableCell>
                  <TableCell>{app.processName ?? "(hidden)"}</TableCell>
                  <TableCell>{na(app.gpuUuid)}</TableCell>
                  <TableCell align="right">{na(app.usedMemoryMiB)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
