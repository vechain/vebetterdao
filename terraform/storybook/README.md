# B3TR Storybook Infrastructure

This Terraform project manages the AWS infrastructure for hosting the B3TR Storybook application on CloudFront and S3.

## Architecture

```
                    ┌─────────────────┐
                    │   CloudFront    │
                    │   Distribution  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │    S3 Bucket    │
                    │  (Static Files) │
                    └─────────────────┘
```

## Environment

| Environment | Domain                         | AWS Account                 | Workspace |
| ----------- | ------------------------------ | --------------------------- | --------- |
| dev         | storybook.dev.b3tr.vechain.org | b3tr-testnet (211125319139) | `dev`     |

## Deployment

This infrastructure is deployed manually and is intended to be a "set it and forget it" setup. If changes are needed, they can be applied manually using the steps below.

### Prerequisites

1. **AWS Account**: Ensure you have access to the b3tr-testnet AWS account
2. **S3 State Bucket**: The `b3tr-terraform-state-testnet` bucket must exist in the b3tr-testnet account
3. **Route53 Zone**: The `dev.b3tr.vechain.org` zone must exist

### Manual Deployment

```bash
# Initialize terraform with backend config
terraform init -backend-config="environments/dev/backend.config"

# Select workspace (or create if first time)
terraform workspace select dev || terraform workspace new dev

# Plan and review changes
terraform plan

# Apply changes
terraform apply
```

## GitHub Environment Setup

After terraform has been applied, configure the `storybook` GitHub environment with:

| Type     | Name                         | Description                                 |
| -------- | ---------------------------- | ------------------------------------------- |
| Variable | `S3_BUCKET_NAME`             | The S3 bucket name (from AWS Console)       |
| Variable | `CLOUDFRONT_DISTRIBUTION_ID` | The CloudFront distribution ID              |
| Secret   | `DEV_AWS_ACC_ROLE`           | IAM role ARN for GitHub OIDC authentication |

## Files

| File                                  | Description                                   |
| ------------------------------------- | --------------------------------------------- |
| `provider.tf`                         | AWS provider and backend configuration        |
| `environments.tf`                     | Loads environment-specific YAML configuration |
| `storybook.tf`                        | S3 and CloudFront hosting module              |
| `outputs.tf`                          | Terraform outputs                             |
| `environments/dev/dev.yaml`           | Environment-specific configuration            |
| `environments/dev/backend.config`     | Backend configuration                         |

## Modules Used

- [`s3-cloudfront-hosting`](https://github.com/vechain/terraform_infrastructure_modules/tree/main/s3-cloudfront-hosting) - Creates S3 bucket, CloudFront distribution, ACM certificate, and Route53 records
