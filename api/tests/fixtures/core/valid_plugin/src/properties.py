from mo.core.plugin.models.properties import Properties, Property, PropertySelectOption
from mo.core.plugin.models.settings import Settings

properties = Properties()

properties.add_text(
    key="text_property",
    label="Text Property",
    min_length=1,
    max_length=100,
)

properties.add_int(key="number_property", label="Number Property", min=0, max=100, step=1)

properties.add_bool(key="boolean_property", label="Boolean Property")


select_options = [
    PropertySelectOption(label="Option 1", value="opt_1"),
    PropertySelectOption(label="Option 2", value="opt_2"),
    PropertySelectOption(label="Option 3", value="opt_3"),
]

properties.add_select(key="select_property", label="Select Property", options=select_options)

properties.add_float(key="float_property", label="Float Property", min=0.0, max=100.0, step=0.1)

default_text = "Default Text"

properties.set_default(key="text_property", default=default_text)

properties.set_default(key="number_property", default=50)

properties.set_default(key="boolean_property", default=True)

properties.set_default(key="select_property", default="opt_1")


def modify_text_property(properties: Properties, settings: Settings):
    text = settings["text_property"]
    if text == default_text:
        properties.update_select_options(key="select_property", options=select_options)
    else:
        properties.update_select_options(
            key="select_property",
            options=[
                PropertySelectOption(label="Modified Option 1", value="mod_opt_1"),
                PropertySelectOption(label="Modified Option 2", value="mod_opt_2"),
            ],
        )
    return properties._properties


properties.set_modified_callback(key="text_property", callback=modify_text_property)
