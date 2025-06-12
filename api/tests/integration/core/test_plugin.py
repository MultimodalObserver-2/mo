import json
import os
import zipfile

import pytest
from anyio import Path
from fastapi import status
from httpx import ASGITransport, AsyncClient

from mo.core.api.services.plugin_service import PluginService
from mo.core.config.constants import RELATIVE_PLUGINS_DIR_PATH
from mo.core.file_management.file_management import FileManagement
from mo.core.plugin.dir_observer import PluginsDirHandler
from mo.core.plugin.manager import PluginManager
from mo.main import app


@pytest.fixture
async def test_plugin_source_path() -> Path:
    base_path = Path(__file__).parent.parent.parent
    path = base_path / "fixtures" / "core" / "valid_plugin"
    assert os.path.exists(path), f"Test plugin path {path} does not exist"
    return path


@pytest.fixture
async def temp_service(tmp_path: Path):
    PluginManager.clear_instance()  # type: ignore
    PluginsDirHandler.clear_instance()  # type: ignore
    plugins_dir_in_temp = tmp_path / RELATIVE_PLUGINS_DIR_PATH
    os.makedirs(plugins_dir_in_temp, exist_ok=True)

    file_management = FileManagement(
        rel_path=RELATIVE_PLUGINS_DIR_PATH, base_path=str(tmp_path), make_dirs=True
    )
    plugin_manager = PluginManager()
    plugin_manager.plugins_path = str(plugins_dir_in_temp)
    plugins_dir_handler = PluginsDirHandler()
    plugins_dir_handler.plugin_manager = plugin_manager
    plugins_dir_handler.plugins_path = plugin_manager.plugins_path

    service = PluginService()
    service.plugin_manager = plugin_manager
    service.plugins_dir_handler = plugins_dir_handler
    service.plugins_dir = RELATIVE_PLUGINS_DIR_PATH
    service.file_management = file_management

    yield service, plugins_dir_in_temp

    # Cleanup after tests
    for process in plugin_manager.plugin_processes.values():
        if process.is_alive():
            process.terminate()
            process.join()


def load_test_metadata(plugin_path: Path) -> dict:
    metadata_file = plugin_path / "metadata.json"
    with open(metadata_file, "r") as f:
        return json.load(f)


async def create_zip_from_dir(zip_path: Path, source_dir: Path):
    with zipfile.ZipFile(zip_path, "w") as zf:
        async for file in source_dir.rglob("*"):
            zf.write(file, file.relative_to(source_dir))


@pytest.mark.asyncio
async def test_add_plugin_success(temp_service, test_plugin_source_path):
    plugin_service, tmp_path = temp_service
    app.dependency_overrides[PluginService] = lambda: plugin_service

    # Load metadata to get the final ID and other details
    metadata = load_test_metadata(test_plugin_source_path)
    final_id = f"{metadata['publisher']['id']}.{metadata['id']}"

    # Create a zip file from the plugin source directory
    # The zip file will be uploaded to the server
    upload_dir_name = "plugin_to_upload"
    zip_to_upload = tmp_path / f"{upload_dir_name}.zip"
    await create_zip_from_dir(zip_to_upload, test_plugin_source_path)

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        with open(zip_to_upload, "rb") as f:
            files = {"file": (zip_to_upload.name, f, "application/zip")}
            # Send the zip file to the server
            response = await client.post("/plugins/", files=files)

    # Check the response status and content
    assert response.status_code == status.HTTP_201_CREATED
    response_data = response.json()
    assert response_data["id"] == final_id
    assert response_data["name"] == metadata["name"]
    assert response_data["version"] == metadata["version"]
    assert response_data["publisher"]["name"] == metadata["publisher"]["name"]

    # Check if the plugin directory was created
    expected_plugin_dir = tmp_path / upload_dir_name
    assert os.path.exists(expected_plugin_dir), "Expected plugin directory does not exist"
    assert os.path.isdir(expected_plugin_dir), "Expected plugin directory is not a directory"

    # Check if the metadata file exists in the plugin directory
    metadata_in_place = expected_plugin_dir / "metadata.json"
    assert os.path.exists(metadata_in_place), "Metadata file does not exist in the plugin directory"

    app.dependency_overrides = {}


@pytest.mark.asyncio
async def test_get_all_plugins(temp_service, test_plugin_source_path):
    plugin_service, tmp_path = temp_service
    app.dependency_overrides[PluginService] = lambda: plugin_service

    # Load metadata to get the final ID and other details
    metadata = load_test_metadata(test_plugin_source_path)
    final_id = f"{metadata['publisher']['id']}.{metadata['id']}"

    # Create a zip file from the plugin source directory
    upload_dir_name = "plugin_to_upload"
    zip_to_upload = tmp_path / f"{upload_dir_name}.zip"
    await create_zip_from_dir(zip_to_upload, test_plugin_source_path)

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        with open(zip_to_upload, "rb") as f:
            files = {"file": (zip_to_upload.name, f, "application/zip")}
            # Send the zip file to the server
            post_response = await client.post("/plugins/", files=files)
            # And then retrieve the list of plugins
            response = await client.get("/plugins/")

    # Check if the post response is successful
    assert post_response.status_code == status.HTTP_201_CREATED

    # Check the response status and content for the list of plugins
    assert response.status_code == status.HTTP_200_OK
    plugins_list = response.json()

    assert len(plugins_list) > 0, "No plugins found"

    # Check if our plugin is in the list
    found_plugin = next((p for p in plugins_list if p["id"] == final_id), None)

    assert found_plugin is not None, "Expected plugin not found in the list"

    assert found_plugin["name"] == metadata["name"]
    assert found_plugin["version"] == metadata["version"]
    assert found_plugin["publisher"]["name"] == metadata["publisher"]["name"]

    app.dependency_overrides = {}


@pytest.mark.asyncio
async def test_get_plugin(temp_service, test_plugin_source_path):
    plugin_service, tmp_path = temp_service
    app.dependency_overrides[PluginService] = lambda: plugin_service

    # Load metadata to get the final ID and other details
    metadata = load_test_metadata(test_plugin_source_path)
    final_id = f"{metadata['publisher']['id']}.{metadata['id']}"

    # Create a zip file from the plugin source directory
    upload_dir_name = "plugin_to_upload"
    zip_to_upload = tmp_path / f"{upload_dir_name}.zip"
    await create_zip_from_dir(zip_to_upload, test_plugin_source_path)

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        with open(zip_to_upload, "rb") as f:
            files = {"file": (zip_to_upload.name, f, "application/zip")}
            # Send the zip file to the server
            post_response = await client.post("/plugins/", files=files)
            # And then retrieve the specific plugin by ID
            response = await client.get(f"/plugins/{final_id}")

    # Check if the post response is successful
    assert post_response.status_code == status.HTTP_201_CREATED

    # Check the response status and content for the specific plugin
    assert response.status_code == status.HTTP_200_OK
    plugin_data = response.json()

    assert plugin_data["id"] == final_id
    assert plugin_data["name"] == metadata["name"]
    assert plugin_data["version"] == metadata["version"]
    assert plugin_data["publisher"]["name"] == metadata["publisher"]["name"]

    app.dependency_overrides = {}


@pytest.mark.asyncio
async def test_delete_plugin(temp_service, test_plugin_source_path):
    plugin_service, tmp_path = temp_service
    app.dependency_overrides[PluginService] = lambda: plugin_service

    # Load metadata to get the final ID and other details
    metadata = load_test_metadata(test_plugin_source_path)
    final_id = f"{metadata['publisher']['id']}.{metadata['id']}"

    # Create a zip file from the plugin source directory
    upload_dir_name = "plugin_to_upload"
    zip_to_upload = tmp_path / f"{upload_dir_name}.zip"
    await create_zip_from_dir(zip_to_upload, test_plugin_source_path)

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        with open(zip_to_upload, "rb") as f:
            files = {"file": (zip_to_upload.name, f, "application/zip")}
            # Send the zip file to the server
            post_response = await client.post("/plugins/", files=files)
            # And then delete the specific plugin by ID
            delete_response = await client.delete(f"/plugins/{final_id}")

    # Check if the post response is successful
    assert post_response.status_code == status.HTTP_201_CREATED

    # Check the delete response status
    assert delete_response.status_code == status.HTTP_204_NO_CONTENT

    # Verify that the plugin directory has been removed
    expected_plugin_dir = tmp_path / upload_dir_name
    assert not os.path.exists(
        expected_plugin_dir
    ), "Expected plugin directory still exists after deletion"

    app.dependency_overrides = {}


@pytest.mark.asyncio
async def test_get_plugin_properties(temp_service, test_plugin_source_path):
    plugin_service, tmp_path = temp_service
    app.dependency_overrides[PluginService] = lambda: plugin_service

    # Load metadata to get the final ID and other details
    metadata = load_test_metadata(test_plugin_source_path)
    final_id = f"{metadata['publisher']['id']}.{metadata['id']}"

    # Create a zip file from the plugin source directory
    upload_dir_name = "plugin_to_upload"
    zip_to_upload = tmp_path / f"{upload_dir_name}.zip"
    await create_zip_from_dir(zip_to_upload, test_plugin_source_path)

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        with open(zip_to_upload, "rb") as f:
            files = {"file": (zip_to_upload.name, f, "application/zip")}
            # Send the zip file to the server
            post_response = await client.post("/plugins/", files=files)
            # And then retrieve the specific plugin properties by ID
            response = await client.get(f"/plugins/{final_id}/settings/properties")

    # Check if the post response is successful
    assert post_response.status_code == status.HTTP_201_CREATED

    # Check the response status and content for the specific plugin properties
    assert response.status_code == status.HTTP_200_OK
    properties_data = response.json()

    assert isinstance(properties_data, list), "Expected properties data to be a list"
    assert len(properties_data) > 0, "No properties found for the plugin"

    expected_properties_keys = [
        "text_property",
        "number_property",
        "boolean_property",
        "select_property",
        "float_property",
    ]

    for prop in properties_data:
        assert prop["key"] in expected_properties_keys, f"Unexpected property key: {prop['key']}"
        assert "label" in prop, "Property label is missing"
        assert "property_type" in prop, "Property type is missing"

    app.dependency_overrides = {}
