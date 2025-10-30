@echo off

echo Updating all HTML files with new components...

:: Create necessary directories
mkdir frontend\components 2>nul
mkdir frontend\css 2>nul
mkdir frontend\js 2>nul

:: Update all HTML files
for /r frontend %%f in (*.html) do (
    if not "%%~nf"=="navbar" if not "%%~nf"=="footer" if not "%%~nf"=="page-template" (
        echo Updating %%f...
        
        :: Add components to head
        powershell -Command "(gc '%%f') -replace '<head>[^<]*</head>', '<!-- Components -->' | Set-Content '%%f'"
        
        :: Replace old navbar
        powershell -Command "(gc '%%f') -replace '<!-- Navigation -->.*?</nav>', '<!-- Navigation -->\n    <div id=""navbar-placeholder""></div>' | Set-Content '%%f'"
        
        :: Replace old footer
        powershell -Command "(gc '%%f') -replace '<!-- Footer -->.*?</footer>', '<!-- Footer -->\n    <div id=""footer-placeholder""></div>' | Set-Content '%%f'"
        
        :: Add component scripts
        powershell -Command "(gc '%%f') -replace '</body>', '    <!-- Components JS -->\n    <script src=""/js/components.js""></script>\n</body>' | Set-Content '%%f'"
    )
)

echo Done updating files!