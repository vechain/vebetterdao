module "datadog_integration_aws" {
  source = "git::git@github.com:vechain/terraform_infrastructure_modules.git//datadog?ref=v.1.0.23"
  project_name = local.config.environment_name
  role_name  = "DatadogAWSIntegrationRole"
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
                "ecs:Describe*",
                "ecs:List*",
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
  
  filter_tags = []
  host_tags   = ["Env:${local.config.environment_name}"]
  namespace_rules = {
    "us-east-1" = true  // Enable monitoring for us-east-1
    "eu-west-1" = true  // Enable monitoring for eu-west-1
  } 

  dashboard_title       = "${local.config.environment_name} Dashboard"
  dashboard_description = "Monitoring dashboard for ${local.config.environment_name}"
  layout_type          = "ordered"
  alert_id             = "some-alert-id"
  widget_type          = "timeseries"
  widget_title         = "Widget Title"
  widget_time_span     = "10m"
  secret_id            = local.config.secret_arn
}



