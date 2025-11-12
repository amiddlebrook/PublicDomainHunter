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
    version="2.0.0",
    author="amiddlebrook",
    author_email="",
    description="A SaaS platform for monitoring newly released public domain works",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/amiddlebrook/PublicDomainHunter",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Framework :: FastAPI",
    ],
    python_requires=">=3.9",
    install_requires=[
        "fastapi>=0.104.0",
        "uvicorn[standard]>=0.24.0",
        "sqlalchemy>=2.0.0",
        "alembic>=1.12.0",
        "psycopg2-binary>=2.9.0",
        "python-multipart>=0.0.6",
        "python-jose[cryptography]>=3.3.0",
        "passlib[bcrypt]>=1.7.4",
        "python-dotenv>=1.0.0",
        "httpx>=0.25.0",
        "pydantic>=2.0.0",
        "pydantic-settings>=2.0.0",
        "requests>=2.25.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0",
            "pytest-asyncio>=0.21.0",
            "black>=23.0",
            "flake8>=6.0",
            "mypy>=1.0",
        ],
        "postgres": [
            "psycopg2-binary>=2.9.0",
        ],
        "sqlite": [
            # SQLite is included by default with Python
        ],
    },
    entry_points={
        "console_scripts": [
            "pdh-api=app.main:main",
        ],
    },
)
