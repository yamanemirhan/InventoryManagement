@description('Email address that receives Azure Monitor alerts.')
param alertEmail string = 'yaman.emrhn@gmail.com'

@description('Public production health endpoint.')
param productionHealthUrl string = 'https://inventory-yamanemirhan.duckdns.org/api/health'

param vmName string = 'vm-inventory-learning'
param postgresServerName string = 'psql-inventory-yamanemirhan'

var monitoringLocation = 'northeurope'

resource vm 'Microsoft.Compute/virtualMachines@2024-11-01' existing = {
  name: vmName
}

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' existing = {
  name: postgresServerName
}

resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: 'ag-inventory-alerts'
  location: 'global'
  properties: {
    enabled: true
    groupShortName: 'Inventory'
    emailReceivers: [
      {
        name: 'Owner'
        emailAddress: alertEmail
        useCommonAlertSchema: true
      }
    ]
  }
}

resource vmHighCpuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-vm-high-cpu'
  location: 'global'
  properties: {
    description: 'VM CPU usage averaged above 85 percent for 15 minutes.'
    severity: 2
    enabled: true
    scopes: [vm.id]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    targetResourceType: 'Microsoft.Compute/virtualMachines'
    targetResourceRegion: resourceGroup().location
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighCpu'
          metricNamespace: 'Microsoft.Compute/virtualMachines'
          metricName: 'Percentage CPU'
          operator: 'GreaterThan'
          threshold: 85
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

resource vmUnavailableAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-vm-unavailable'
  location: 'global'
  properties: {
    description: 'Azure reports that the production VM is unavailable.'
    severity: 0
    enabled: true
    scopes: [vm.id]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    targetResourceType: 'Microsoft.Compute/virtualMachines'
    targetResourceRegion: resourceGroup().location
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'VmUnavailable'
          metricNamespace: 'Microsoft.Compute/virtualMachines'
          metricName: 'VmAvailabilityMetric'
          operator: 'LessThan'
          threshold: 1
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

resource postgresHighCpuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-postgres-high-cpu'
  location: 'global'
  properties: {
    description: 'PostgreSQL CPU usage averaged above 80 percent for 15 minutes.'
    severity: 2
    enabled: true
    scopes: [postgres.id]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    targetResourceType: 'Microsoft.DBforPostgreSQL/flexibleServers'
    targetResourceRegion: resourceGroup().location
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighCpu'
          metricNamespace: 'Microsoft.DBforPostgreSQL/flexibleServers'
          metricName: 'cpu_percent'
          operator: 'GreaterThan'
          threshold: 80
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

resource postgresStorageAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-postgres-storage-high'
  location: 'global'
  properties: {
    description: 'PostgreSQL storage usage exceeded 80 percent.'
    severity: 1
    enabled: true
    scopes: [postgres.id]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    targetResourceType: 'Microsoft.DBforPostgreSQL/flexibleServers'
    targetResourceRegion: resourceGroup().location
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'StorageHigh'
          metricNamespace: 'Microsoft.DBforPostgreSQL/flexibleServers'
          metricName: 'storage_percent'
          operator: 'GreaterThan'
          threshold: 80
          timeAggregation: 'Maximum'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-inventory-monitoring'
  location: monitoringLocation
  kind: 'web'
  properties: {
    Application_Type: 'web'
    DisableIpMasking: false
    DisableLocalAuth: true
    RetentionInDays: 30
    SamplingPercentage: 100
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

resource productionHealthTest 'Microsoft.Insights/webTests@2022-06-15' = {
  name: 'webtest-inventory-production-health'
  location: monitoringLocation
  kind: 'standard'
  tags: {
    'hidden-link:${applicationInsights.id}': 'Resource'
  }
  properties: {
    SyntheticMonitorId: 'webtest-inventory-production-health'
    Name: 'Production API health'
    Description: 'Checks the public production API health endpoint from three European locations.'
    Enabled: true
    Frequency: 300
    Timeout: 30
    Kind: 'standard'
    RetryEnabled: true
    Locations: [
      { Id: 'emea-nl-ams-azr' }
      { Id: 'emea-gb-db3-azr' }
      { Id: 'emea-fr-pra-edge' }
    ]
    Request: {
      RequestUrl: productionHealthUrl
      HttpVerb: 'GET'
      FollowRedirects: true
      ParseDependentRequests: false
      Headers: [
        {
          key: 'X-Customer-InstanceId'
          value: 'ApplicationInsightsAvailability:webtest-inventory-production-health'
        }
      ]
    }
    ValidationRules: {
      ExpectedHttpStatusCode: 200
      IgnoreHttpStatusCode: false
      SSLCheck: true
      SSLCertRemainingLifetimeCheck: 7
    }
  }
}

resource productionHealthAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-production-site-unavailable'
  location: 'global'
  tags: {
    'hidden-link:${applicationInsights.id}': 'Resource'
    'hidden-link:${productionHealthTest.id}': 'Resource'
  }
  properties: {
    description: 'Production health endpoint failed from at least two Azure test locations.'
    severity: 0
    enabled: true
    scopes: [
      productionHealthTest.id
      applicationInsights.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.WebtestLocationAvailabilityCriteria'
      webTestId: productionHealthTest.id
      componentId: applicationInsights.id
      failedLocationCount: 2
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

output actionGroupName string = actionGroup.name
output applicationInsightsName string = applicationInsights.name
output availabilityTestName string = productionHealthTest.name
