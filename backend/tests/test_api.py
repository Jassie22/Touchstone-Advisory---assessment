import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app import models
from app.database import get_db


@pytest.fixture
def client(db_session: Session):
    """Create a test client with database override."""
    def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


class TestCalculateEndpoint:
    """Test the POST /api/calculate endpoint."""

    def test_calculate_success(self, client: TestClient):
        """Test successful calculation."""
        payload = {
            "s0": 100.0,
            "x": 100.0,
            "t": 1.0,
            "r": 0.05,
            "d": 0.02,
            "v": 0.2,
        }
        response = client.post("/api/calculate", json=payload)
        
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert "call_price" in data
        assert "put_price" in data
        assert "d1" in data
        assert "d2" in data
        assert "created_at" in data
        assert data["s0"] == 100.0
        assert data["call_price"] > 0
        assert data["put_price"] > 0

    def test_calculate_invalid_input_negative_s0(self, client: TestClient):
        """Test calculation with negative stock price."""
        payload = {
            "s0": -100.0,
            "x": 100.0,
            "t": 1.0,
            "r": 0.05,
            "d": 0.02,
            "v": 0.2,
        }
        response = client.post("/api/calculate", json=payload)
        
        assert response.status_code == 422  # FastAPI returns 422 for Pydantic validation errors
        assert "detail" in response.json()

    def test_calculate_invalid_input_zero_volatility(self, client: TestClient):
        """Test calculation with zero volatility."""
        payload = {
            "s0": 100.0,
            "x": 100.0,
            "t": 1.0,
            "r": 0.05,
            "d": 0.02,
            "v": 0.0,
        }
        response = client.post("/api/calculate", json=payload)
        
        assert response.status_code == 422  # FastAPI returns 422 for Pydantic validation errors

    def test_calculate_persists_to_database(self, client: TestClient, db_session: Session):
        """Test that calculation is saved to database."""
        payload = {
            "s0": 110.0,
            "x": 100.0,
            "t": 0.5,
            "r": 0.03,
            "d": 0.01,
            "v": 0.25,
        }
        response = client.post("/api/calculate", json=payload)
        
        assert response.status_code == 201
        calc_id = response.json()["id"]
        
        # Verify it's in the database
        calc = db_session.query(models.Calculation).filter(models.Calculation.id == calc_id).first()
        assert calc is not None
        assert calc.s0 == 110.0
        assert calc.call_price > 0


class TestHistoryEndpoint:
    """Test the GET /api/history endpoint."""

    def test_history_empty(self, client: TestClient):
        """Test history endpoint with no calculations."""
        response = client.get("/api/history")
        
        assert response.status_code == 200
        assert response.json() == []

    def test_history_with_calculations(self, client: TestClient):
        """Test history endpoint with existing calculations."""
        # Create some calculations
        payload1 = {
            "s0": 100.0, "x": 100.0, "t": 1.0,
            "r": 0.05, "d": 0.02, "v": 0.2,
        }
        payload2 = {
            "s0": 120.0, "x": 100.0, "t": 1.0,
            "r": 0.05, "d": 0.02, "v": 0.2,
        }
        
        client.post("/api/calculate", json=payload1)
        client.post("/api/calculate", json=payload2)
        
        response = client.get("/api/history")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all("id" in item for item in data)
        assert all("call_price" in item for item in data)
        assert all("put_price" in item for item in data)
        assert all("created_at" in item for item in data)

    def test_history_ordered_by_date(self, client: TestClient):
        """Test that history is ordered by creation date (newest first)."""
        import time
        
        payload = {
            "s0": 100.0, "x": 100.0, "t": 1.0,
            "r": 0.05, "d": 0.02, "v": 0.2,
        }
        
        client.post("/api/calculate", json=payload)
        time.sleep(0.1)
        client.post("/api/calculate", json=payload)
        
        response = client.get("/api/history")
        data = response.json()
        
        # Most recent should be first
        assert len(data) >= 2
        assert data[0]["created_at"] >= data[1]["created_at"]


class TestGetCalculationById:
    """Test the GET /api/history/{id} endpoint."""

    def test_get_existing_calculation(self, client: TestClient):
        """Test retrieving a calculation by ID."""
        payload = {
            "s0": 100.0, "x": 100.0, "t": 1.0,
            "r": 0.05, "d": 0.02, "v": 0.2,
        }
        create_response = client.post("/api/calculate", json=payload)
        calc_id = create_response.json()["id"]
        
        response = client.get(f"/api/history/{calc_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == calc_id
        assert data["s0"] == 100.0
        assert "d1" in data
        assert "d2" in data

    def test_get_nonexistent_calculation(self, client: TestClient):
        """Test retrieving a non-existent calculation."""
        response = client.get("/api/history/99999")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
