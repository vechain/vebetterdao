#module "datadog_integration_aws" {
#  source = "git::git@github.com:vechain/terraform_infrastructure_modules.git//datadog?ref=v.1.0.23"
#  project_name = local.config.environment_name
#  role_name  = "DatadogAWSIntegrationRole"
#  aws_permissions_list = [
#                "apigateway:GET",
#                "autoscaling:Describe*",
#                "cloudfront:GetDistributionConfig",
#                "cloudfront:ListDistributions",
#                "cloudtrail:DescribeTrails",
#                "cloudtrail:GetTrailStatus",
#                "cloudtrail:LookupEvents",
#                "cloudwatch:Describe*",
#                "cloudwatch:Get*",
#                "cloudwatch:List*",
#                "ecs:Describe*",
#                "ecs:List*",
#                "elasticloadbalancing:Describe*",
#                "events:CreateEventBus",
#                "health:DescribeEvents",
#                "health:DescribeEventDetails",
#                "health:DescribeAffectedEntities",
#                "lambda:GetPolicy",
#                "lambda:List*",
#                "logs:DeleteSubscriptionFilter",
#                "logs:DescribeLogGroups",
#                "logs:DescribeLogStreams",
#                "logs:DescribeSubscriptionFilters",
#                "logs:FilterLogEvents",
#                "logs:PutSubscriptionFilter",
#                "logs:TestMetricFilter",
#                "route53:List*",
#                "s3:GetBucketLogging",
#                "s3:GetBucketLocation",
#                "s3:GetBucketNotification",
#                "s3:GetBucketTagging",
#                "s3:ListAllMyBuckets",
#                "s3:PutBucketNotification",
#                "sqs:ListQueues",
#                "states:ListStateMachines",
#                "states:DescribeStateMachine",
#                "tag:GetResources",
#                "tag:GetTagKeys",
#                "tag:GetTagValues",
#  ]
#  
#  filter_tags = []
#  host_tags   = ["Env:${local.config.environment_name}"]
#  excluded_regions = ["us-east-2, us-west-1, us-west-2, ca-central-1, eu-west-2, eu-west-3, eu-central-1, eu-north-1, ap-south-1, ap-northeast-1, ap-northeast-2, ap-southeast-1, ap-southeast-2, sa-east-1"]
#
#  dashboard_title       = "${local.config.environment_name} Dashboard"
#  dashboard_description = "Monitoring dashboard for ${local.config.environment_name}"
#  layout_type          = "ordered"
#  alert_id             = "some-alert-id"
#  widget_type          = "timeseries"
#  widget_title         = "Widget Title"
#  widget_time_span     = "10m"
#  secret_id            = local.config.secret_arn
#}
