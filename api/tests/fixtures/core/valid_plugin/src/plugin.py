from mo.core.plugin.metadata_loader import load_metadata_json
from mo.core.plugin.models.plugin import Plugin


@load_metadata_json("..")
class MyPlugin(Plugin):
    def load(self):
        print("MyPlugin loaded")

    def unload(self):
        print("MyPlugin unloaded")
