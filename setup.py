#!/usr/bin/env python3
"""
Setup script for the job scraper.
This script helps with initial setup and configuration.
"""

import os
import sys
import subprocess
import shutil

def check_python_version():
    """Check if Python version is compatible."""
    if sys.version_info < (3, 7):
        print("Error: Python 3.7 or higher is required")
        sys.exit(1)
    print(f"✓ Python {sys.version_info.major}.{sys.version_info.minor} detected")

def create_virtual_environment():
    """Create virtual environment if it doesn't exist."""
    venv_path = ".venv"
    if not os.path.exists(venv_path):
        print("Creating virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", venv_path], check=True)
        print("✓ Virtual environment created")
    else:
        print("✓ Virtual environment already exists")

def install_dependencies():
    """Install required dependencies."""
    print("Installing dependencies...")
    
    # Get the correct python executable path
    if os.name == 'nt':  # Windows
        python_exe = os.path.join(".venv", "Scripts", "python.exe")
        pip_exe = os.path.join(".venv", "Scripts", "pip.exe")
    else:  # Linux/Mac
        python_exe = os.path.join(".venv", "bin", "python")
        pip_exe = os.path.join(".venv", "bin", "pip")
    
    # Install requirements
    subprocess.run([pip_exe, "install", "-r", "requirements.txt"], check=True)
    print("✓ Dependencies installed")
    
    # Install Playwright browsers
    print("Installing Playwright browsers...")
    subprocess.run([python_exe, "-m", "playwright", "install", "chromium"], check=True)
    print("✓ Playwright browsers installed")

def create_env_file():
    """Create .env file from template if it doesn't exist."""
    env_file = ".env"
    env_example = ".env.example"
    
    if not os.path.exists(env_file) and os.path.exists(env_example):
        shutil.copy(env_example, env_file)
        print("✓ Created .env file from template")
        print("  Please edit .env file with your API configuration")
    elif os.path.exists(env_file):
        print("✓ .env file already exists")
    else:
        print("⚠ No .env.example file found")

def test_installation():
    """Test if installation is working."""
    print("Testing installation...")
    
    # Get the correct python executable path
    if os.name == 'nt':  # Windows
        python_exe = os.path.join(".venv", "Scripts", "python.exe")
    else:  # Linux/Mac
        python_exe = os.path.join(".venv", "bin", "python")
    
    try:
        # Test imports
        result = subprocess.run([
            python_exe, "-c", 
            "import requests, bs4, selenium, playwright; print('All imports successful')"
        ], capture_output=True, text=True, check=True)
        print("✓ All dependencies imported successfully")
        
        # Test parser loading
        result = subprocess.run([
            python_exe, "cli.py", "--list"
        ], capture_output=True, text=True, check=True)
        print("✓ Parser modules loaded successfully")
        
    except subprocess.CalledProcessError as e:
        print(f"✗ Installation test failed: {e}")
        print(f"Error output: {e.stderr}")
        return False
    
    return True

def main():
    """Main setup function."""
    print("Job Scraper Setup")
    print("=" * 50)
    
    try:
        check_python_version()
        create_virtual_environment()
        install_dependencies()
        create_env_file()
        
        if test_installation():
            print("\n" + "=" * 50)
            print("✓ Setup completed successfully!")
            print("\nNext steps:")
            print("1. Edit .env file with your API configuration")
            print("2. Test parsers: python test_parsers.py")
            print("3. Run scraper: python cli.py --once")
            print("4. For continuous scraping: python cli.py")
            
            if os.name == 'nt':  # Windows
                print("\nTo activate virtual environment:")
                print(".venv\\Scripts\\activate")
            else:  # Linux/Mac
                print("\nTo activate virtual environment:")
                print("source .venv/bin/activate")
        else:
            print("\n✗ Setup completed with errors")
            print("Please check the error messages above")
            
    except Exception as e:
        print(f"\n✗ Setup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
