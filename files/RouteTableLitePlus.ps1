Get-NetRoute -ErrorAction SilentlyContinue | Select-Object -First 25 DestinationPrefix,NextHop,InterfaceAlias,RouteMetric | Format-Table -AutoSize
