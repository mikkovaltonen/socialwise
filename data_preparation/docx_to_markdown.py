#!/usr/bin/env python3
"""
Convert Word documents (.docx) to Markdown format.
"""

import os
import sys
from pathlib import Path

try:
    import mammoth
except ImportError:
    print("Installing required package: mammoth")
    os.system(f"{sys.executable} -m pip install mammoth --quiet")
    import mammoth


def docx_to_markdown(docx_path: str) -> str:
    """
    Convert a .docx file to markdown format.

    Args:
        docx_path: Path to the .docx file

    Returns:
        Markdown content as string
    """
    print(f"Converting: {docx_path}")

    with open(docx_path, "rb") as docx_file:
        result = mammoth.convert_to_markdown(docx_file)

        if result.messages:
            print(f"  Warnings:")
            for message in result.messages:
                print(f"    - {message}")

        return result.value


def convert_all_docx_in_directory(directory: str = "."):
    """
    Find all .docx files in directory and convert them to .md files.

    Args:
        directory: Directory to search for .docx files
    """
    dir_path = Path(directory)
    docx_files = list(dir_path.glob("*.docx"))

    if not docx_files:
        print(f"No .docx files found in {directory}")
        return

    print(f"Found {len(docx_files)} .docx file(s)\n")

    for docx_file in docx_files:
        try:
            # Convert to markdown
            markdown_content = docx_to_markdown(str(docx_file))

            # Create output filename
            md_file = docx_file.with_suffix('.md')

            # Save markdown file
            with open(md_file, 'w', encoding='utf-8') as f:
                f.write(markdown_content)

            print(f"  ✓ Saved: {md_file.name}\n")

        except Exception as e:
            print(f"  ✗ Error converting {docx_file.name}: {e}\n")

    print("Conversion complete!")


if __name__ == "__main__":
    # Get directory from command line or use current directory
    directory = sys.argv[1] if len(sys.argv) > 1 else "."
    convert_all_docx_in_directory(directory)
