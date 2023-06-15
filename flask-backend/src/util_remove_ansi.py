import re

# Regular expression pattern to match ANSI escape codes
ansi_escape_pattern = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])")


def remove_ansi_colors(
    run_info=None,
    log_file_path="",
    do_write_output=False,
    output_file_path="",
    log_content="",
):
    if log_content == "" and log_file_path != "":
        with open(log_file_path, "rb") as log_file:
            log_content = log_file.read().decode()
            if run_info != None:
                run_info["return_status"] = 200

    # Remove ANSI escape codes from the log content
    log_content_cleaned = ansi_escape_pattern.sub("", log_content)

    if do_write_output and output_file_path != "":
        with open(output_file_path, "wb") as output_file:
            output_file.write(log_content_cleaned.encode())

    return log_content, log_content_cleaned
