# SEC-02 Railway Deployment Notes

**Date prepared**: 2026-03-31
**Risk**: HIGH — wrong deployment order causes live JWT verification failures

## Why order matters

After this plan's `application.properties` changes are deployed, services will read the JWT
public key from the `MP_JWT_VERIFY_PUBLICKEY` environment variable. If that env var is not set
in Railway when the service starts, SmallRye JWT will fail to initialize and ALL authenticated
requests will return 401 or 500.

Similarly, identity-service reads `SMALLRYE_JWT_SIGN_KEY` to sign tokens. If not set, login
returns 500.

## Safe rollout sequence

1. **Generate key pair locally** (done in Task 1 of plan 02-02)

2. **Set Railway env vars BEFORE deploying any service**

   For `identity-service` in Railway dashboard (or via `railway variables set`):
   - `SMALLRYE_JWT_SIGN_KEY` = full content of `privateKey.pem` (multi-line PEM)
   - `MP_JWT_VERIFY_PUBLICKEY` = full content of `publicKey.pem` (multi-line PEM)

   For `catalog-service`, `sales-service`, `operations-service` in Railway:
   - `MP_JWT_VERIFY_PUBLICKEY` = same public key as above (identical value)

3. **Verify env vars are set in Railway before proceeding**

   Railway CLI check:
   ```bash
   railway variables --service identity-service | grep JWT
   railway variables --service catalog-service | grep JWT
   railway variables --service sales-service | grep JWT
   railway variables --service operations-service | grep JWT
   ```
   Each must show `SMALLRYE_JWT_SIGN_KEY` (identity only) and `MP_JWT_VERIFY_PUBLICKEY`.

4. **Deploy all 4 services in the same Railway release** (trigger redeploy simultaneously)

   Do NOT stagger. A brief window where identity-service has new keys but catalog-service
   still has old keys (or no env var) will cause token verification failures for active users.

5. **Post-deploy smoke test**

   ```bash
   # Login — should return 200 and Set-Cookie: jwt=...
   curl -X POST https://<identity-service-url>/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"<test-user>","password":"<test-password>"}'

   # Use the returned JWT cookie to call a protected endpoint
   curl https://<catalog-service-url>/catalog/services \
     -H "Cookie: jwt=<token>"
   ```

## Rollback plan

If deployment fails:
1. Revert `application.properties` changes in all 4 services (re-add `.location` variants)
2. Ensure `publicKey.pem` is present in the Docker build context for each service
3. Deploy again

The old PEM-file approach is safe to roll back to because the files were never committed
and the new key pair is local-only until Railway env vars are confirmed.
