import subprocess


def build():
    print("Generating executable...")
    pyinstaller_cmd = ["pyinstaller",
                       "mo_api.build.spec"]
    subprocess.run(pyinstaller_cmd, check=True)
    print("Executable generated in dist folder.")


if __name__ == "__main__":
    build()
