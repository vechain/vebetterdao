module "datadog_integration_aws" {
  source              = "git::git@github.com:vechain/terraform_infrastructure_modules.git//datadog?ref=v.1.0.31"
  project_name        = "b3tr-dev"
  role_name           = "DatadogAWSIntegrationRole"
  aws_permissions_list = [
                "apigateway:GET",
                "autoscaling:Describe*",
                "cloudfront:GetDistributionConfig",
                "cloudfront:ListDistributions",
                "cloudtrail:DescribeTrails",
                "cloudtrail:GetTrailStatus",
                "cloudtrail:LookupEvents",
                "cloudwatch:Describe*",
                "cloudwatch:Get*",
                "cloudwatch:List*",
                "elasticloadbalancing:Describe*",
                "events:CreateEventBus",
                "health:DescribeEvents",
                "health:DescribeEventDetails",
                "health:DescribeAffectedEntities",
                "lambda:GetPolicy",
                "lambda:List*",
                "logs:DeleteSubscriptionFilter",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams",
                "logs:DescribeSubscriptionFilters",
                "logs:FilterLogEvents",
                "logs:PutSubscriptionFilter",
                "logs:TestMetricFilter",
                "route53:List*",
                "s3:GetBucketLogging",
                "s3:GetBucketLocation",
                "s3:GetBucketNotification",
                "s3:GetBucketTagging",
                "s3:ListAllMyBuckets",
                "s3:PutBucketNotification",
                "sqs:ListQueues",
                "states:ListStateMachines",
                "states:DescribeStateMachine",
                "tag:GetResources",
                "tag:GetTagKeys",
                "tag:GetTagValues",
  ]

  filter_tags          = []
  host_tags            = ["Env:b3tr-dev"]
  excluded_regions     = ["us-east-2, us-west-1, us-west-2, ca-central-1, eu-west-2, eu-west-3, eu-central-1, eu-north-1, ap-south-1, ap-northeast-1, ap-northeast-2, ap-southeast-1, ap-southeast-2, sa-east-1"]
  secret_id             = local.config.secret_arn

  datadog_integration_aws  = true
  create_api_gateway_group = true
  create_ecs_group         = false
  create_elb_group         = true
  create_s3_group          = true
  create_lambda_group      = true
  create_cloudfront_group  = true
  create_monitor           = true 

  monitors = {
  }
}
