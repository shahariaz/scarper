#!/usr/bin/env python3
"""
Quick start script for the job scraper.
Run this to get started quickly with sensible defaults.
"""

import os
import sys
import subprocess

def main():
    print("🚀 Job Scraper Quick Start")
    print("=" * 40)
    
    # Check if virtual environment exists
    if not os.path.exists(".venv"):
        print("❌ Virtual environment not found")
        print("Please run: python setup.py")
        return
    
    # Get python executable
    if os.name == 'nt':  # Windows
        python_exe = os.path.join(".venv", "Scripts", "python.exe")
    else:  # Linux/Mac
        python_exe = os.path.join(".venv", "bin", "python")
    
    print("Available commands:")
    print("1. Test a single parser")
    print("2. Test all parsers")
    print("3. Run all parsers once")
    print("4. Start continuous scraping")
    print("5. Show parser list")
    print("6. Check status")
    print("0. Exit")
    
    while True:
        try:
            choice = input("\nEnter your choice (0-6): ").strip()
            
            if choice == "0":
                print("Goodbye! 👋")
                break
            elif choice == "1":
                parser = input("Enter parser name (e.g., pathao): ").strip()
                subprocess.run([python_exe, "test_parsers.py", parser])
            elif choice == "2":
                subprocess.run([python_exe, "test_parsers.py"])
            elif choice == "3":
                subprocess.run([python_exe, "cli.py", "--once"])
            elif choice == "4":
                print("Starting continuous scraping (Press Ctrl+C to stop)...")
                subprocess.run([python_exe, "cli.py"])
            elif choice == "5":
                subprocess.run([python_exe, "cli.py", "--list"])
            elif choice == "6":
                subprocess.run([python_exe, "monitor.py"])
            else:
                print("Invalid choice. Please enter 0-6.")
                
        except KeyboardInterrupt:
            print("\n\nStopped by user. Goodbye! 👋")
            break
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    main()
