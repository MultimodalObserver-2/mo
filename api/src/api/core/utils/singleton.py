def singleton(cls):
    instances = {}

    def get_instance(*args, **kwargs):
        if cls not in instances:
            print(f"Creating new instance of {cls.__name__}")
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]

    return get_instance
