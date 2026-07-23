import importlib
import pkgutil

from fastapi import FastAPI


def load_modules(app: FastAPI) -> None:
    """Discover and register modules found in mo.modules.

    Each sub-package of mo.modules that contains a module.py with a register(app)
    function is automatically loaded. Adding a new module requires no changes to main.py.
    Removing a module requires only deleting its directory.
    """
    import mo.modules as modules_pkg

    for _, name, is_pkg in pkgutil.iter_modules(modules_pkg.__path__):
        if not is_pkg:
            continue
        try:
            mod = importlib.import_module(f"mo.modules.{name}.module")
            if hasattr(mod, "register"):
                mod.register(app)
        except ModuleNotFoundError:
            pass