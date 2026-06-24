import asyncio
import json
import logging
import socket

from mo.core.config.constants import LOGGER_NAME

MULTICAST_IP = "230.0.0.0"
BUFFER_SIZE = 30720


class UDPServer:

    def __init__(self, multicast_ip: str, port: int):
        self._multicast_ip = multicast_ip
        self._port = port
        self._sock: socket.socket | None = None
        self._logger = logging.getLogger(LOGGER_NAME)

    def start(self) -> None:
        self._sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
        self._sock.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 2)
        self._logger.info(
            f"[UDPServer] Multicast sender ready on {self._multicast_ip}:{self._port}"
        )

    def send(self, message: dict) -> None:
        if self._sock is None:
            return
        try:
            data = json.dumps(message).encode("utf-8")
            if len(data) <= BUFFER_SIZE:
                self._sock.sendto(data, (self._multicast_ip, self._port))
        except Exception as e:
            self._logger.error(f"[UDPServer] Send error: {e}")

    def stop(self) -> None:
        if self._sock:
            self._sock.close()
            self._sock = None
            self._logger.info("[UDPServer] Stopped")
