# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do NOT open a public GitHub issue.**

Instead, email **security@vechain.org** with:

- A description of the vulnerability
- Steps to reproduce
- Affected component(s) (contracts, frontend, lambdas, etc.)
- Severity assessment (if possible)

We will acknowledge your report within 48 hours and aim to provide a fix or mitigation plan within 7 business days.

## Scope

The following are in scope for security reports:

- Smart contracts in `packages/contracts/`
- Frontend application in `apps/frontend/`
- Lambda functions in `packages/lambda/`

The following are out of scope:

- Internal AWS infrastructure and Terraform configurations
- Third-party dependencies (report these to the upstream project)
- The VeChain Thor blockchain itself (report to [VeChain](https://www.vechain.org))

## Supported versions

Security fixes are applied to the latest version on `main`. We do not backport fixes to older releases.

## Recognition

We appreciate responsible disclosure and will credit reporters (with permission) in the release notes.
