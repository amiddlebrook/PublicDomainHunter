"""
Setup configuration for Public Domain Hunter
"""

from setuptools import setup, find_packages
from pathlib import Path

# Read the README file
this_directory = Path(__file__).parent
long_description = (this_directory / "README.md").read_text(encoding="utf-8")

setup(
    name="public-domain-hunter",
    version="1.0.0",
    author="amiddlebrook",
    author_email="",
    description="A sophisticated tool for identifying, cataloging, and managing public domain content",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/amiddlebrook/public-domain-hunter",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
    install_requires=[
        "requests>=2.25.0",
    ],
    extras_require={
        "dev": [
            "pytest>=6.0",
            "black>=22.0",
            "flake8>=4.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "pdhunt=public_domain_hunter.cli:main",
        ],
    },
)
