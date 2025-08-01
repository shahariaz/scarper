$content = Get-Content "f:\Scarpper\job-portal-frontend\src\app\profile\page.tsx" -Raw

# Replace all remaining instances comprehensively
$content = $content -replace 'text-gray-900', 'text-white'
$content = $content -replace 'hover:bg-gray-50', 'hover:bg-gray-700'
$content = $content -replace 'hover:text-blue-600', 'hover:text-blue-400'
$content = $content -replace 'text-gray-800', 'text-white'

Set-Content "f:\Scarpper\job-portal-frontend\src\app\profile\page.tsx" $content
Write-Host "Final color theme applied successfully!"
