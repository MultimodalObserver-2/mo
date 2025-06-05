
import threading

class ListBuffer[T]:
    def __init__(self):
        self._buffer = [] # type: list[T]
        self._lock = threading.Lock()

    def add(self, item: T):
        with self._lock:
            self._buffer.append(item)

    def get_all(self) -> list[T]:
        with self._lock:
            return list(self._buffer)

    def clear(self):
        with self._lock:
            self._buffer.clear()

    def get_all_and_clear(self) -> list[T]:
        with self._lock:
            items = list(self._buffer)
            self._buffer.clear()
            return items
    
    def get(self, index: int) -> T:
        return self.__getitem__(index)

    def __len__(self):
        with self._lock:
            return len(self._buffer)

    def __getitem__(self, index: int) -> T:
        with self._lock:
            return self._buffer[index]
