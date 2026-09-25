$apiId = "m86xs206g5"
$region = "ap-south-1"

# Get function ARNs
$connectFn = (aws lambda get-function --function-name prep-arena-stack-WebSocketConnectFunction-UdXRSUBTtmrl --region $region | ConvertFrom-Json).Configuration.FunctionArn
$disconnectFn = (aws lambda get-function --function-name prep-arena-stack-WebSocketDisconnectFunction-XuQdprRiajzG --region $region | ConvertFrom-Json).Configuration.FunctionArn
$sendFn = (aws lambda get-function --function-name prep-arena-stack-WebSocketSendMessageFunction-DzcdPROxkG7e --region $region | ConvertFrom-Json).Configuration.FunctionArn

# Create Integrations
$connIntId = (aws apigatewayv2 create-integration --api-id $apiId --integration-type AWS_PROXY --integration-uri "arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${connectFn}/invocations" --region $region | ConvertFrom-Json).IntegrationId
$discIntId = (aws apigatewayv2 create-integration --api-id $apiId --integration-type AWS_PROXY --integration-uri "arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${disconnectFn}/invocations" --region $region | ConvertFrom-Json).IntegrationId
$sendIntId = (aws apigatewayv2 create-integration --api-id $apiId --integration-type AWS_PROXY --integration-uri "arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${sendFn}/invocations" --region $region | ConvertFrom-Json).IntegrationId

# Create Routes
aws apigatewayv2 create-route --api-id $apiId --route-key '$connect' --target "integrations/$connIntId" --region $region
aws apigatewayv2 create-route --api-id $apiId --route-key '$disconnect' --target "integrations/$discIntId" --region $region
aws apigatewayv2 create-route --api-id $apiId --route-key 'sendMessage' --target "integrations/$sendIntId" --region $region

# Deploy
$deployId = (aws apigatewayv2 create-deployment --api-id $apiId --region $region | ConvertFrom-Json).DeploymentId
aws apigatewayv2 create-stage --api-id $apiId --stage-name Prod --deployment-id $deployId --region $region
