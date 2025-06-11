import subprocess


def run_command(command):
    result = subprocess.run(command, shell=True, check=True, text=True)
    print(result)


def format_code():
    print("Running code formatters...")
    print("Running black...")
    run_command("poetry run black src tests")
    print("Finished running black.")

    print("\nRunning isort...")
    run_command("poetry run isort src tests")
    print("Finished running isort.")
