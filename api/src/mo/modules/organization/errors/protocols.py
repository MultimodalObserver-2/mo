from mo.core.utils.i18n import translate


def PROTOCOL_ALREADY_EXISTS(protocol_name: str, project_name: str):
    return translate("protocol.alreadyExists", protocol_name=protocol_name, project_name=project_name)


def PROTOCOL_DOES_NOT_EXIST(protocol_name: str, project_name: str):
    return translate("protocol.doesNotExist", protocol_name=protocol_name, project_name=project_name)


def PROTOCOL_IS_LOCKED(protocol_name: str, project_name: str):
    return translate("protocol.isLocked", protocol_name=protocol_name, project_name=project_name)


def ACTIVITY_INVALID_FILE_PATH(activity_name: str, protocol_name: str):
    return translate("organization.activity.invalidFilePath", activity_name=activity_name, protocol_name=protocol_name)


def ACTIVITY_INVALID_TIME_LIMIT(activity_name: str, protocol_name: str):
    return translate("organization.activity.invalidTimeLimit", activity_name=activity_name, protocol_name=protocol_name)


def ACTIVITY_PROCESS_NAME_REQUIRED(activity_name: str, protocol_name: str):
    return translate("organization.activity.processNameRequired", activity_name=activity_name, protocol_name=protocol_name)


def INVALID_EXECUTION_REQUEST(activity_name: str):
    return translate("organization.activity.invalidExecutionRequest", activity_name=activity_name)
