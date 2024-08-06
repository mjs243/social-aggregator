// twitter_api.js
const Twit = require('twit');
const config = require('./config.json');

const twitterClient = new Twit(config.twitter);

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
				url: `https://twitter.com/${username}status/${tweet.id_str}`,
			}))
			.sort((a, b) => b.likes + b.retweets - (a.likes + a.retweets));
		return popularTweets;
	} catch (error) {
		console.error('Error fetching popular tweets:', error);
	}
}
