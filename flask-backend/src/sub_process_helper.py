import os_helper


def create_shell_command(cmd_list, cwd):
    if os_helper.IS_WINDOWS:
        return cmd_list, cwd

    cwd_command = f"cd {cwd}"

    commands = f"""{cwd_command}
{" ".join(cmd_list)}"""

    return commands, None
