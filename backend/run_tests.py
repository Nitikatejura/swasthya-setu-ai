import sys
import os
import pytest

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    print("Running SwasthyaSetu AI End-to-End Test Suite...")
    exit_code = pytest.main(["-v", "tests/test_end_to_end_flow.py"])
    sys.exit(exit_code)
