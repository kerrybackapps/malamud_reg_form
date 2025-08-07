# Deployment Instructions for Koyeb

## Prerequisites
- Koyeb account
- GitHub repository with the latest code

## Environment Variables to Set in Koyeb

You must configure these environment variables in your Koyeb service settings:

```bash
# Required for production
NODE_ENV=production

# Admin credentials (CHANGE THESE!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-here

# JWT Secret (CHANGE THIS to a long random string!)
JWT_SECRET=your-very-long-random-secret-key-here

# Port (Koyeb usually sets this automatically)
PORT=8000
```

## Important Security Steps

1. **Change Default Credentials**: 
   - Set a strong password for `ADMIN_PASSWORD`
   - Consider changing `ADMIN_USERNAME` as well

2. **Generate Secure JWT Secret**:
   - Use a cryptographically secure random string (at least 32 characters)
   - You can generate one using: `openssl rand -base64 32`

3. **HTTPS Only**: 
   - Koyeb provides HTTPS by default
   - The app is configured to use secure cookies in production

## Deployment Steps

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add admin panel"
   git push origin master
   ```

2. **In Koyeb Dashboard**:
   - Create new service or update existing
   - Connect to your GitHub repository
   - Set the environment variables above
   - Deploy

3. **Access Admin Panel**:
   - Navigate to: `https://your-app.koyeb.app/admin.html`
   - Login with your configured credentials

## Features

- **Registration Form**: Available at the root URL
- **Admin Panel**: `/admin.html` - requires authentication
- **CSV Export**: Download all registrations as CSV
- **Statistics**: View registration counts by role

## Data Persistence

- Registration data is stored in `registrations.json`
- Make sure your Koyeb service has persistent storage if needed
- Consider backing up this file regularly

## Troubleshooting

1. **Can't login**: 
   - Check environment variables are set correctly
   - Ensure cookies are enabled in your browser
   - Check browser console for errors

2. **CORS errors**: 
   - The app automatically detects Koyeb's domain
   - If issues persist, check `KOYEB_PUBLIC_DOMAIN` env var

3. **Data not persisting**: 
   - Koyeb free tier may not persist files between deployments
   - Consider using a database for production use