# Security Policy

## Project security posture

ALPHA CREATOR V0.1 is a local/internal application baseline. It is not represented as a hardened, public multi-tenant service.

**Important V0.1 limitation:** authentication and multi-user isolation are not implemented or verified in the documented Gold Master baseline. Do not expose an instance directly to the public internet or use it to process untrusted users' data until appropriate authentication, authorization, network restrictions, operational monitoring and security testing have been implemented and independently validated.

The application includes a server-side frontend proxy and a defined backend/frontend boundary. These controls do not replace authentication, authorization or deployment-level protections.

## Supported release

| Release | Security support |
| --- | --- |
| ALPHA CREATOR V0.1 Gold Master | Best-effort review of reported vulnerabilities; no formal security SLA |

This repository does not currently publish a formal long-term support commitment.

## Reporting a vulnerability

**Please do not disclose exploitable vulnerabilities in public issues, discussions or pull requests.**

Use GitHub's private vulnerability reporting feature for this repository if it is enabled. If private reporting is unavailable, contact the repository maintainers through an established private channel and include:

- A concise description and potential impact.
- The affected version, commit or component.
- Reproduction steps or a proof of concept that does not access third-party data.
- Any relevant logs or artifacts, with secrets and personal data removed.

Do not include live credentials, API keys, session tokens, personal data or production customer data in a report.

The maintainers should acknowledge a report when reasonably possible, assess severity and coordinate remediation and disclosure with the reporter. No fixed response or remediation SLA is currently promised.

## Security requirements for contributors and operators

### Secrets and configuration

- Never commit `.env` files, API keys, access tokens, passwords, signing keys or private certificates.
- Keep real secrets in local environment files excluded from version control or in an appropriate deployment secret manager.
- Treat every `NEXT_PUBLIC_*` variable as browser-visible. Never place secrets in these variables.
- Do not place credentials in source code, fixtures, screenshots, logs, test snapshots or issue reports.
- If a credential is exposed, revoke or rotate it immediately. Removing it from a later commit does not invalidate the exposed credential.
- Use least-privilege credentials and separate development credentials from any production credentials.

### Network exposure and access control

- Bind local development services to loopback unless broader access is explicitly required.
- Do not assume CORS is an authentication or authorization mechanism.
- Do not expose the FastAPI backend or frontend proxy publicly without an independently reviewed access-control and network-security design.
- Restrict database and administrative access to trusted operators and networks.
- Do not enable public access to local SQLite files, database backups, logs or generated content.

### Frontend proxy and backend configuration

- Keep the backend target configured server-side through `ALPHA_BACKEND_URL`.
- Do not expose backend credentials or internal service configuration to browser code.
- Preserve the proxy's method allowlist and backend-target validation.
- Validate and constrain any future proxy routes, redirects, request bodies and upstream responses.
- Keep CORS origins explicit and environment-specific.

### Data handling

- Treat collected RSS content and generated content as untrusted input.
- Avoid rendering untrusted content as executable HTML.
- Do not store personal or sensitive data unless there is a documented need and an appropriate protection model.
- Remove secrets and personal data from diagnostic output before sharing logs.
- Protect database files and backups with filesystem and access controls appropriate to their environment.

### Dependencies and builds

- Use the committed lockfiles and prefer reproducible clean installs.
- Review dependency changes, lifecycle scripts and transitive dependency updates.
- Run the repository's lint, automated tests and production build before proposing a release.
- Do not treat a successful build or dependency installation as a security audit.
- Review changes to the API proxy, database layer, generation provider and configuration handling with particular care.

## Security validation status and known gaps

The documented Gold Master validation is a functional and integration test record, not a penetration test or comprehensive security assessment.

| Security area | Status | Notes |
| --- | --- | --- |
| Secret handling in the documented source checkpoint | **PARTIAL** | The checkpoint documentation states that `.env` and secrets are excluded; this is not proof that every historical revision is secret-free |
| Server-side API proxy boundary | **IMPLEMENTED; SECURITY REVIEW LIMITED** | Method allowlist and backend-target validation are documented |
| Authentication | **NOT IMPLEMENTED / NOT VERIFIED** | Must be added before public exposure |
| Authorization and multi-user isolation | **NOT IMPLEMENTED / NOT VERIFIED** | No tenant boundary is claimed |
| PostgreSQL production hardening | **NOT VERIFIED** | The documented E2E used local SQLite |
| Hosted deployment security | **NOT VERIFIED** | No production deployment security review is claimed |
| SAST / DAST | **NOT RECORDED** | No result is claimed |
| Dependency vulnerability audit | **NOT RECORDED** | No clean audit result is claimed |
| Penetration test | **NOT PERFORMED / NOT RECORDED** | No external assessment is claimed |
| GitHub Actions security/CI status | **NOT VERIFIED** | The repository review did not provide a recorded workflow run |

A PASS in the README's functional test table must not be interpreted as a PASS for any of the security controls above.

## Pre-deployment security checklist

Before deploying beyond a trusted local environment:

- [ ] Implement and test authentication.
- [ ] Define and enforce authorization for every protected API operation.
- [ ] Establish tenant isolation if multiple users or organizations will use the system.
- [ ] Put the application behind an appropriately configured HTTPS ingress and restrict network access.
- [ ] Store secrets in a managed secret store; verify rotation and revocation procedures.
- [ ] Restrict database connectivity and permissions; validate backups and restore access.
- [ ] Review CORS, proxy destinations, redirects, request limits and error handling.
- [ ] Add structured security logging without recording secrets or unnecessary personal data.
- [ ] Run dependency, static-analysis and dynamic-analysis checks and triage their findings.
- [ ] Perform a security review of the deployed configuration and obtain authorization before any penetration test.
- [ ] Document incident response, vulnerability handling and release rollback procedures.

## Scope of authorized testing

Only test systems and environments for which you have explicit authorization. Do not use this project to scan, crawl, probe or otherwise access third-party systems without permission. Use synthetic or explicitly authorized test data when validating security controls.

## Changes to this policy

Security reports and policy updates should be coordinated privately with the repository maintainers. Changes to this file do not by themselves establish that a control has been implemented or tested.
