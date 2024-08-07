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

/*
	define sorting algorithms
	algorithms used: weighted scoring, time decay, merge sort, quicksort
*/

// weighted scoring
function calculateWeightedSCore(post) {
	return post.likes * 0.5 + post.retweets * 0.3 + post.comments * 0.2;
}

// time decay
function calculateDecayScore(post) {
	const currentTime = Date.now();
	const timeDiff = (currentTime - new Date(post.timestamp).getTime()) / 1000; // time difference in seconds
	const decayFactor = Math.exp(-timeDiff / 86400); // decay over 24 hoursp
	return (post.likes * 0.5 + post.retweets * 0.3 + post.comments * 0.2) * decayFactor;
}

// merge sorting
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

// apply sorting based on config
let sortedPosts;
switch (config.sortingAlgorithm) {
    case 'weightedScore':
        sortedPosts = posts.sort((a, b) => calculateWeightedScore(b) - calculateWeightedScore(a));
        break;
    case 'timeDecay':
        sortedPosts = posts.sort((a, b) => calculateDecayScore(b) - calculateDecayScore(a));
        break;
    case 'mergeSort':
        sortedPosts = mergeSort(posts, (a, b) => calculateWeightedScore(b) - calculateWeightedScore(a));
        break;
    case 'quickSort':
        sortedPosts = quickSort(posts, (a, b) => calculateWeightedScore(b) - calculateWeightedScore(a));
        break;
    default:
        console.error('Unknown sorting algorithm specified in config.');
        process.exit(1);
}

console.log('Sorted Tweets:', sortedPosts);