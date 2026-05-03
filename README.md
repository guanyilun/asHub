# asHub

A desktop app that runs one or more [agent-sh](https://github.com/guanyilun/agent-sh) sessions and exposes them through a web UI on a single port.

## Features

- **Multi-session** — sidebar to spawn, switch, and close sessions on the fly
- **Session persistence** — conversations survive restarts
- **Live streaming** — SSE with Markdown, syntax-highlighted code, file diffs, and tool calls
- **Pluggable backend** — `ash` (in-process) or `acp` (JSON-RPC subprocess)
- **Context inspection** — view, drop, or rewind conversation messages
- **Desktop native** — packaged for macOS (Apple Silicon) and Windows (x64)

## Install

```sh
# Pre-built binaries — download from GitHub Releases
# https://github.com/firslov/ashub/releases

# Or build from source
git clone https://github.com/firslov/ashub
cd ashub && npm install && npm link
```

> **macOS:** If Gatekeeper blocks the unsigned app: `xattr -dr com.apple.quarantine "/Applications/asHub.app"`
>
> **Windows:** Requires **PowerShell 7+** (`pwsh`). Install with `winget install Microsoft.PowerShell`.

## Usage

### Desktop App

```sh
npm run electron:dev       # development
npm run electron:dist:mac  # build macOS .dmg
npm run electron:dist:win  # build Windows .exe
```

### CLI / Server Mode

```sh
ashub                             # default: ash backend, port 7878
ashub --port 8080
ashub --backend acp --cmd "claude-code-acp"
```

Open <http://127.0.0.1:7878/> and click `+` in the sidebar.

| Flag                  | Default          | Description                           |
|-----------------------|------------------|---------------------------------------|
| `--port N`            | `7878`           | HTTP port                             |
| `--host HOST`         | `127.0.0.1`      | Bind host                             |
| `--backend ash\|acp`  | `ash`            | Bridge implementation                 |
| `--model NAME`        | settings default | Model override (ash backend)          |
| `--provider NAME`     | settings default | Provider override (ash backend)       |
| `--cmd "CMD ARGS"`    | `agent-sh-acp`   | Spawn command (acp backend)           |

### Backends

- **`ash`** — in-process agent-sh kernel. Uses `~/.agent-sh/settings.json` and user extensions.
- **`acp`** — spawns one JSON-RPC subprocess per session. Compatible with any ACP-speaking agent.

## API

| Method | Path                       | Description                                   |
|--------|----------------------------|-----------------------------------------------|
| GET    | `/`                        | Web UI; redirects to first session            |
| POST   | `/sessions`                | Spawn session `{ cwd?: string }`              |
| GET    | `/<id>/`                   | Web UI for session                            |
| GET    | `/<id>/events`             | SSE event stream                              |
| POST   | `/<id>/submit`             | Submit query `{ query: string }`              |
| GET    | `/<id>/context`            | Context snapshot                              |
| POST   | `/<id>/context/rewind`     | Drop trailing messages `{ toIndex: N }`       |
| DELETE | `/<id>/`                   | Close session                                 |

## Architecture

```
browser ──HTTP/SSE──> hub ──Bridge──> agent (in-process or subprocess)
```

The **Bridge** interface (`src/bridges/types.ts`) is the plug point: `submit`, `cancel`, `snapshot`, `compact`, plus event subscription.

## Extending

User extensions from `~/.agent-sh/extensions/` load on startup. Extensions that conflict with the hub should check `process.env.ASHUB_UNDER` and bail early.

To add a custom backend, implement the `Bridge` interface and wire it in `cli.ts`'s `makeFactory`.

## Status

Beta. Localhost only by default.
