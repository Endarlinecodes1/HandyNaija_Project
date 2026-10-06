"""Authentication and User management test suite."""

from fastapi.testclient import TestClient


def test_customer_registration_and_profile(client: TestClient):
    """Test registering as a customer via unified and dedicated endpoints."""
    # 1. Unified customer registration
    payload = {
        "role": "customer",
        "full_name": "Emeka Okonkwo",
        "email": "emeka.okonkwo@example.com",
        "password": "SecurePassword123!",
        "phone_number": "+2348011223344",
        "address": "Victoria Island, Lagos",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "emeka.okonkwo@example.com"
    assert data["role"] == "customer"
    assert data["customer_profile"]["full_name"] == "Emeka Okonkwo"
    assert data["customer_profile"]["address"] == "Victoria Island, Lagos"

    # 2. Prevent duplicate email registration
    dup_resp = client.post("/api/v1/auth/register", json=payload)
    assert dup_resp.status_code == 400
    assert "already exists" in dup_resp.json()["detail"]


def test_provider_registration(client: TestClient):
    """Test registering as a service provider with artisan details."""
    payload = {
        "role": "provider",
        "full_name": "Kunle Electric",
        "email": "kunle.electric@example.com",
        "password": "SecurePassword123!",
        "phone_number": "+2348099887766",
        "business_name": "Kunle Solar & Electricals",
        "bio": "Certified solar and domestic electrician with 5 years experience.",
        "location": "Lagos, Ikeja",
        "service_area": "Ikeja, Maryland, Ojota",
        "experience_years": 5,
        "starting_price": 7500.0,
        "category_id": 2,
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "kunle.electric@example.com"
    assert data["role"] == "provider"
    assert data["provider_profile"]["business_name"] == "Kunle Solar & Electricals"
    assert data["provider_profile"]["location"] == "Lagos, Ikeja"


def test_jwt_login_flows(client: TestClient):
    """Test both JSON and OAuth2 password form JWT login flows."""
    # 1. Register test user
    client.post(
        "/api/v1/auth/register",
        json={
            "role": "customer",
            "full_name": "Fatima Bello",
            "email": "fatima.bello@example.com",
            "password": "StrongPassword123!",
            "phone_number": "+2348077665544",
            "address": "Abuja, Central Area",
        },
    )

    # 2. JSON login
    json_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "fatima.bello@example.com",
            "password": "StrongPassword123!",
        },
    )
    assert json_login.status_code == 200
    json_data = json_login.json()
    assert "access_token" in json_data
    assert json_data["token_type"] == "bearer"
    assert json_data["role"] == "customer"

    # 3. OAuth2 form-data login
    form_login = client.post(
        "/api/v1/auth/login/access-token",
        data={
            "username": "fatima.bello@example.com",
            "password": "StrongPassword123!",
        },
    )
    assert form_login.status_code == 200
    assert "access_token" in form_login.json()

    # 4. Reject incorrect password
    invalid_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "fatima.bello@example.com",
            "password": "WrongPassword123!",
        },
    )
    assert invalid_login.status_code == 400


def test_authenticated_user_profile_and_update(client: TestClient):
    """Test retrieving and modifying profile details at /users/me."""
    # 1. Register and login
    client.post(
        "/api/v1/auth/register",
        json={
            "role": "customer",
            "full_name": "Dayo Adeleke",
            "email": "dayo.adeleke@example.com",
            "password": "Password123!",
            "phone_number": "+2348123456789",
            "address": "Yaba, Lagos",
        },
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "dayo.adeleke@example.com", "password": "Password123!"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. GET /users/me
    me_resp = client.get("/api/v1/users/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "dayo.adeleke@example.com"

    # 3. PUT /users/me (Update profile)
    update_resp = client.put(
        "/api/v1/users/me",
        json={
            "full_name": "Dayo Adeleke-Johnson",
            "address": "Surulere, Lagos",
        },
        headers=headers,
    )
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["customer_profile"]["full_name"] == "Dayo Adeleke-Johnson"
    assert updated_data["customer_profile"]["address"] == "Surulere, Lagos"

    # 4. Change Password at /users/me/password
    pwd_resp = client.put(
        "/api/v1/users/me/password",
        json={
            "current_password": "Password123!",
            "new_password": "NewSecurePassword456!",
        },
        headers=headers,
    )
    assert pwd_resp.status_code == 200

    # 5. Verify login with new password succeeds
    new_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "dayo.adeleke@example.com",
            "password": "NewSecurePassword456!",
        },
    )
    assert new_login.status_code == 200
