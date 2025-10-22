const request = require('supertest');
const express = require('express');
const session = require('express-session');
const passport = require('passport');

describe('Apple OAuth Callback', () => {
  let app;

  beforeEach(() => {
    // Create a minimal Express app for testing
    app = express();

    // Add body parsers - same as in server.js
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Add session support
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false
    }));

    app.use(passport.initialize());
    app.use(passport.session());
  });

  test('should parse URL-encoded user data from Apple callback', async () => {
    // This is the exact POST body Apple sends
    const appleCallbackBody = 'state=f542213aa8&code=c408965fca97e4ca0be60aa1c3499b40c.0.ptvy.o_xVaXcRwUQ6Yt-0NPKMEg&user=%7B%22name%22%3A%7B%22firstName%22%3A%22James%22%2C%22lastName%22%3A%22Smith%22%7D%2C%22email%22%3A%22james%40somedomain.tld%22%7D';

    // Create a test route that mimics our Apple callback parsing
    app.post('/auth/apple/callback', (req, res) => {
      console.log('Raw req.body:', req.body);
      console.log('req.body.user type:', typeof req.body.user);
      console.log('req.body.user value:', req.body.user);

      let userData = null;

      // Parse user data if present
      if (req.body.user) {
        if (typeof req.body.user === 'string') {
          try {
            userData = JSON.parse(req.body.user);
            console.log('Parsed user data from string:', userData);
          } catch (error) {
            console.error('Error parsing user data:', error.message);
            return res.status(400).json({ error: 'Invalid user data format' });
          }
        } else if (typeof req.body.user === 'object') {
          userData = req.body.user;
          console.log('User data already parsed:', userData);
        }
      }

      res.json({
        state: req.body.state,
        code: req.body.code,
        user: userData,
        parsedCorrectly: userData !== null,
        email: userData?.email,
        firstName: userData?.name?.firstName,
        lastName: userData?.name?.lastName
      });
    });

    const response = await request(app)
      .post('/auth/apple/callback')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(appleCallbackBody);

    console.log('Response:', JSON.stringify(response.body, null, 2));

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body.parsedCorrectly).toBe(true);
    expect(response.body.email).toBe('james@somedomain.tld');
    expect(response.body.firstName).toBe('James');
    expect(response.body.lastName).toBe('Smith');
    expect(response.body.state).toBe('f542213aa8');
    expect(response.body.code).toBeDefined();
  });

  test('should handle URL-encoded user data as string', async () => {
    // Manually URL-encoded JSON string
    const userDataEncoded = '%7B%22name%22%3A%7B%22firstName%22%3A%22James%22%2C%22lastName%22%3A%22Smith%22%7D%2C%22email%22%3A%22james%40somedomain.tld%22%7D';

    // When decoded, this becomes: {"name":{"firstName":"James","lastName":"Smith"},"email":"james@somedomain.tld"}
    const decodedUserData = decodeURIComponent(userDataEncoded);
    console.log('Decoded user data string:', decodedUserData);

    const parsedUserData = JSON.parse(decodedUserData);
    console.log('Parsed user data:', parsedUserData);

    expect(parsedUserData.email).toBe('james@somedomain.tld');
    expect(parsedUserData.name.firstName).toBe('James');
    expect(parsedUserData.name.lastName).toBe('Smith');
  });

  test('should handle when user data is already parsed as object', async () => {
    // Create a test route
    app.post('/auth/apple/callback', (req, res) => {
      let userData = null;

      if (req.body.user) {
        if (typeof req.body.user === 'string') {
          userData = JSON.parse(req.body.user);
        } else if (typeof req.body.user === 'object') {
          userData = req.body.user;
        }
      }

      res.json({
        user: userData,
        email: userData?.email
      });
    });

    // Send as JSON (simulating already-parsed scenario)
    const response = await request(app)
      .post('/auth/apple/callback')
      .set('Content-Type', 'application/json')
      .send({
        state: 'test',
        code: 'test-code',
        user: {
          name: {
            firstName: 'James',
            lastName: 'Smith'
          },
          email: 'james@somedomain.tld'
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.email).toBe('james@somedomain.tld');
  });

  test('should extract email from multiple possible locations', async () => {
    const testCases = [
      {
        name: 'Email in req.body.user',
        reqBodyUser: { email: 'test1@example.com', name: { firstName: 'Test' } },
        idToken: { sub: '123' },
        profile: {},
        expectedEmail: 'test1@example.com'
      },
      {
        name: 'Email in idToken',
        reqBodyUser: null,
        idToken: { sub: '123', email: 'test2@example.com' },
        profile: {},
        expectedEmail: 'test2@example.com'
      },
      {
        name: 'Email in profile',
        reqBodyUser: null,
        idToken: { sub: '123' },
        profile: { email: 'test3@example.com' },
        expectedEmail: 'test3@example.com'
      },
      {
        name: 'Email priority: req.body.user > profile > idToken',
        reqBodyUser: { email: 'user@example.com', name: { firstName: 'User' } },
        idToken: { sub: '123', email: 'token@example.com' },
        profile: { email: 'profile@example.com' },
        expectedEmail: 'user@example.com'
      }
    ];

    testCases.forEach(testCase => {
      const email = testCase.reqBodyUser?.email || testCase.profile.email || testCase.idToken.email;
      expect(email).toBe(testCase.expectedEmail);
    });
  });
});
