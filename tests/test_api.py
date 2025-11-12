"""
Tests for the Public Domain Hunter API endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app
from app.auth import get_current_active_user
from app.models import User


# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


def override_current_user():
    return User(
        id=1,
        email="test@example.com",
        username="testuser",
        hashed_password="test",
        is_active=True,
        is_superuser=False,
    )


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_active_user] = override_current_user


@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


class TestHealth:
    def test_health_check(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy", "service": "Public Domain Hunter API"}

    def test_root_endpoint(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert "docs" in data


class TestWorks:
    def test_get_works_empty(self, client):
        response = client.get("/api/v1/works")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_work(self, client):
        work_data = {
            "title": "Test Work",
            "author": "Test Author",
            "public_domain_year": 1925
        }
        response = client.post("/api/v1/works", json=work_data)
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == work_data["title"]
