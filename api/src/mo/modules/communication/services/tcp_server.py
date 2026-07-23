import asyncio
import json
import logging
import uuid
from typing import TYPE_CHECKING, Callable

from mo.core.config.constants import LOGGER_NAME

if TYPE_CHECKING:
    from mo.modules.communication.services.server_service import ServerService


class RemoteClientConnection:

    def __init__(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        self.id = str(uuid.uuid4())[:8]
        self.reader = reader
        self.writer = writer
        addr = writer.get_extra_info("peername")
        self.ip: str = addr[0] if addr else "unknown"
        self.capture_plugins: list[str] = []

    def add_capture_plugin(self, plugin_id: str) -> None:
        if plugin_id not in self.capture_plugins:
            self.capture_plugins.append(plugin_id)

    def remove_capture_plugin(self, plugin_id: str) -> None:
        if plugin_id in self.capture_plugins:
            self.capture_plugins.remove(plugin_id)

    async def send(self, message: dict) -> bool:
        try:
            data = (json.dumps(message) + "\n").encode("utf-8")
            self.writer.write(data)
            await self.writer.drain()
            return True
        except Exception:
            return False

    async def close(self) -> None:
        try:
            if not self.writer.is_closing():
                self.writer.close()
                await self.writer.wait_closed()
        except Exception:
            pass


class TCPServer:

    def __init__(self, port: int, on_message: Callable, on_connect: Callable, on_disconnect: Callable):
        self.port = port
        self.on_message = on_message
        self.on_connect = on_connect
        self.on_disconnect = on_disconnect
        self.server: asyncio.Server | None = None
        self.logger = logging.getLogger(LOGGER_NAME)

    async def start(self) -> None:
        self.server = await asyncio.start_server(
            self.handle_client, "0.0.0.0", self.port
        )
        asyncio.create_task(self.server.serve_forever())
        self.logger.info(f"[TCPServer] Listening on port {self.port}")

    async def handle_client(
        self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter
    ) -> None:
        client = RemoteClientConnection(reader, writer)
        self.logger.info(f"[TCPServer] Client connected: {client.ip} (id={client.id})")
        await self.on_connect(client)
        try:
            while True:
                line = await reader.readline()
                if not line:
                    break
                try:
                    message = json.loads(line.decode("utf-8").strip())
                    await self.on_message(client, message)
                except json.JSONDecodeError:
                    self.logger.warning(
                        f"[TCPServer] Invalid JSON from client {client.id}"
                    )
        except (asyncio.IncompleteReadError, ConnectionResetError, BrokenPipeError):
            pass
        finally:
            self.logger.info(f"[TCPServer] Client disconnected: {client.ip} (id={client.id})")
            await self.on_disconnect(client)
            await client.close()

    async def stop(self) -> None:
        if self.server:
            self.server.close()
            await self.server.wait_closed()
            self.server = None
            self.logger.info("[TCPServer] Stopped")
