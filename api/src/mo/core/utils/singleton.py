import functools


def singleton(cls):
    """A decorator to make a class a singleton
    Args:
        cls (type): The class to be made a singleton.
    Returns:
        function: A function that returns the singleton instance of the class.
    """
    instances = {}  # Dictionary to hold the singleton instances

    def get_instance(*args, **kwargs):
        """Get the singleton instance of the class.
        Args:
            *args: Positional arguments to pass to the class constructor
            **kwargs: Keyword arguments to pass to the class constructor
        Returns:
            object: The singleton instance of the class.
        """
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]

    def clear_instance():
        """Clear the singleton instance of the class.
        This method removes the instance from the singleton registry,
        effectively allowing the class to be re-instantiated.
        """
        if cls in instances:
            del instances[cls]

    functools.update_wrapper(get_instance, cls)
    setattr(get_instance, "clear_instance", clear_instance)
    return get_instance
