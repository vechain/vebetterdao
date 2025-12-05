# Frontend Environment-Level Infrastructure

Terraform configuration that deploys the B3TR governance frontend to AWS App Runner.

## Architecture Overview

- **Runtime**: AWS App Runner (one service per environment)
- **Images**: Pulled from the shared ECR repository created by `frontend-account-level`
- **State**: Stored in S3 buckets per AWS account (dev/prod) with workspaces for each environment
- **Custom Domains**: App Runner-managed certificates. DNS records/validation are handled by a separate Terraform stack, so this module exposes the validation records as outputs instead of creating Route53 entries by default.

## Environments & Workspaces

| Workspace | AWS Account | Domain | Notes |
|-----------|-------------|--------|-------|
| `prod`    | `b3tr-prod` (`851725442887`) | `governance.vebetterdao.org` | Production |
| `beta`    | `b3tr-prod` (`851725442887`) | `beta.governance.vebetterdao.org` | Public beta |
| `test`    | `b3tr-dev` (`211125319139`) | `dev.testnet.governance.vebetterdao.org` | Shared non-prod |
| `preview` | `b3tr-dev` (`211125319139`) | `pr-{PR}.dev.testnet.governance.vebetterdao.org` | Template used to spin up ephemeral PR previews (`preview-pr-{id}` workspaces) |

Each workspace has:
- `backend.config` under `terraform/frontend/environments/env/<workspace>/`
- `<workspace>.yaml` describing App Runner parameters (CPU/memory, domain, env vars, state bucket references)

### Example Production Config (`terraform/frontend/environments/env/prod/prod.yaml`)

```yaml
project_name: b3tr-frontend
environment: prod
domain: governance.vebetterdao.org
image_tag: latest
cpu: 1024
memory: 2048
min_size: 1
max_size: 4
account_level_state_bucket: b3tr-terraform-state-prod
account_level_state_key: frontend/account-level/prod/terraform.tfstate
```

### Preview Template (`terraform/frontend/environments/env/preview/preview.yaml.example`)

The CI pipeline copies this file, replaces `{PR_NUMBER}` / `{COMMIT_SHA}`, and writes it to
`terraform/frontend/environments/env/preview-pr-XXX/`.

```yaml
domain: pr-{PR_NUMBER}.dev.testnet.governance.vebetterdao.org
image_tag: pr-{PR_NUMBER}-{COMMIT_SHA}
min_size: 1
max_size: 1
```

## Manual Deployment

```bash
cd terraform/frontend/frontend-env-level
terraform init -backend-config=../environments/env/prod/backend.config
terraform workspace select prod || terraform workspace new prod
terraform apply
```

For previews replace `prod` with `preview-pr-123`, copy the template config, then apply/destroy as needed.

## Outputs

| Output | Description |
|--------|-------------|
| `service_url` | Default AWS-managed endpoint |
| `custom_domain_url` | Desired vanity domain (if enabled) |
| `custom_domain_status` | Status returned by App Runner |
| `custom_domain_validation_records` | CNAMEs that the DNS stack must create for validation |

## DNS Responsibilities

- This module **does not** create Route53 records by default (`manage_dns_records: false`).
- Another Terraform project should read the `custom_domain_validation_records` output and set up the necessary CNAMEs/aliases in the corresponding hosted zones.
- If you want this module to manage DNS later, set `manage_dns_records: true` and provide either `route53_zone_id` or `route53_zone_name` in the environment YAML.

## Required Prerequisites

1. Run `frontend-account-level` in both AWS accounts (workspace `dev` and `prod`)
2. Push Docker images to the shared ECR repository (`governance-frontend`)
3. Ensure Route53 hosted zones + ACM certificates already exist (handled elsewhere)

## Helpful Tips

- App Runner requires `min_size >= 1`; set `max_size` conservatively for previews to control costs.
- Use the default service URL while waiting for DNS validation (5–10 minutes after the first deploy).
- When rolling back, update the `image_tag` in the appropriate YAML or allow the CI workflow to overwrite it.
