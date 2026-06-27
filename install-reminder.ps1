param(
  [ValidateSet(60, 90, 120)]
  [int]$Minutes = 60
)

$ErrorActionPreference = "Stop"

$taskName = "WaterTrackerReminder"
$scriptPath = Join-Path $PSScriptRoot "water-reminder-toast.ps1"
$launcherPath = Join-Path $PSScriptRoot "run-reminder-hidden.vbs"

if (-not (Test-Path $scriptPath)) {
  throw "Reminder script not found: $scriptPath"
}

if (-not (Test-Path $launcherPath)) {
  throw "Hidden launcher not found: $launcherPath"
}

$action = New-ScheduledTaskAction `
  -Execute "wscript.exe" `
  -Argument "`"$launcherPath`""

$trigger = New-ScheduledTaskTrigger `
  -Once `
  -At (Get-Date).AddMinutes(1) `
  -RepetitionInterval (New-TimeSpan -Minutes $Minutes) `
  -RepetitionDuration (New-TimeSpan -Days 3650)

$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable

$principal = New-ScheduledTaskPrincipal `
  -UserId "$env:USERDOMAIN\$env:USERNAME" `
  -LogonType Interactive `
  -RunLevel Limited

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Principal $principal `
  -Description "Water tracker desktop reminder every $Minutes minutes." `
  -Force | Out-Null

Write-Output "Desktop water reminder enabled: every $Minutes minutes."
