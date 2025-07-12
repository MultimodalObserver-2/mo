from mo.core.utils.i18n import translate


def protocol_already_exists(protocol_name: str, project_name: str):
    return translate("protocol.alreadyExists", protocol_name=protocol_name, project_name=project_name)


def protocol_does_not_exist(protocol_name: str, project_name: str):
    return translate("protocol.doesNotExist", protocol_name=protocol_name, project_name=project_name)


def protocol_is_locked(protocol_name: str, project_name: str):
    return translate("protocol.isLocked", protocol_name=protocol_name, project_name=project_name)


def activity_invalid_file_path(activity_name: str, protocol_name: str):
    return translate("organization.activity.invalidFilePath", activity_name=activity_name, protocol_name=protocol_name)


def activity_invalid_time_limit(activity_name: str, protocol_name: str):
    return translate("organization.activity.invalidTimeLimit", activity_name=activity_name, protocol_name=protocol_name)


def activity_process_name_required(activity_name: str, protocol_name: str):
    return translate("organization.activity.processNameRequired", activity_name=activity_name, protocol_name=protocol_name)


def invalid_execution_request(activity_name: str):
    return translate("organization.activity.invalidExecutionRequest", activity_name=activity_name)
