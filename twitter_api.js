// twitter_api.js

require('dotenv').config();
const express = require('express');
const OAuth = require('oauth').OAuth;
const Twit = require('twit');
const readline = require('readline');
const config = require('./config.json');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from Public directory
app.use(express.static(path.join(__dirname, 'public')));

// Load Twitter API keys from environment variables
const consumerKey = process.env.TWITTER_API_KEY;
const consumerSecret = process.env.TWITTER_API_SECRET_KEY;
const accessToken = process.env.TWITTER_ACCESS_TOKEN;
const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

// Initialize OAuth
const oauth = new OAuth(
  "https://api.twitter.com/oauth/request_token",
  "https://api.twitter.com/oauth/access_token",
  consumerKey,
  consumerSecret,
  "1.0A",
  null,
  "HMAC-SHA1"
);

// Initialize Twit with config
const twitterClient = new Twit({
  consumer_key: consumerKey,
  consumer_secret: consumerSecret,
  access_token: accessToken,
  access_token_secret: accessTokenSecret,
});

// Fetch popular tweets from a user's timeline
async function getPopularTweets(username, count = config.defaults.tweet_count) {
  try {
    const { data } = await twitterClient.get('statuses/user_timeline', {
      screen_name: username,
      count,
    });

    const popularTweets = data
      .map(tweet => ({
        text: tweet.text,
        likes: tweet.favorite_count,
        retweets: tweet.retweet_count,
        url: `https://twitter.com/${username}/status/${tweet.id_str}`,
        timestamp: tweet.created_at,
      }))
      .sort((a, b) => b.likes + b.retweets - (a.likes + a.retweets));

    return applySortingAlgorithm(popularTweets);
  } catch (error) {
    console.error('Error fetching popular tweets:', error);
  }
}

// Get OAuth Access Token
function getOAuthAccessToken() {
  oauth.getOAuthRequestToken((error, oauthToken, oauthTokenSecret, results) => {
    if (error) {
      console.error('Error getting OAuth request token:', error);
      return;
    }

    console.log('Please visit the following URL to authorize the application:');
    console.log(`https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Enter the PIN provided by Twitter: ', (pin) => {
      oauth.getOAuthAccessToken(oauthToken, oauthTokenSecret, pin, (error, oauthAccessToken, oauthAccessTokenSecret, results) => {
        if (error) {
          console.error('Error getting OAuth access token:', error);
        } else {
          console.log('OAuth Access Token:', oauthAccessToken);
          console.log('OAuth Access Token Secret:', oauthAccessTokenSecret);

          // Initialize Twit with the access tokens
          twitterClient.config.access_token = oauthAccessToken;
          twitterClient.config.access_token_secret = oauthAccessTokenSecret;

          // Save tokens to .env
          console.log('Authentication successful. You can now use the Twitter API!');
        }
        rl.close();
      });
    });
  });
}

// Define routes for Twitter authentication
app.get('/', (req, res) => {
  res.send('Welcome! Go to /auth/twitter to start Twitter authentication.');
});

app.get('/auth/twitter', (req, res) => {
  oauth.getOAuthRequestToken((error, oauthToken, oauthTokenSecret, results) => {
    if (error) {
      console.error('Error getting OAuth request token:', error); // Log the full error object
      res.send("Error getting OAuth request token: " + JSON.stringify(error)); // Send the full error object as a string
    } else {
      // Redirect the user to Twitter for authorization
      res.redirect(`https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`);
    }
  });
});

// Define route for Twitter callback
app.get('/auth/twitter/callback', (req, res) => {
  const oauthToken = req.query.oauth_token;
  const oauthVerifier = req.query.oauth_verifier;

  oauth.getOAuthAccessToken(oauthToken, null, oauthVerifier, (error, oauthAccessToken, oauthAccessTokenSecret, results) => {
    if (error) {
      console.error('Error getting OAuth access token:', error); // Log the full error object
      res.send("Error getting OAuth access token: " + JSON.stringify(error)); // Send the full error object as a string
    } else {
      // Save the access tokens for later use
      res.send("Twitter authentication successful!");
    }
  });
});

app.listen(port, () => {
  console.log(`OAuth app listening at http://localhost:${port}`);
});

// Weighted scoring function
function calculateWeightedScore(post) {
  return post.likes * 0.5 + post.retweets * 0.3 + post.comments * 0.2;
}

// Time decay scoring function
function calculateDecayScore(post) {
  const currentTime = Date.now();
  const timeDiff = (currentTime - new Date(post.timestamp).getTime()) / 1000; // time difference in seconds
  const decayFactor = Math.exp(-timeDiff / 86400); // decay over 24 hours
  return (post.likes * 0.5 + post.retweets * 0.3 + post.comments * 0.2) * decayFactor;
}

// Merge sort algorithm
function mergeSort(array, compareFn) {
  if (array.length <= 1) return array;

  const middle = Math.floor(array.length / 2);
  const left = array.slice(0, middle);
  const right = array.slice(middle);

  return merge(mergeSort(left, compareFn), mergeSort(right, compareFn), compareFn);
}

function merge(left, right, compareFn) {
  let result = [];
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    if (compareFn(left[leftIndex], right[rightIndex]) <= 0) {
      result.push(left[leftIndex]);
      leftIndex++;
    } else {
      result.push(right[rightIndex]);
      rightIndex++;
    }
  }

  return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
}

// Quick sort algorithm
function quickSort(array, compareFn) {
  if (array.length <= 1) return array;

  const pivot = array[array.length - 1];
  const left = [];
  const right = [];

  for (let i = 0; i < array.length - 1; i++) {
    if (compareFn(array[i], pivot) < 0) {
      left.push(array[i]);
    } else {
      right.push(array[i]);
    }
  }

  return [...quickSort(left, compareFn), pivot, ...quickSort(right, compareFn)];
}

// Apply sorting based on config
function applySortingAlgorithm(tweets) {
  const algorithm = config.defaults.sorting_algorithm;

  switch (algorithm) {
    case 'weighted':
      return mergeSort(tweets, (a, b) => calculateWeightedScore(b) - calculateWeightedScore(a));
    case 'decay':
      return mergeSort(tweets, (a, b) => calculateDecayScore(b) - calculateDecayScore(a));
    case 'merge':
      return mergeSort(tweets, (a, b) => b.likes + b.retweets - (a.likes + a.retweets));
    case 'quick':
      return quickSort(tweets, (a, b) => b.likes + b.retweets - (a.likes + a.retweets));
    default:
      return tweets.sort((a, b) => b.likes + b.retweets - (a.likes + a.retweets));
  }
}

module.exports = { getPopularTweets };
