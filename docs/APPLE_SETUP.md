# Apple Sign In Setup Guide

This guide will help you set up Apple Sign In for the JAM Authentication Service.

## Prerequisites

- An Apple Developer account ($99/year)
- A registered domain name (required for Apple Sign In)

## Step 1: Register an App ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** in the sidebar
4. Click the **+** button to create a new identifier
5. Select **App IDs** and click **Continue**
6. Select **App** and click **Continue**
7. Fill in the details:
   - **Description**: JAM Auth Service
   - **Bundle ID**: com.yourcompany.jamauth (choose a unique identifier)
8. Scroll down and check **Sign In with Apple**
9. Click **Continue** and then **Register**

## Step 2: Create a Services ID

This is your OAuth Client ID:

1. In **Certificates, Identifiers & Profiles**, click **Identifiers**
2. Click the **+** button
3. Select **Services IDs** and click **Continue**
4. Fill in the details:
   - **Description**: JAM Auth Web Service
   - **Identifier**: com.yourcompany.jamauth.service (must be different from App ID)
5. Click **Continue** and then **Register**
6. Click on the newly created Services ID
7. Check **Sign In with Apple** and click **Configure**
8. Configure the settings:
   - **Primary App ID**: Select the App ID you created in Step 1
   - **Domains and Subdomains**: Add your domain (e.g., `auth.example.com`)
   - **Return URLs**: Add your callback URL:
     - Development: `http://localhost:3000/auth/apple/callback`
     - Production: `https://auth.example.com/auth/apple/callback`
9. Click **Save** and then **Continue** and **Save** again

**Note:** Your Services ID (e.g., `com.yourcompany.jamauth.service`) is your `clientID`.

## Step 3: Create a Private Key

1. In **Certificates, Identifiers & Profiles**, click **Keys**
2. Click the **+** button
3. Enter a **Key Name**: JAM Auth Sign In Key
4. Check **Sign In with Apple**
5. Click **Configure** next to Sign In with Apple
6. Select your **Primary App ID** from Step 1
7. Click **Save**, then **Continue**, then **Register**
8. Click **Download** to download your private key file (`AuthKey_XXXXXXXXXX.p8`)
9. **IMPORTANT**: Save this file securely - you can only download it once!
10. Note your **Key ID** (shown on the download page)

## Step 4: Get Your Team ID

1. In the Apple Developer Portal, look at the top right corner
2. Your Team ID is shown in your account details
3. Or go to **Membership** in the sidebar to see your Team ID

## Step 5: Set Up Your Private Key

1. Create a `keys` directory in your project root:
   ```bash
   mkdir keys
   ```

2. Move your downloaded `.p8` file to the `keys` directory:
   ```bash
   mv ~/Downloads/AuthKey_XXXXXXXXXX.p8 ./keys/
   ```

3. The `keys` directory is already in `.gitignore` to keep your private key secure

## Step 6: Update Your config.json

Add the Apple credentials to your `config.json`:

```json
{
  "server": {
    "port": 3000,
    "host": "localhost",
    "publicProtocol": "https",
    "publicHost": "auth.example.com",
    "publicPort": 443
  },
  "idProviders": {
    "apple": {
      "clientID": "com.yourcompany.jamauth.service",
      "teamID": "ABC1234DEF",
      "keyID": "XYZ9876WVU",
      "privateKeyPath": "./keys/AuthKey_XYZ9876WVU.p8",
      "callbackPath": "/auth/apple/callback",
      "scope": ["name", "email"]
    }
  }
}
```

Replace:
- `clientID`: Your Services ID from Step 2
- `teamID`: Your Team ID from Step 4
- `keyID`: The Key ID from Step 3
- `privateKeyPath`: Path to your downloaded `.p8` file

## Step 7: Test Apple Sign In

1. Make sure your server is running with the updated config
2. Go to your application's login page
3. Click the **"Sign in with Apple"** button
4. You should be redirected to Apple's authorization page
5. After authorization, you'll be redirected back to the welcome page

## Important Notes

### Domain Requirements

Apple Sign In **requires** a valid domain name and HTTPS in production:
- You cannot use `localhost` in production
- You must use HTTPS (not HTTP) for production
- For local development, you can use `localhost` with HTTP

### Email Privacy

- Apple allows users to hide their email address
- If a user chooses "Hide My Email", Apple provides a relay email: `xxxxx@privaterelay.appleid.com`
- Your app will receive the relay email, and Apple forwards messages to the user's real email

### Name Information

- Apple only provides the user's name on the **first** authorization
- After the first time, Apple only returns the user ID and email
- Store the name in your database on first login

### Testing in Development

For local testing without HTTPS:
1. Use `http://localhost:3000` as your callback URL in Apple's configuration
2. Set your config.json to:
   ```json
   {
     "server": {
       "publicProtocol": "http",
       "publicHost": "localhost",
       "publicPort": 3000
     }
   }
   ```

### Production Deployment

Before going live:
1. Ensure your domain is verified in Apple's Services ID configuration
2. Add production callback URL: `https://yourdomain.com/auth/apple/callback`
3. Use HTTPS - Apple requires it for production
4. Update your `config.json` with production settings:
   ```json
   {
     "server": {
       "port": 3000,
       "host": "0.0.0.0",
       "publicProtocol": "https",
       "publicHost": "auth.example.com",
       "publicPort": 443
     }
   }
   ```

## Troubleshooting

**Error: "invalid_client"**
- Verify your Services ID (clientID) is correct
- Check that Sign In with Apple is enabled for your Services ID
- Ensure your callback URL is registered in the Services ID configuration

**Error: "invalid_request"**
- Check that your domain is registered in Apple's Services ID
- Verify the callback URL matches exactly (including protocol and path)

**Private key error**
- Ensure the `.p8` file path is correct
- Verify the Key ID matches the key file
- Check that the file permissions allow reading

**Name not returned**
- Apple only sends name on first authorization
- To test again, go to your Apple ID settings and revoke access to the app
- The user can then re-authorize and you'll receive the name again

## Security Best Practices

1. **Never commit your private key**: The `keys/` directory and `*.p8` files are gitignored
2. **Secure your private key**: Keep the `.p8` file secure on your server
3. **Use environment-specific configs**: Use different Services IDs for development and production
4. **Rotate keys periodically**: Apple allows multiple active keys, so you can rotate without downtime

## Proxy Configuration

If running behind a reverse proxy:

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
    "apple": {
      "callbackPath": "/auth/apple/callback"
    }
  }
}
```

The callback URL will automatically be: `https://auth.example.com/auth/apple/callback`
