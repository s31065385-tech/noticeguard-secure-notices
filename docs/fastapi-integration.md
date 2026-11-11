# NoticeGuard — FastAPI backend contract

Set `VITE_NOTICEGUARD_API_URL=https://your-api.example.com` to switch the frontend from demo mode
to the backend adapter (`src/lib/api/backend.ts`). With it set, results are labelled
"Backend connected" and are no longer marked as simulated.

The backend owns the issuer private key (ideally in a KMS/HSM), stores files, and performs all
verification server-side. JSON uses snake_case. Errors return `{ "detail": "..." }`.

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/api/auth/login` | – | `{ username, password }` | `{ access_token, token_type: "bearer", username }` |
| GET | `/api/notices` | – | – | `Notice[]` |
| POST | `/api/notices` | Bearer | multipart: `title`, `department`, `notice_date` (YYYY-MM-DD), `file` (PDF/PNG/JPG/WEBP, ≤10 MB) | `Notice` |
| GET | `/api/notices/{id}` | – | – | `Notice` or 404 |
| GET | `/api/notices/{id}/file` | – | – | original file bytes with its content type |
| POST | `/api/notices/{id}/verify` | – | multipart: `source` (`registered-file` \| `uploaded-copy` \| `tamper-test`), optional `file` | `VerificationResult` |

`Notice`: `id, title, department, notice_date, file_name, mime_type, file_size, sha256 (hex),
signature (base64), signature_algorithm, key_fingerprint, registered_at, registered_by`.

`VerificationResult`: `notice_id, status ("valid"|"invalid"), signature_valid, hash_match,
registered_hash, computed_hash, algorithm, key_fingerprint, candidate_source, candidate_name, checked_at`.

Verification rule: hash the candidate bytes (the uploaded `file`, or the stored original when
omitted) with SHA-256, compare to the registered hash, and verify the stored signature over the
candidate bytes with the issuer public key. `status` is `valid` only when both checks pass.

QR access (`GET /api/notices/{id}`) must never imply authenticity; it only locates the record.
Enable CORS for the frontend origin.
