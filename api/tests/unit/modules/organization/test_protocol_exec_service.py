from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from api.core.utils.http_exceptions import BadRequestException
from api.modules.organization.schemas.protocol import Activity, ProtocolExecMsg
from api.modules.organization.services.protocol_exec_service import \
    ProtocolExecService


@pytest.fixture
def activity_example():
    return Activity(
        name="Test Activity",
        order=1,
        path="",
        has_time_limit=False,
        time_limit=0,
        start_message="Start this activity",
        end_message="End this activity",
        close_activity=False,
        process_name="",
        show_timer=False,
    )


@pytest.mark.asyncio
async def test_run_activity_success(activity_example):
    websocket = AsyncMock()
    websocket.receive_text.side_effect = ["start", "completed", "next"]

    service = ProtocolExecService()

    with (
        patch.object(service, "handle_start", wraps=service.handle_start) as mock_start,
        patch.object(
            service, "handle_activity_execution", wraps=service.handle_activity_execution
        ) as mock_exec,
        patch.object(service, "handle_end", wraps=service.handle_end) as mock_end,
    ):

        await service.run_activity(websocket, activity_example, total_activities=1)

        mock_start.assert_called_once()
        mock_exec.assert_called_once()
        mock_end.assert_called_once()
        assert websocket.send_json.await_count == 2


@pytest.mark.asyncio
async def test_handle_start_invalid_input(activity_example):
    websocket = AsyncMock()
    websocket.receive_text.return_value = "invalid"

    service = ProtocolExecService()
    with pytest.raises(BadRequestException) as exc:
        await service.handle_start(websocket, activity_example, total_activities=1)

    assert "Test Activity" in str(exc.value)


@pytest.mark.asyncio
async def test_handle_activity_execution_with_file(activity_example):
    activity_example.path = "fake/path/to/file"
    websocket = AsyncMock()
    websocket.receive_text.return_value = "completed"

    service = ProtocolExecService()

    with patch(
        "api.modules.organization.services.protocol_exec_service.FileManagement.open_file"
    ) as mock_open_file:
        await service.handle_activity_execution(websocket, activity_example)
        mock_open_file.assert_called_once_with(activity_example.path)


@pytest.mark.asyncio
async def test_handle_activity_execution_with_timer(activity_example):
    activity_example.has_time_limit = True
    activity_example.show_timer = True
    activity_example.time_limit = 2
    websocket = AsyncMock()

    service = ProtocolExecService()

    with patch(
        "api.modules.organization.services.protocol_exec_service.asyncio.sleep",
        new_callable=AsyncMock,
    ):
        await service.handle_activity_execution(websocket, activity_example)
        assert websocket.send_json.await_count == 3


@pytest.mark.asyncio
async def test_handle_activity_execution_with_time_limit_and_no_timer():
    websocket = AsyncMock()

    activity = Activity(
        name="TimedActivity",
        order=1,
        path="",
        has_time_limit=True,
        time_limit=1,
        start_message="",
        end_message="",
        close_activity=False,
        process_name="",
        show_timer=False,
    )

    service = ProtocolExecService()

    with patch("asyncio.sleep", new=AsyncMock()) as mock_sleep:
        await service.handle_activity_execution(websocket, activity)
        mock_sleep.assert_awaited_once_with(1)


@pytest.mark.asyncio
async def test_handle_activity_execution_raises_if_not_completed():
    websocket = AsyncMock()
    websocket.receive_text.return_value = "invalid_response"

    activity = Activity(
        name="TestActivity",
        order=1,
        path="",
        has_time_limit=False,
        time_limit=0,
        start_message="",
        end_message="",
        close_activity=False,
        process_name="",
        show_timer=False,
    )

    service = ProtocolExecService()

    with pytest.raises(BadRequestException) as exc:
        await service.handle_activity_execution(websocket, activity)
    assert "TestActivity" in str(exc.value)


@pytest.mark.asyncio
async def test_handle_end_invalid_input(activity_example):
    websocket = AsyncMock()
    websocket.receive_text.return_value = "wrong_input"

    service = ProtocolExecService()

    with pytest.raises(BadRequestException):
        await service.handle_end(websocket, activity_example)


@pytest.mark.asyncio
async def test_handle_end_with_close_process(activity_example):
    activity_example.close_activity = True
    activity_example.process_name = "some_process"
    websocket = AsyncMock()
    websocket.receive_text.return_value = "next"

    service = ProtocolExecService()

    with patch(
        "api.modules.organization.services.protocol_exec_service.FileManagement.close_process"
    ) as mock_close:
        await service.handle_end(websocket, activity_example)
        mock_close.assert_called_once_with("some_process")


@pytest.mark.asyncio
async def test_run_full_protocol():
    websocket = AsyncMock()
    websocket.receive_text.side_effect = ["start", "completed", "next"]

    activity = Activity(
        name="A1",
        order=1,
        path="",
        has_time_limit=False,
        time_limit=0,
        start_message="Start",
        end_message="End",
        close_activity=False,
        process_name="",
        show_timer=False,
    )

    mock_protocol = MagicMock()
    mock_protocol.activities = [activity]

    service = ProtocolExecService()
    with patch.object(service.protocol_service, "get_protocol", return_value=mock_protocol):
        await service.run(websocket, protocol_name="TestProtocol", project_name="TestProject")

    assert websocket.send_json.await_count == 3
    websocket.send_json.assert_any_call(
        ProtocolExecMsg(message="Protocol finished", message_type="finish").model_dump()
    )
