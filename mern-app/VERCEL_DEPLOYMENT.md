# Vercel Deployment Guide - Smart Group Evaluator

## 🚀 Quick Deploy

### Frontend Deployment

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy Frontend**:
   ```bash
   cd client
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name? **smart-group-evaluator**
   - Directory? **./client**
   - Override settings? **N**

3. **Production Deployment**:
   ```bash
   vercel --prod
   ```

### Backend Deployment

1. **Deploy Backend**:
   ```bash
   cd server
   vercel
   ```
   
   Follow prompts similar to frontend.

2. **Set Environment Variables** (on Vercel Dashboard):
   - Go to your backend project on Vercel
   - Settings → Environment Variables
   - Add:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `JWT_SECRET`: Your JWT secret key
     - `JWT_EXPIRE`: 7d
     - `CLIENT_URL`: Your frontend Vercel URL (e.g., https://smart-group-evaluator.vercel.app)
     - `NODE_ENV`: production

3. **MongoDB Atlas Setup**:
   - Go to MongoDB Atlas
   - Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
   - Or add Vercel's IP ranges

4. **Production Deployment**:
   ```bash
   vercel --prod
   ```

## 📝 Update Frontend API URL

After backend is deployed, update frontend environment:

1. Create `.env.production` in `client/`:
   ```env
   VITE_API_URL=https://your-backend-url.vercel.app/api
   ```

2. Redeploy frontend:
   ```bash
   cd client
   vercel --prod
   ```

## 🔄 Alternative: Deploy via Git

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/smart-group-evaluator.git
   git push -u origin main
   ```

2. **Import to Vercel**:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Configure:
     - **Frontend Project**:
       - Framework Preset: Vite
       - Root Directory: client
       - Build Command: `npm run build`
       - Output Directory: dist
     
     - **Backend Project**:
       - Framework Preset: Other
       - Root Directory: server
       - Build Command: `npm run build`
       - Output Directory: dist

3. **Set Environment Variables** (as mentioned above)

## 🛠️ Troubleshooting

### CORS Issues
If you face CORS errors, update backend `server/src/server.ts`:
```typescript
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-frontend-url.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### Build Errors
- Make sure all dependencies are in `package.json`
- Check Node.js version compatibility
- Review build logs on Vercel dashboard

### Database Connection
- Ensure MongoDB Atlas is accessible from Vercel
- Check connection string format
- Verify network access settings

## 📊 Post-Deployment

1. **Test Your Deployment**:
   - Visit your frontend URL
   - Try login/register
   - Check API calls in Network tab

2. **Enable Analytics** (optional):
   - Go to Vercel Dashboard
   - Analytics → Enable

3. **Custom Domain** (optional):
   - Vercel Dashboard → Settings → Domains
   - Add your custom domain

## 🔐 Security Checklist

- [ ] MongoDB network access configured
- [ ] Environment variables set
- [ ] JWT_SECRET is strong and unique
- [ ] CORS properly configured
- [ ] API rate limiting enabled (optional)
- [ ] HTTPS enabled (automatic on Vercel)

## 📱 PWA Considerations

Your PWA will work on Vercel, but ensure:
- All icon files are in `public/icons/`
- Service worker is properly configured
- HTTPS is enabled (automatic)

## 💡 Tips

- Use `vercel env pull` to sync environment variables locally
- Use `vercel logs` to view deployment logs
- Enable preview deployments for branches
- Set up deployment protection for production

---

**Need Help?** Check Vercel documentation: https://vercel.com/docs
