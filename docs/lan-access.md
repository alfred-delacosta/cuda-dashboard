# LAN access

Copyright Advanced Software and AI Solutions LLC

**LAN only, no login; anyone on your network can view this.**

This guide covers reaching CUDA Dashboard from a phone or another PC on your LAN, including WSL networking.

## Windows host (recommended)

1. Set `HOST=0.0.0.0` in `.env` (this is the default).
2. Set `APP_HOSTNAME` to the name you will type in the browser (for example `dell-aio.local`).
3. In Pi-hole (or your local DNS), create an A record from that name to the Windows machine's LAN IPv4 address.
4. Allow inbound TCP on your `PORT` (default 3000) in Windows Firewall on the **Private** profile only. Do this yourself; this project never changes firewall rules.
5. Open `http://dell-aio.local:3000` (or your name and port). The header chip should show `APP_HOSTNAME:PORT`.

If the page fails with 421, the `Host` header did not match `APP_HOSTNAME`, the OS hostname, `localhost`, or a local interface IP. Fix DNS or set `APP_HOSTNAME` to the name you use.

If the page fails with 403, the client IP is outside `ALLOWED_CIDRS` (loopback and private ranges by default).

## WSL Ubuntu

The dashboard can run inside WSL, but LAN clients often cannot reach WSL's listen address the same way they reach Windows.

### Option A: Mirrored networking (WSL2)

On Windows 11 with a recent WSL, enable mirrored mode so WSL shares the host's network interface.

Create or edit `%UserProfile%\.wslconfig`:

```ini
[wsl2]
networkingMode=mirrored
```

Then from PowerShell:

```powershell
wsl --shutdown
```

Restart your distro, start the dashboard with `HOST=0.0.0.0`, and try the Pi-hole name again from your phone. Firewall still applies on the Windows host.

### Option B: portproxy from Windows to WSL

If mirrored mode is unavailable, forward a Windows port to the WSL IP.

1. In WSL, run `hostname -I` and note the first IPv4 address (it can change after restart).
2. In an elevated PowerShell on Windows:

```powershell
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=3000 connectaddress=<WSL_IP> connectport=3000
```

3. Allow the listen port in Windows Firewall on the Private profile (manual step).
4. Point Pi-hole at the **Windows** LAN IP, not the WSL IP.
5. After WSL restarts, update the portproxy `connectaddress` if the WSL IP changed.

List and remove rules:

```powershell
netsh interface portproxy show all
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=3000
```

### Prefer running on Windows

For the fewest networking surprises, run `npm start` on Windows and use WSL only when you need a Linux toolkit/`nvcc` environment. The UI shows a WSL badge and notes when the server detects WSL.

## Security reminders

- Do not expose this app to the public internet.
- Keep `ALLOWED_CIDRS` limited to networks you trust.
- `SHOW_IDENTIFIERS` and `SHOW_PROCESS_NAMES` default to false.
