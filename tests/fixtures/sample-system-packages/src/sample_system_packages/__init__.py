"""Finds a system library, as a PDF renderer that loads HarfBuzz through ctypes would."""

import ctypes.util

LIBRARY = "harfbuzz-subset"
"""Not on GitHub's ubuntu-24.04 runner image: the self-test installs it (libharfbuzz-subset0)."""


def installed(library: str = LIBRARY) -> bool:
    return ctypes.util.find_library(library) is not None
