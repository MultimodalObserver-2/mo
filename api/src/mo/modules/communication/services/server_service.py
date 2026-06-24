import asyncio
import json
import logging
import socket
import time
from pathlib import Path
from typing import Any

from mo.core.config.constants import LOGGER_NAME
from mo.core.utils.http_exceptions import BadRequestException
from mo.core.utils.singleton import singleton
from mo.modules.communication.schemas.message import ChatMessage, NoteMessage
from mo.modules.communication.schemas.server import ClientInfo, ServerConfig, ServerStatus
from mo.modules.communication.services.tcp_server import RemoteClientConnection, TCPServer
from mo.modules.communication.services.udp_server import MULTICAST_IP, UDPServer
from mo.core.utils.i18n import translate

CMD_GET_PORTS               = "gp"
CMD_GET_PORTS_RESPONSE      = "gpR"
CMD_GET_ACTIVE_PLUGINS      = "gap"
CMD_GET_ACTIVE_PLUGINS_RESPONSE = "gapR"
CMD_END_CONNECTION          = "endc"
CMD_MSG_SERVER_TO_CLIENT    = "msgSTC"
CMD_MSG_CLIENT_TO_SERVER    = "msgCTS"
CMD_TAKE_NOTE               = "takeNote"
CMD_TIMESTAMP_RESPONSE      = "timestampMOR"
CMD_GET_TIMESTAMP           = "getTimestampMO"
CMD_DATA_STREAMING          = "dataStreaming"
CMD_START_STREAMING         = "startStreaming"
CMD_STOP_STREAMING          = "stopStreaming"
CMD_CHANGE_QUALITY_STREAMING = "changeQualityStreaming"
CMD_UPDATE_STATE_RECORDING  = "updateSrecording"
CMD_UPDATE_STATE_STREAMING  = "updateSstreaming"
CMD_DIRECT_CONFIGS          = "sendDConfigs"
CMD_CANCEL_RECORDING        = "cancelRecording"
CMD_PAUSE_RESUME_RECORDING  = "pauseResumeRecording"
CMD_STOP_RECORDING          = "stopRecording"
CMD_GET_RECORDING_STATE     = "getRecordingState"
CMD_RECORDING_STATE_R       = "recordingStateR"

_BROADCAST_RECORDING = {
    CMD_UPDATE_STATE_RECORDING,
    CMD_UPDATE_STATE_STREAMING,
    CMD_CANCEL_RECORDING,
    CMD_PAUSE_RESUME_RECORDING,
    CMD_STOP_RECORDING,
    CMD_GET_RECORDING_STATE,
    CMD_RECORDING_STATE_R,
}


@singleton
class ServerService:
    """Service that manages the TCP/UDP communication server, connected remote clients,
    chat and notes history, plugin streaming state, and direct device configuration.
    Uses a singleton pattern to ensure a single shared instance across the application."""

    def __init__(self):
        """Initialize the ServerService with empty state."""
        self._clients: dict[str, RemoteClientConnection] = {}
        self._tcp_server: TCPServer | None = None
        self._udp_server: UDPServer | None = None
        self._online = False
        self._is_streaming = False
        self._local_ip: str | None = None
        self._port_tcp: int = 4444
        self._port_udp: int = 5555
        self._chat_history: list[ChatMessage] = []
        self._notes_history: list[NoteMessage] = []
        self._notes_file_path: Path | None = None
        self._available_plugins: dict[str, dict[str, Any]] = {}
        self._direct_configs: dict | None = None
        self._ws_listeners: list[asyncio.Queue] = []
        self._logger = logging.getLogger(LOGGER_NAME)

    async def start_server(self, config: ServerConfig) -> None:
        """Start the TCP and UDP servers with the given port configuration."""
        if self._online:
            raise BadRequestException(translate("communication.alreadyOnline"))

        self._port_tcp = config.port_tcp
        self._port_udp = config.port_udp
        self._local_ip = self.get_local_ip()

        self._tcp_server = TCPServer(
            port=self._port_tcp,
            on_message=self.handle_tcp_message,
            on_connect=self.on_client_connect,
            on_disconnect=self.on_client_disconnect,
        )
        self._udp_server = UDPServer(MULTICAST_IP, self._port_udp)

        try:
            await self._tcp_server.start()
        except OSError as e:
            self._tcp_server = None
            self._udp_server = None
            raise BadRequestException(
                translate("communication.portInUse").format(port=self._port_tcp)
            ) from e

        try:
            self._udp_server.start()
        except OSError as e:
            await self._tcp_server.stop()
            self._tcp_server = None
            self._udp_server = None
            raise BadRequestException(
                translate("communication.portInUse").format(port=self._port_udp)
            ) from e

        self._online = True
        self._logger.info(
            f"[ServerService] Server online — TCP:{self._port_tcp} UDP:{self._port_udp}"
        )

    async def stop_server(self) -> None:
        """Stop the TCP and UDP servers and disconnect all connected clients."""
        if not self._online:
            raise BadRequestException(translate("communication.notOnline"))

        end_msg = {"type": CMD_END_CONNECTION, "data": {}}
        for client in list(self._clients.values()):
            await client.send(end_msg)
            await client.close()
        self._clients.clear()

        if self._tcp_server:
            await self._tcp_server.stop()
            self._tcp_server = None

        if self._udp_server:
            self._udp_server.stop()
            self._udp_server = None

        self._available_plugins.clear()
        self._direct_configs = None
        self._is_streaming = False
        self._online = False
        self._logger.info("[ServerService] Server offline")

    def get_status(self) -> ServerStatus:
        """Return current server status including online state, IP, ports, and connected clients."""
        clients = [
            ClientInfo(id=c.id, ip=c.ip, capture_plugins=c.capture_plugins)
            for c in self._clients.values()
        ]
        return ServerStatus(
            online=self._online,
            is_streaming=self._is_streaming,
            local_ip=self._local_ip if self._online else None,
            port_tcp=self._port_tcp if self._online else None,
            port_udp=self._port_udp if self._online else None,
            clients=clients,
        )

    def configure_direct_devices(self, config: dict) -> None:
        """Store direct device configuration to be sent to each client on connect."""
        self._direct_configs = config

    def set_notes_path(self, path: Path) -> None:
        """Set the file path where received notes are persisted as JSON lines."""
        self._notes_file_path = path
        path.parent.mkdir(parents=True, exist_ok=True)

    async def on_client_connect(self, client: RemoteClientConnection) -> None:
        """Handle a new client connection: send ports, direct configs, and active plugin list."""
        self._clients[client.id] = client
        await client.send({"type": CMD_GET_PORTS_RESPONSE, "data": {"portUDP": str(self._port_udp)}})

        if self._direct_configs is not None:
            await client.send({"type": CMD_DIRECT_CONFIGS, "data": self._direct_configs})

        if self._available_plugins:
            configs = {k: v.get("initial_config") for k, v in self._available_plugins.items()}
            await client.send({"type": CMD_GET_ACTIVE_PLUGINS_RESPONSE, "data": configs})
            for plugin_id in self._available_plugins:
                client.add_capture_plugin(plugin_id)

        await self.broadcast_ws_event("client_connected", {"id": client.id, "ip": client.ip})

    async def on_client_disconnect(self, client: RemoteClientConnection) -> None:
        """Handle a client disconnection and broadcast the event."""
        self._clients.pop(client.id, None)
        await self.broadcast_ws_event("client_disconnected", {"id": client.id, "ip": client.ip})

    async def handle_tcp_message(
        self, client: RemoteClientConnection, message: dict
    ) -> None:
        """Route an incoming TCP message to the appropriate handler based on its command type."""
        msg_type = message.get("type", "")
        data = message.get("data") or {}
        inactive: list[str] = []

        if msg_type == CMD_GET_PORTS:
            sent = await client.send(
                {"type": CMD_GET_PORTS_RESPONSE, "data": {"portUDP": str(self._port_udp)}}
            )
            if not sent:
                inactive.append(client.id)

        elif msg_type == CMD_MSG_CLIENT_TO_SERVER:
            broadcast = {"type": CMD_MSG_SERVER_TO_CLIENT, "data": data}
            for cid, c in list(self._clients.items()):
                if cid != client.id:
                    if not await c.send(broadcast):
                        inactive.append(cid)
            entry = ChatMessage(
                timestamp=time.time(),
                name=str(data.get("name", "Remote")),
                content=str(data.get("msg", "")),
                from_server=False,
            )
            self._chat_history.append(entry)
            await self.broadcast_ws_event("chat_message", entry.model_dump())

        elif msg_type == CMD_MSG_SERVER_TO_CLIENT:
            for cid, c in list(self._clients.items()):
                if not await c.send(message):
                    inactive.append(cid)

        elif msg_type == CMD_TAKE_NOTE:
            note = NoteMessage(
                timestamp=time.time(),
                name=str(data.get("name", "Remote")),
                content=str(data.get("noteContent", "")),
                time_begin=float(data.get("timeBegin", 0)),
                time_end=float(data.get("timeEnd", 0)),
            )
            self._notes_history.append(note)
            self._persist_note(note)
            await self.broadcast_ws_event("note_received", note.model_dump())

        elif msg_type == CMD_STOP_STREAMING:
            plugin_id = str(data.get("id", ""))
            client.remove_capture_plugin(plugin_id)
            still_active = any(
                plugin_id in c.capture_plugins for c in self._clients.values()
            )
            if not still_active:
                self._is_streaming = any(
                    bool(c.capture_plugins) for c in self._clients.values()
                )
                await self.broadcast_ws_event("streaming_stopped", {"id": plugin_id})

        elif msg_type == CMD_CHANGE_QUALITY_STREAMING:
            plugin_id = str(data.get("id", ""))
            client.add_capture_plugin(plugin_id)
            self._is_streaming = True
            await self.broadcast_ws_event("streaming_quality_changed", data)

        elif msg_type == CMD_END_CONNECTION:
            inactive.append(client.id)

        elif msg_type in _BROADCAST_RECORDING:
            for cid, c in list(self._clients.items()):
                if not await c.send(message):
                    inactive.append(cid)
            await self.broadcast_ws_event(msg_type, data)

        else:
            await self.broadcast_ws_event("unknown_command", {"type": msg_type, "data": data})

        for cid in inactive:
            c = self._clients.pop(cid, None)
            if c:
                await c.close()
                await self.broadcast_ws_event("client_disconnected", {"id": cid, "ip": c.ip})

    def _persist_note(self, note: NoteMessage) -> None:
        if self._notes_file_path is None:
            return
        try:
            with self._notes_file_path.open("a", encoding="utf-8") as f:
                f.write(json.dumps(note.model_dump()) + "\n")
        except OSError:
            pass

    async def send_chat_message(self, name: str, content: str) -> None:
        """Broadcast a chat message from the server to all connected clients."""
        if not self._online:
            raise BadRequestException(translate("communication.notOnline"))
        message = {"type": CMD_MSG_SERVER_TO_CLIENT, "data": {"name": name, "msg": content}}
        inactive: list[str] = []
        for cid, c in list(self._clients.items()):
            if not await c.send(message):
                inactive.append(cid)
        for cid in inactive:
            c = self._clients.pop(cid, None)
            if c:
                await c.close()
        entry = ChatMessage(timestamp=time.time(), name=name, content=content, from_server=True)
        self._chat_history.append(entry)
        await self.broadcast_ws_event("chat_message", entry.model_dump())

    def get_chat_history(self) -> list[ChatMessage]:
        return list(self._chat_history)

    def get_notes_history(self) -> list[NoteMessage]:
        return list(self._notes_history)

    async def add_active_capture_plugin(
        self, plugin_id: str, initial_config: dict | None = None
    ) -> None:
        """Register a capture plugin as active and notify all connected clients."""
        self._available_plugins[plugin_id] = {"initial_config": initial_config}
        for client in self._clients.values():
            client.add_capture_plugin(plugin_id)
        if self._clients:
            configs = {k: v.get("initial_config") for k, v in self._available_plugins.items()}
            inactive: list[str] = []
            for cid, c in list(self._clients.items()):
                if not await c.send({"type": CMD_GET_ACTIVE_PLUGINS_RESPONSE, "data": configs}):
                    inactive.append(cid)
            for cid in inactive:
                self._clients.pop(cid, None)

    def send_capture_data(self, event_data: dict) -> None:
        """Send capture plugin data to all connected clients via UDP multicast."""
        if self._udp_server and self._clients:
            self._udp_server.send({"type": CMD_DATA_STREAMING, "data": event_data})

    def subscribe_ws(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        self._ws_listeners.append(q)
        return q

    def unsubscribe_ws(self, q: asyncio.Queue) -> None:
        if q in self._ws_listeners:
            self._ws_listeners.remove(q)

    async def broadcast_ws_event(self, event: str, payload: dict) -> None:
        message = {"event": event, "payload": payload}
        for q in self._ws_listeners:
            await q.put(message)

    @staticmethod
    def get_local_ip() -> str:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "127.0.0.1"
