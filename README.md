# Overview

The purpose of this project is to provide a backend service that authenticates users for an application.  This project should be considered a microservice that can be reused in other projects.  It will aim to integrate with Google, Apple, Facebook, and any other public IdPs that users regularly like to use for sign-in services.  When a user signs in with one of these public IdPs, this application it responsible for matching the IdP credentials with an existing user account, or creating a new user account.  The application will also issue a JWT that can be used for authentication by other microservices in the application.


# Components
* Frontend for demonstration 
* Backend
* Database

# High-Level Requirements
* A backend service that accepts credentials from public IdPs such as Google, Apple, and Facebook
* A demonstration frontend app with a login page and a welcome page.
* The demonstration frontend login page will display login buttons for the public IdPs that the backend is configured to use.
* The demonstration frontend welcome page will display the name of the authenticated user.
* The backend will host the frontend page.
* The backend will use a database to store user account information
* After validating authenication from an external IdP, generate a JWT for the user using a signing key and cert.
* The backend will attempt to match the user's credentials from the IdP to the applications user account.  This should usually be done using the unique user identifier from the IdP.
* If the user logs in with a different IdP than previous attempts, the backend should attempt to match the new IdP's credentials with the existing user account.
* The backend will create a user account in the database if the user does not already exist.
* The backend should request the user's email from the public IdP, so the application can communicate to the user through email.
* Once the user's application account has been created, the backend will issue a signed JWT containing the user's application credentials.

# Detailed design
* The backend has a configuration file.
* The backend configuration has the configuration data for all the IdPs  the application integrates with.
* The JWT must have an expiration date and time, which can be adjusted by the backend configuration.
* The backend will be put into a container.
* The frontend will be react.js
* The backend will be Express and node.js.
* The backend database will be mongo.
* The application will support Google's IdP

# Development notes
* All code must have tests written first, and ensure the tests are all failing, before writing the code to pass the tests.

# JWT Token Retrieval

After successful OAuth authentication, client applications retrieve the JWT token via a separate API call to `GET /api/token`.

**Why not include JWT in the OAuth callback redirect?**
- JWT tokens are typically 500-1000+ characters and can exceed URL length limits
- Including tokens in URL parameters exposes them in browser history and server logs
- Separate API calls keep tokens in secure response bodies, not URLs

**Pattern:**
1. User completes OAuth flow → redirected to `/welcome` with session cookie
2. Client makes authenticated request to `GET /api/token`
3. Server returns `{ "token": "eyJhbG..." }`
4. Client uses JWT for authenticating with other microservices

See `SETUP.md` for detailed implementation examples.






