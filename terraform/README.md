# Terraform

To be able to configure dev environment with terraform:

1. Have aws cli v2 installed
2. Configure sso profiles
3. Logging into sso profiles

To login for local deployment use: export AWS_PROFILE=b3tr-testnet && yawsso login

Follow the below link to setup SSO locally.
https://vechain.atlassian.net/wiki/spaces/Devops/pages/183435265/Playing+nice+with+Okta+AWS+SSO+and+Terraform

To initialize infra use following terraform init command:

```bash
cd terraform
terraform init
```

To plan infra use following terraform plan command:

```bash
terraform plan
```

To deploy infra use following terraform apply command:

```bash
terraform apply
```
