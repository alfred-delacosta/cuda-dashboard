/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { useMemo, type ReactNode } from "react";
import { createTheme, ThemeProvider, useMediaQuery } from "@mui/material";

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDark ? "dark" : "light",
          primary: { main: prefersDark ? "#4caf8e" : "#0b6e4f" },
          background: prefersDark
            ? { default: "#0f1419", paper: "#1a222c" }
            : { default: "#f3f6f4", paper: "#ffffff" },
        },
        typography: {
          fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
          h1: { fontSize: "1.5rem", fontWeight: 700 },
          h2: { fontSize: "1.15rem", fontWeight: 600 },
        },
        shape: { borderRadius: 10 },
        transitions: {
          duration: {
            shortest: 150,
            shorter: 200,
            short: 250,
            standard: 300,
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                minHeight: 44,
                textTransform: "none",
              },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                minWidth: 44,
                minHeight: 44,
              },
            },
          },
          MuiCssBaseline: {
            styleOverrides: {
              "@media (prefers-reduced-motion: reduce)": {
                "*, *::before, *::after": {
                  animationDuration: "0.01ms !important",
                  animationIterationCount: "1 !important",
                  transitionDuration: "0.01ms !important",
                },
              },
              body: {
                margin: 0,
              },
              ":focus-visible": {
                outline: "3px solid",
                outlineOffset: 2,
              },
            },
          },
        },
      }),
    [prefersDark],
  );

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
