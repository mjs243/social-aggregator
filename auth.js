app.get('/auth/twitter', (req, res) => {
  oauth.getOAuthRequestToken((error, oauthToken, oauthTokenSecret, results) => {
    if (error) {
      console.error('Error getting OAuth request token:', error); // Log the full error object
      res.send("Error getting OAuth request token: " + JSON.stringify(error)); // Send the full error object as a string
    } else {
      // Store the OAuth token secret in the session for later use
      req.session.oauthTokenSecret = oauthTokenSecret;

      // Redirect the user to Twitter for authorization
      res.redirect(`https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`);
    }
  });
});

app.get('/auth/twitter/callback', (req, res) => {
  const oauthToken = req.query.oauth_token;
  const oauthVerifier = req.query.oauth_verifier;

  // Retrieve the OAuth token secret from the session
  const oauthTokenSecret = req.session.oauthTokenSecret;

  if (!oauthToken || !oauthVerifier || !oauthTokenSecret) {
    console.error('Request token or verifier missing');
    return res.status(400).send('Request token or verifier missing');
  }

  oauth.getOAuthAccessToken(oauthToken, oauthTokenSecret, oauthVerifier, (error, oauthAccessToken, oauthAccessTokenSecret, results) => {
    if (error) {
      console.error('Error getting OAuth access token:', error); // Log the full error object
      res.send("Error getting OAuth access token: " + JSON.stringify(error)); // Send the full error object as a string
    } else {
      // Save the access tokens for later use
      res.send("Twitter authentication successful!");
    }
  });
});
