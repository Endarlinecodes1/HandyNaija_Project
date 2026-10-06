"""Provider search, category browsing, profile and portfolio test suite."""

from fastapi.testclient import TestClient


def test_category_browsing(client: TestClient):
    """Test retrieving list of service categories and single category lookup."""
    # 1. List all active service categories
    list_resp = client.get("/api/v1/categories")
    assert list_resp.status_code == 200
    categories = list_resp.json()
    assert len(categories) >= 1
    assert any(c["slug"] == "plumbing" for c in categories)

    # 2. Get single category by slug
    slug_resp = client.get("/api/v1/categories/plumbing")
    assert slug_resp.status_code == 200
    assert slug_resp.json()["name"] == "Plumbing & Pipe Fitting"

    # 3. Get single category by ID
    cat_id = categories[0]["id"]
    id_resp = client.get(f"/api/v1/categories/{cat_id}")
    assert id_resp.status_code == 200
    assert id_resp.json()["id"] == cat_id


def test_provider_search_and_filtering(client: TestClient):
    """Test searching and filtering providers across category, location, rating, and availability."""
    # 1. Register multiple providers in different locations
    client.post(
        "/api/v1/auth/register",
        json={
            "role": "provider",
            "full_name": "Ikechukwu Obi",
            "email": "ikechukwu.obi@example.com",
            "password": "Password123!",
            "phone_number": "+2348011223399",
            "business_name": "Ike Clean & Fumigation",
            "location": "Lagos, Lekki",
            "service_area": "Lekki Phase 1, Ikoyi",
            "experience_years": 4,
            "starting_price": 6000.0,
            "category_id": 3,
        },
    )

    client.post(
        "/api/v1/auth/register",
        json={
            "role": "provider",
            "full_name": "Musa Danjuma",
            "email": "musa.danjuma@example.com",
            "password": "Password123!",
            "phone_number": "+2348022334455",
            "business_name": "Musa Auto Mechanics",
            "location": "Abuja, Garki",
            "service_area": "Garki, Wuse, Maitama",
            "experience_years": 10,
            "starting_price": 12000.0,
            "category_id": 4,
        },
    )

    # 2. Filter by location
    lekki_resp = client.get("/api/v1/providers/?location=Lekki")
    assert lekki_resp.status_code == 200
    lekki_providers = lekki_resp.json()
    assert len(lekki_providers) >= 1
    assert any("Ike Clean" in p["business_name"] for p in lekki_providers)

    # 3. Filter by category
    mech_resp = client.get("/api/v1/providers/?category_id=4")
    assert mech_resp.status_code == 200
    mech_providers = mech_resp.json()
    assert len(mech_providers) >= 1
    assert any("Musa Auto" in p["business_name"] for p in mech_providers)

    # 4. Search by keyword
    search_resp = client.get("/api/v1/providers/?search=Fumigation")
    assert search_resp.status_code == 200
    search_results = search_resp.json()
    assert len(search_results) >= 1
    assert any("Fumigation" in p["business_name"] for p in search_results)


def test_provider_profile_and_service_management(client: TestClient):
    """Test artisan profile retrieval, adding custom services, and KYC document submission."""
    # 1. Register artisan
    client.post(
        "/api/v1/auth/register",
        json={
            "role": "provider",
            "full_name": "Ahmed Carpenter",
            "email": "ahmed.carpenter@example.com",
            "password": "Password123!",
            "phone_number": "+2347033445566",
            "business_name": "Ahmed Wood Works",
            "location": "Lagos, Surulere",
            "experience_years": 7,
            "starting_price": 8000.0,
            "category_id": 5,
        },
    )

    # 2. Login
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "ahmed.carpenter@example.com", "password": "Password123!"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Fetch current user profile to get provider ID
    me_resp = client.get("/api/v1/users/me", headers=headers)
    provider_id = me_resp.json()["provider_profile"]["id"]

    # 4. View public provider profile
    public_resp = client.get(f"/api/v1/providers/{provider_id}")
    assert public_resp.status_code == 200
    assert public_resp.json()["business_name"] == "Ahmed Wood Works"
    assert public_resp.json()["rating_avg"] == 5.0

    # 5. Add custom service offering
    add_serv_resp = client.post(
        "/api/v1/providers/me/services",
        json={
            "category_id": 5,
            "description": "Kitchen cabinet assembly & customized wardrobe design",
            "price": 25000.0,
        },
        headers=headers,
    )
    assert add_serv_resp.status_code == 201
    service_id = add_serv_resp.json()["id"]

    # Verify service appears in provider profile
    profile_with_services = client.get(f"/api/v1/providers/{provider_id}").json()
    assert any(s["id"] == service_id for s in profile_with_services["services"])

    # 6. Delete service offering
    del_serv_resp = client.delete(f"/api/v1/providers/me/services/{service_id}", headers=headers)
    assert del_serv_resp.status_code == 204

    # 7. Submit KYC verification documents
    verify_resp = client.post(
        "/api/v1/providers/me/verification",
        json={
            "document_type": "NIN",
            "document_url": "https://storage.handynaija.ng/verifications/nin_12345.jpg",
        },
        headers=headers,
    )
    assert verify_resp.status_code == 201
    assert verify_resp.json()["status"] == "Pending"
    assert verify_resp.json()["document_type"] == "NIN"
