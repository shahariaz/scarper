# PowerShell script to fix remaining color issues
$filePath = "f:\Scarpper\job-portal-frontend\src\app\profile\page.tsx"
$content = Get-Content $filePath -Raw

# Fix error page text
$content = $content -replace 'text-2xl font-bold text-gray-900', 'text-2xl font-bold text-white'
$content = $content -replace 'Unable to load your profile information.</p>', 'Unable to load your profile information.</p>' -replace 'text-gray-700">Unable', 'text-gray-300">Unable'

# Fix remaining social media label texts that weren't caught
$content = $content -replace 'Label className="text-xs text-gray-900"', 'Label className="text-xs text-white"'

# Update link hover states in social links
$content = $content -replace 'text-gray-900 hover:text-blue-600 hover:bg-gray-50', 'text-white hover:text-blue-400 hover:bg-gray-700'

# Fix activity section background colors and text
$content = $content -replace 'bg-gray-50 p-4 rounded-lg', 'bg-gray-700 p-4 rounded-lg'
$content = $content -replace 'text-gray-900 font-medium', 'text-white font-medium'
$content = $content -replace 'text-gray-900/80', 'text-gray-300'
$content = $content -replace 'text-gray-900/60', 'text-gray-400'

# Fix settings section
$content = $content -replace 'Label className="text-gray-900 font-medium"', 'Label className="text-white font-medium"'

# Save the updated content
Set-Content $filePath $content
Write-Host "Additional color fixes applied!"
