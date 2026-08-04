# AgriScan AI (Krishi Swasthya Sahayak) - OpenAPI 3.1 Contracts

This directory houses the source-of-truth OpenAPI specifications for the microservices architecture. In accordance with the **Contract-First API Philosophy**, all client and server code generation must strictly originate from these definitions.

---

## 📑 Service Specifications

| Service | Spec File | Port (Dev) | Key Responsibilities |
| :--- | :--- | :--- | :--- |
| **Auth & Consent Service** | [`auth-service.yaml`](file:///Users/vikas/Documents/Krishi%20Seva/contracts/openapi/auth-service.yaml) | `:8081` | Mobile + OTP login, DPDP Act 2023 consent capture, token refresh & revocation. |
| **Profile & Farm Service** | [`profile-farm-service.yaml`](file:///Users/vikas/Documents/Krishi%20Seva/contracts/openapi/profile-farm-service.yaml) | `:8082` | Farmer profiles, geo-referenced land parcels, soil test cards, crop cycles, clinic-farmer registry. |
| **Diagnosis & Advisory Service** | [`diagnosis-service.yaml`](file:///Users/vikas/Documents/Krishi%20Seva/contracts/openapi/diagnosis-service.yaml) | `:8083` | Tiered ML inference, adaptive follow-ups (55-84%), agronomist SLA escalation (<55%), nutrition-first & CIB&RC checks. |

---

## 🛡️ Architectural Guardrails Enforced in Contracts

1. **Zero Password Authentication**: All user onboarding and session generation operates purely via OTP validation.
2. **DPDP Act 2023 Compliance**: Purpose-bound consent items (`AGRONOMIC_DIAGNOSIS_AND_ADVISORY`, `HYPERLOCAL_WEATHER_INTEGRATION`, `SOIL_HEALTH_ANALYTICS`, etc.) are captured with audit signatures.
3. **Nutrition-First Decision Tree**: Step 1 (Mineral/foliar correction) and Step 2 (Biologicals) are prioritized before evaluating Step 3 (Chemicals).
4. **CIB&RC Regulatory Validation**: Chemical recommendations include verified registration numbers and dynamic state-level ban checks.
5. **Multi-language Support**: Top 20 Indian languages supported via standard `Accept-Language` headers and localized response models.
