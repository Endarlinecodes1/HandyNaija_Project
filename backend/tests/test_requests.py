"""Service request workflow, status state transitions, messaging, and review test suite."""

from fastapi.testclient import TestClient


def test_service_request_lifecycle_and_transitions(client: TestClient):
    """Test full service request lifecycle, role-based listing, and strict state transitions."""
    # 1. Register artisan provider
    prov_resp = client.post(
        "/api/v1/auth/register",
        json={
            "role": "provider",
            "full_name": "Tunde Fixer",
            "email": "tunde.fixer@example.com",
            "password": "Password123!",
            "phone_number": "+2347099887766",
            "business_name": "Tunde Plumber Express",
            "location": "Lagos, Ikeja",
            "starting_price": 5000.0,
            "category_id": 1,
        },
    )
    assert prov_resp.status_code == 201

    # Login provider to get ID & auth headers
    prov_login = client.post(
        "/api/v1/auth/login",
        json={"email": "tunde.fixer@example.com", "password": "Password123!"},
    )
    prov_token = prov_login.json()["access_token"]
    prov_headers = {"Authorization": f"Bearer {prov_token}"}
    prov_me = client.get("/api/v1/users/me", headers=prov_headers).json()
    provider_id = prov_me["provider_profile"]["id"]

    # 2. Register customer
    cust_resp = client.post(
        "/api/v1/auth/register",
        json={
            "role": "customer",
            "full_name": "Ngozi Obi",
            "email": "ngozi.obi@example.com",
            "phone_number": "+2348055667788",
            "password": "Password123!",
            "address": "Admiralty Way, Lekki Phase 1, Lagos",
        },
    )
    assert cust_resp.status_code == 201

    # Login customer
    cust_login = client.post(
        "/api/v1/auth/login",
        json={"email": "ngozi.obi@example.com", "password": "Password123!"},
    )
    cust_token = cust_login.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # 3. Customer submits service request
    req_payload = {
        "job_description": "The master bedroom bathroom pipe burst under the sink this morning.",
        "service_location": "Block 4, Admiralty Way, Lekki Phase 1, Lagos",
        "provider_id": provider_id,
        "category_id": 1,
    }
    create_req_resp = client.post("/api/v1/requests", json=req_payload, headers=cust_headers)
    assert create_req_resp.status_code == 201
    req_data = create_req_resp.json()
    req_id = req_data["id"]
    assert req_data["status"] == "Pending"

    # 4. In-app messaging within service request
    msg_resp = client.post(
        f"/api/v1/requests/{req_id}/messages",
        json={"content": "Hello Tunde, please bring replacement PVC pipes."},
        headers=cust_headers,
    )
    assert msg_resp.status_code == 201
    assert msg_resp.json()["content"] == "Hello Tunde, please bring replacement PVC pipes."

    prov_msg_resp = client.post(
        f"/api/v1/requests/{req_id}/messages",
        json={"content": "Noted! I have the required pipes and tools."},
        headers=prov_headers,
    )
    assert prov_msg_resp.status_code == 201

    # Fetch messages thread
    thread_resp = client.get(f"/api/v1/requests/{req_id}/messages", headers=cust_headers)
    assert thread_resp.status_code == 200
    messages = thread_resp.json()
    assert len(messages) == 2

    # 5. Role-based request listing: customer bookings
    cust_list_resp = client.get("/api/v1/requests", headers=cust_headers)
    assert cust_list_resp.status_code == 200
    assert any(r["id"] == req_id for r in cust_list_resp.json())

    # 6. Role-based request listing: provider incoming jobs
    prov_list_resp = client.get("/api/v1/requests", headers=prov_headers)
    assert prov_list_resp.status_code == 200
    assert any(r["id"] == req_id for r in prov_list_resp.json())

    # 7. Status updates lifecycle: Pending -> Accepted
    accept_resp = client.patch(
        f"/api/v1/requests/{req_id}/status",
        json={"status": "Accepted", "notes": "Artisan has accepted the job"},
        headers=prov_headers,
    )
    assert accept_resp.status_code == 200
    assert accept_resp.json()["status"] == "Accepted"

    # 8. Attempt review prematurely before completion (Must be rejected)
    premature_review = client.post(
        "/api/v1/reviews",
        json={
            "request_id": req_id,
            "rating": 5.0,
            "comment": "Too early review",
        },
        headers=cust_headers,
    )
    assert premature_review.status_code == 400

    # 9. Status updates lifecycle: Accepted -> In Progress
    progress_resp = client.patch(
        f"/api/v1/requests/{req_id}/status",
        json={"status": "In Progress"},
        headers=prov_headers,
    )
    assert progress_resp.status_code == 200
    assert progress_resp.json()["status"] == "In Progress"

    # 10. Status updates lifecycle: In Progress -> Completed
    complete_resp = client.patch(
        f"/api/v1/requests/{req_id}/status",
        json={"status": "Completed"},
        headers=prov_headers,
    )
    assert complete_resp.status_code == 200
    assert complete_resp.json()["status"] == "Completed"

    # 11. Illegal transition attempt from terminal Completed state (Must be rejected)
    illegal_trans = client.patch(
        f"/api/v1/requests/{req_id}/status",
        json={"status": "Pending"},
        headers=prov_headers,
    )
    assert illegal_trans.status_code == 400

    # 12. Submit review after completion
    review_resp = client.post(
        "/api/v1/reviews",
        json={
            "request_id": req_id,
            "rating": 5.0,
            "comment": "Excellent plumbing work! Fixed the leak quickly and neatly.",
        },
        headers=cust_headers,
    )
    assert review_resp.status_code == 201
    assert review_resp.json()["rating"] == 5.0

    # 13. Prevent duplicate review submission
    dup_review = client.post(
        "/api/v1/reviews",
        json={
            "request_id": req_id,
            "rating": 4.0,
            "comment": "Duplicate review attempt",
        },
        headers=cust_headers,
    )
    assert dup_review.status_code == 400

    # 14. Verify provider rating average and review count recalculated
    updated_prov_resp = client.get(f"/api/v1/providers/{provider_id}")
    assert updated_prov_resp.status_code == 200
    assert updated_prov_resp.json()["rating_avg"] == 5.0
    assert updated_prov_resp.json()["review_count"] == 1
