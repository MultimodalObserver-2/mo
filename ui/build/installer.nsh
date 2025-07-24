!include "MUI2.nsh"
!include "nsDialogs.nsh"
!include "LogicLib.nsh"

!include "plugins.nsh"

Var UserLocalAppData

!ifdef PLUGINS_COUNT
!if ${PLUGINS_COUNT} > 0
  Function PluginSelectPageCreate
    !insertmacro MUI_HEADER_TEXT "Seleccionar plugins" "Elige los plugins que deseas instalar:"
    nsDialogs::Create 1018
    Pop $0

    !insertmacro CREATE_PLUGIN_CHECKBOXES

    nsDialogs::Show
  FunctionEnd

  Function PluginSelectPageLeave
    !insertmacro GET_CHECKBOX_STATES
  FunctionEnd

  PageEx custom
    PageCallbacks PluginSelectPageCreate PluginSelectPageLeave
  PageExEnd
!endif
!endif


!macro preInit
  StrCpy $UserLocalAppData $LOCALAPPDATA
!macroend

!macro customInstall
  !if ${PLUGINS_COUNT} > 0
    !insertmacro PERFORM_PLUGIN_INSTALL
  !endif

  RMDir /r "$INSTDIR\resources\plugins"
!macroend

!macro customUnInstall
  ${ifNot} ${isUpdated}
    SetShellVarContext current
    RMDir /r "$LOCALAPPDATA\multimodal-observer"
  ${endIf}
!macroend
