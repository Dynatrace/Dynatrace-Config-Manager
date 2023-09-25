import platform

OS = platform.system().lower()

IS_WINDOWS = OS == "windows"

EXEC_EXTENSION = ""
if IS_WINDOWS:
    EXEC_EXTENSION = ".exe"
