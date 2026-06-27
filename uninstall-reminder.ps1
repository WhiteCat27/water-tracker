$taskName = "WaterTrackerReminder"

if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  Write-Output "Desktop water reminder disabled."
} else {
  Write-Output "Desktop water reminder task was not found."
}
