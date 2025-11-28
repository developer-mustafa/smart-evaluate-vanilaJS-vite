@echo off
REM Smart Group Evaluator - Automated Vercel Deployment (Windows)

echo 🚀 Starting automated deployment...

REM Get user input
set /p MONGODB_URI="MongoDB URI (from MongoDB Atlas): "
set /p JWT_SECRET="JWT Secret (or press Enter to use default): "

if "%JWT_SECRET%"=="" (
    set JWT_SECRET=change-this-super-secret-key-in-production-please
)

set JWT_EXPIRE=7d

echo.
echo 📦 Deploying Backend...
cd server

REM Deploy backend
call npx vercel --prod --yes

echo.
echo ✅ Backend deployment started!
echo Copy the backend URL and press Enter to continue...
set /p BACKEND_URL="Backend URL: "

cd ..

echo.
echo 📦 Deploying Frontend...
cd client

REM Deploy frontend
call npx vercel --prod --yes

echo.
echo ✅ Frontend deployment started!
echo.

cd ..

echo.
echo ================================
echo 🎉 Deployment Process Started!
echo ================================
echo.
echo ⚠️  Next Steps:
echo 1. Go to Vercel Dashboard
echo 2. Configure Environment Variables:
echo    Backend: MONGODB_URI, JWT_SECRET, NODE_ENV, CLIENT_URL
echo    Frontend: VITE_API_URL
echo 3. Redeploy both projects
echo 4. Add 0.0.0.0/0 to MongoDB Atlas Network Access
echo.
pause
