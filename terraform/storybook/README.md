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

| Environment | Domain                        | AWS Account             | Workspace |
| ----------- | ----------------------------- | ----------------------- | --------- |
| prod        | storybook.b3tr.vechain.org    | b3tr-dev (211125319139) | `prod`    |

## Prerequisites

1. **AWS Account**: Ensure you have access to the b3tr-dev AWS account
2. **S3 State Bucket**: The following S3 bucket must exist for terraform state:
   - `b3tr-terraform-state-dev` (in b3tr-dev account)
3. **Route53 Zone**: The `b3tr.vechain.org` zone must exist

## Usage

### Initialize Terraform

```bash
terraform init -backend-config="environments/prod/backend.config"
```

### Select Workspace

```bash
# Create and select workspace for first time
terraform workspace new prod

# Or select existing workspace
terraform workspace select prod
```

### Plan and Apply

```bash
# Plan changes
terraform plan

# Apply changes
terraform apply
```

## Post-Deployment Setup

After initial terraform apply, you need to:

1. Get the S3 bucket name from AWS Console (it includes a random suffix)
2. Get the CloudFront distribution ID from AWS Console
3. Update the GitHub repository environment variables:

| Environment | Variables to Set                            |
| ----------- | ------------------------------------------- |
| storybook   | `S3_BUCKET_NAME`, `CLOUDFRONT_DISTRIBUTION_ID` |

## GitHub Environment Secrets

The storybook environment needs the following secrets:

| Secret            | Description                                 |
| ----------------- | ------------------------------------------- |
| `DEV_AWS_ACC_ROLE`| IAM role ARN for GitHub OIDC authentication |

## Files

| File                      | Description                                   |
| ------------------------- | --------------------------------------------- |
| `provider.tf`             | AWS provider and backend configuration        |
| `environments.tf`         | Loads environment-specific YAML configuration |
| `storybook.tf`            | S3 and CloudFront hosting module              |
| `outputs.tf`              | Terraform outputs for CI/CD                   |
| `environments/prod/*.yaml`| Environment-specific configuration            |
| `environments/prod/*.config` | Backend configuration                      |

## Modules Used

- [`s3-cloudfront-hosting`](https://github.com/vechain/terraform_infrastructure_modules/tree/main/s3-cloudfront-hosting) - Creates S3 bucket, CloudFront distribution, ACM certificate, and Route53 records

