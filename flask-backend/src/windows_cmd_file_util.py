def write_lines_to_file(path, lines):
    lines = add_line_changes(lines)

    with open(path, "w", encoding='UTF-8') as f:
        f.writelines(lines)


def add_line_changes(lines):
    lines_modified = []

    for line in lines:
        lines_modified.append(line + "\n")

    return lines_modified
