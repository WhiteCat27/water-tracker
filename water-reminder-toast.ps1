param(
  [string]$Title = "Water reminder",
  [string]$Message = "Drink one 400 mL cup."
)

$ErrorActionPreference = "Stop"

function Show-WindowsToast {
  param(
    [string]$ToastTitle,
    [string]$ToastMessage
  )

  [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
  [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

  $safeTitle = [System.Security.SecurityElement]::Escape($ToastTitle)
  $safeMessage = [System.Security.SecurityElement]::Escape($ToastMessage)
  $xmlText = @"
<toast>
  <visual>
    <binding template="ToastGeneric">
      <text>$safeTitle</text>
      <text>$safeMessage</text>
    </binding>
  </visual>
</toast>
"@

  $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
  $xml.LoadXml($xmlText)
  $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
  $notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Microsoft.Windows.PowerShell")
  $notifier.Show($toast)
}

try {
  Show-WindowsToast -ToastTitle $Title -ToastMessage $Message
} catch {
  $msg = "$Title - $Message"
  Start-Process -FilePath "msg.exe" -ArgumentList @($env:USERNAME, $msg) -WindowStyle Hidden
}
