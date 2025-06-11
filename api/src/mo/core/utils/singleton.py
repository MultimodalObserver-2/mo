import functools


def singleton(cls):
    instances = {}

    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]

    def clear_instance():
        if cls in instances:
            del instances[cls]

    functools.update_wrapper(get_instance, cls)
    setattr(get_instance, "clear_instance", clear_instance)
    return get_instance
