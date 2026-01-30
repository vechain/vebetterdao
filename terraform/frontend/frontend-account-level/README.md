# Account-Level Infrastructure

Shared infrastructure for the `b3tr` frontend that persists across all environments and AWS accounts.

## Resources

### Amazon ECR

- Stores Docker images for every environment (prod, beta, test, preview)
- Lifecycle rules keep the last 30 production, 20 beta/test, 10 preview images and purge untagged images after 24h

### IAM Roles

- **Instance role**: assigned to App Runner services for runtime access (logs, future AWS integrations)
- **Access role**: allows App Runner to pull images from the shared ECR repository

## Workspaces & State

This project uses two Terraform workspaces:

| Workspace | AWS Account                     | State Bucket                   | Backend config                                    |
| --------- | ------------------------------- | ------------------------------ | ------------------------------------------------- |
| `testnet` | `211125319139` (`b3tr-testnet`) | `b3tr-terraform-state-testnet` | `../environments/account/testnet/backend.config`  |
| `prod`    | `851725442887` (`b3tr-prod`)    | `b3tr-terraform-state-prod`    | `../environments/account/prod/backend.config`     |

Initialise by selecting the desired workspace:

```bash
cd terraform/frontend/frontend-account-level
terraform init -backend-config=../environments/account/dev/backend.config
terraform workspace select dev || terraform workspace new dev
terraform apply
```

Repeat with the `prod` backend config when targeting the production account.

## Outputs Consumed by Environment-Level Stacks

| Output                                | Description                                       |
| ------------------------------------- | ------------------------------------------------- |
| `ecr_repository_name` / `url` / `arn` | Shared container registry                         |
| `app_runner_instance_role_arn`        | Execution role for App Runner services            |
| `app_runner_access_role_arn`          | Role that lets App Runner pull from ECR           |
| `environment_metadata`                | Useful context (account ID, region, project slug) |

## Notes

- DNS zones and ACM certificates are managed by a separate Terraform project; this stack does not create them.
- Only generic, reusable infrastructure lives here. Environment-specific resources (App Runner services, custom domains, etc.) are defined in `frontend-env-level`.
