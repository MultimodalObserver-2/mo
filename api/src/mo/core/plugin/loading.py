import asyncio

# Global event to signal when plugins are ready
global plugin_ready_event
plugin_ready_event = asyncio.Event()
