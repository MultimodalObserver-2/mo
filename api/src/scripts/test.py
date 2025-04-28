import argparse
import os
import subprocess
import sys

MODULES_PATH = "src/api/modules"


def get_modules_services():
    module_service_paths = []
    for root, dirs, files in os.walk(MODULES_PATH):
        if "services" in dirs:
            path_norm = os.path.normpath(root)
            cov_path = path_norm.replace("\\", ".").replace("src.", "") + ".services"
            module_service_paths.append(f"--cov={cov_path}")
    return module_service_paths


def get_args():
    parser = argparse.ArgumentParser(
        description="Run unit, integration, or all tests with optional pytest arguments.",
        usage="poetry run test [--help] [--help-pytest] [--type {unit,integration,all}] [PYTEST_ARGS...]",
    )

    parser.add_argument(
        "--type",
        choices=["unit", "integration", "all"],
        default="all",
        help="Specify the type of tests to run (default: all).",
    )

    if "--help-pytest" in sys.argv:
        subprocess.run(["pytest", "--help"])
        sys.exit(0)

    return parser.parse_known_args()


def run_tests():
    args, extra_args = get_args()

    print("Running Tests...")

    test_filter = ""
    if args.type == "unit":
        test_filter = "unit"
    elif args.type == "integration":
        test_filter = "integration"

    core_path = ["--cov=api.core"]
    module_service_paths = get_modules_services()

    test_cmd = ["pytest"] + core_path + module_service_paths + [f"tests/{test_filter}"] + extra_args

    try:
        subprocess.run(test_cmd, check=True)
    except subprocess.CalledProcessError:
        print("\nERROR: pytest execution failed. Correct usage:")
        print(
            "   poetry run test [--help] [--help-pytest] [--type {unit,integration,all}] [--cov-report {html,xml,json}] [PYTEST_ARGS...]"
        )
        sys.exit(1)


if __name__ == "__main__":
    run_tests()
