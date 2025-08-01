# PowerShell script to fix all color issues in profile page
$filePath = "f:\Scarpper\job-portal-frontend\src\app\profile\page.tsx"
$content = Get-Content $filePath -Raw

# Replace all gray text with white text
$content = $content -replace 'text-gray-900', 'text-white'
$content = $content -replace 'text-gray-800', 'text-white'
$content = $content -replace 'text-gray-700', 'text-gray-300'

# Update input and form styling for dark theme
$content = $content -replace 'className="mt-1"', 'className="mt-1 bg-gray-700 border-gray-600 text-white"'

# Update card backgrounds to dark theme
$content = $content -replace '<Card>', '<Card className="bg-gray-800 border-gray-700">'
$content = $content -replace '<Card className="">', '<Card className="bg-gray-800 border-gray-700">'

# Update borders and backgrounds
$content = $content -replace 'border-t', 'border-t border-gray-700'
$content = $content -replace 'bg-gray-50', 'bg-gray-700'

# Update hover states for links
$content = $content -replace 'hover:bg-gray-50', 'hover:bg-gray-700'

# Save the updated content
Set-Content $filePath $content
Write-Host "Color fixes applied successfully!"
