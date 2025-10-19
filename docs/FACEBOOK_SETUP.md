# Facebook OAuth Setup Guide

This guide will help you set up Facebook Login for the JAM Authentication Service.

## Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"My Apps"** in the top right
3. Click **"Create App"**
4. Select **"Consumer"** as the app type
5. Fill in the app details:
   - **App Name**: JAM Auth (or your preferred name)
   - **App Contact Email**: Your email address
6. Click **"Create App"**

## Step 2: Add Facebook Login Product

1. In your app dashboard, find **"Facebook Login"** in the products list
2. Click **"Set Up"** next to Facebook Login
3. Choose **"Web"** as the platform
4. Skip the quickstart (we've already integrated it)

## Step 3: Configure OAuth Settings

1. In the left sidebar, go to **Facebook Login > Settings**
2. Add your **Valid OAuth Redirect URIs**:
   - For local development: `http://localhost:3000/auth/facebook/callback`
   - For production: `https://your-domain.com/auth/facebook/callback`
3. Click **"Save Changes"**

## Step 4: Get Your Credentials

1. In the left sidebar, go to **Settings > Basic**
2. Copy your **App ID** (this is your `clientID`)
3. Click **"Show"** next to **App Secret** and copy it (this is your `clientSecret`)
4. Keep these credentials secure!

## Step 5: Update Your config.json

Add the Facebook credentials to your `config.json`:

```json
{
  "server": {
    "port": 3000,
    "host": "localhost",
    "publicProtocol": "http",
    "publicHost": "localhost",
    "publicPort": 3000
  },
  "idProviders": {
    "facebook": {
      "clientID": "YOUR_FACEBOOK_APP_ID",
      "clientSecret": "YOUR_FACEBOOK_APP_SECRET",
      "callbackPath": "/auth/facebook/callback",
      "scope": ["public_profile", "email"],
      "profileFields": ["id", "displayName", "emails", "name"]
    }
  }
}
```

## Step 6: Test Facebook Login

1. Make sure your server is running with the updated config
2. Go to `http://localhost:3000`
3. Click the **"Sign in with Facebook"** button
4. You should be redirected to Facebook to authorize the app
5. After authorization, you'll be redirected back to the welcome page

## Important Notes

### Email Permission
- Facebook requires app review to access user emails in production
- During development, you can test with your own Facebook account
- The `email` permission is included in the scope, but may not work without app review

### App Modes
- **Development Mode**: Only admins, developers, and testers can log in
- **Live Mode**: Requires app review before the public can use it

### Testing in Development Mode
1. Go to **Roles > Test Users** in your app dashboard
2. Add test users to test the login flow
3. Or add your personal Facebook account as a developer

### Production Checklist
Before going live:
1. Complete Facebook's App Review for required permissions (especially `email`)
2. Update your **Privacy Policy URL** in app settings
3. Update your **Terms of Service URL** in app settings
4. Switch the app from Development to Live mode
5. Update `config.json` with production callback URL

## Troubleshooting

**Error: "URL Blocked"**
- Make sure your redirect URI is added to **Valid OAuth Redirect URIs**
- Ensure the URI matches exactly (including http/https and trailing slashes)

**Error: "App Not Set Up"**
- Verify Facebook Login product is added to your app
- Check that your app is in the correct mode (Development/Live)

**Email not returned**
- Facebook requires app review for email access in production
- Check that `email` is in your scope array
- Verify profileFields includes `emails`

## Proxy Configuration

If running behind a proxy, ensure your public URL is correctly configured:

```json
{
  "server": {
    "port": 3000,
    "host": "0.0.0.0",
    "publicProtocol": "https",
    "publicHost": "auth.example.com",
    "publicPort": 443
  },
  "idProviders": {
    "facebook": {
      "callbackPath": "/auth/facebook/callback"
    }
  }
}
```

The callback URL will automatically be: `https://auth.example.com/auth/facebook/callback`
