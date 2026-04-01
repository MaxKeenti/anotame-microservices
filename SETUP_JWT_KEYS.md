# JWT Key Setup for Railway Deployment

> **This is a required step.** The backend microservices (identity, catalog, sales, operations) will return `500` errors on login and register endpoints until these keys are configured.

## Why JWT Keys Are Required

The **identity service** signs JWT tokens on login/register using an RSA private key (`SMALLRYE_JWT_SIGN_KEY`). Every other service (catalog, sales, operations) verifies incoming requests using the corresponding RSA public key (`MP_JWT_VERIFY_PUBLICKEY`). Without these environment variables set on each service in Railway, all authentication operations will fail with a 500 error.

---

## Step 1 — Generate an RSA Key Pair

Run the following commands locally to generate a 2048-bit RSA key pair:

```bash
# Generate the private key
openssl genrsa -out privateKey.pem 2048

# Extract the public key
openssl rsa -in privateKey.pem -pubout -out publicKey.pem
```

You should now have two files:
- `privateKey.pem` — keep this secret, used only by the identity service
- `publicKey.pem` — shared with all other services for token verification

---

## Step 2 — Configure Railway Environment Variables

For each service, open its **Variables** tab in the Railway dashboard and add the following:

### identity-service (signs AND verifies tokens)

| Variable | Value |
|---|---|
| `SMALLRYE_JWT_SIGN_KEY` | Full contents of `privateKey.pem` |
| `MP_JWT_VERIFY_PUBLICKEY` | Full contents of `publicKey.pem` |

### catalog-service, sales-service, operations-service (verify tokens only)

| Variable | Value |
|---|---|
| `MP_JWT_VERIFY_PUBLICKEY` | Full contents of `publicKey.pem` |

> **Tip:** In Railway, you can paste multi-line PEM values directly into the variable value field. Railway handles multi-line values correctly — no escaping or quoting needed.

---

## Step 3 — Verify the Keys Are Correct

The PEM files should look like this:

**privateKey.pem**
```
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA...
(multiple lines of base64)
...
-----END RSA PRIVATE KEY-----
```

**publicKey.pem**
```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...
(multiple lines of base64)
...
-----END PUBLIC KEY-----
```

---

## Step 4 — Redeploy All Services

After setting the variables, trigger a redeploy for each affected service in Railway. The 500 errors on `/auth/login` and `/auth/register` should resolve once all services are running with the keys in place.

---

## Security Notes

- **Never commit** `privateKey.pem` or `publicKey.pem` to version control. Add them to `.gitignore` if you generated them inside the project directory.
- The private key should only ever be set on the **identity service**. All other services only need the public key.
- Rotate keys periodically and update all services simultaneously to avoid verification failures during the transition.
