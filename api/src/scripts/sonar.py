import os
import subprocess
import sys
from dotenv import load_dotenv

def scan():
    args = sys.argv[1:]
    load_dotenv()
    sonar_token = os.getenv("SONAR_TOKEN")
    sonar_token_cmd = ""
    if (not '-D"sonar.token=' in args) and (not '--token' in args):
        if sonar_token:
            sonar_token_cmd = f'-D"sonar.token={sonar_token}"'
        else:
            print("SONAR_TOKEN not found in .env file")
            return

    scan_cmd = ["pysonar"] + [sonar_token_cmd] + args
    subprocess.run(scan_cmd, shell=True, check=True)

if __name__ == "__main__":
    scan()