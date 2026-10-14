from sample_system_packages import installed


def test_the_system_package_python_ci_installed_is_found() -> None:
    assert installed()


def test_a_library_nobody_installed_is_not_found() -> None:
    assert not installed("no-such-library-for-the-self-test")
