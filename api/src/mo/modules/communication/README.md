# Communication Module

The Communication Module is an extension for Multimodal Observer that enables real-time communication between MO and remote clients. It exposes a TCP server for command exchange and chat, a UDP multicast channel for high-frequency plugin streaming data, and a WebSocket endpoint for pushing live events to the MO interface.

## Key Features

The module supports bidirectional chat, timestamped note-taking with optional file persistence, plugin streaming state management, direct device configuration delivery to connected clients, and full recording lifecycle commands (start, stop, pause/resume, cancel). Notes received from remote clients are optionally persisted to a JSON lines file alongside the session data.

## How It Works

On startup, MO discovers the module automatically through its module loader — no changes to core application files are required. When the server is started via the API, a TCP listener accepts remote client connections over JSON newline-delimited messages and a UDP multicast group (`230.0.0.0`) begins broadcasting capture plugin data. Each connecting client receives the active UDP port, any direct device configuration, and the list of currently active capture plugins. All TCP events (chat messages, notes, client connections/disconnections, recording state changes) are forwarded in real time to the MO interface via WebSocket at `/communication/server/ws`.
