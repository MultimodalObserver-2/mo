import threading


class ListBuffer[T]:
    """A thread-safe buffer that allows adding, retrieving, and clearing items.
    This class is generic and can hold items of any type T.
    It uses a lock to ensure thread safety when accessing the buffer.
    """

    def __init__(self):
        """Initialize an empty buffer."""
        self._buffer = []  # type: list[T]
        self._lock = threading.Lock()

    def add(self, item: T):
        """Add an item to the buffer.
        Args:
            item (T): The item to be added to the buffer.
        """
        with self._lock:
            self._buffer.append(item)

    def get_all(self) -> list[T]:
        """Retrieve all items from the buffer.
        Returns:
            list[T]: A list of all items currently in the buffer.
        """
        with self._lock:
            return list(self._buffer)

    def clear(self):
        """Clear all items from the buffer.
        This method empties the buffer, removing all items.
        """
        with self._lock:
            self._buffer.clear()

    def get_all_and_clear(self) -> list[T]:
        """Retrieve all items from the buffer and clear it.
        Returns:
            list[T]: A list of all items that were in the buffer before clearing it.
        """
        with self._lock:
            items = list(self._buffer)
            self._buffer.clear()
            return items

    def get(self, index: int) -> T:
        """Retrieve an item at a specific index from the buffer.
        Args:
            index (int): The index of the item to retrieve.
        Returns:
            T: The item at the specified index in the buffer.
        Raises:
            IndexError: If the index is out of bounds.
        """
        return self.__getitem__(index)

    def is_empty(self) -> bool:
        """Check if the buffer is empty.
        Returns:
            bool: True if the buffer is empty, False otherwise.
        """
        with self._lock:
            return len(self._buffer) == 0

    def __len__(self):
        """Get the number of items in the buffer.
        Returns:
            int: The number of items currently in the buffer.
        """
        with self._lock:
            return len(self._buffer)

    def __getitem__(self, index: int) -> T:
        """Retrieve an item at a specific index from the buffer.
        Args:
            index (int): The index of the item to retrieve.
        Returns:
            T: The item at the specified index in the buffer.
        Raises:
            IndexError: If the index is out of bounds.
        """
        with self._lock:
            return self._buffer[index]
