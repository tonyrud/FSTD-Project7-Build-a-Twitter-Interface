'use strict';
const express = require('express'),
  app = express(),
  port = 8080,
  Twitter = require('twit'),
  config = require('./config.js'),
  twitter = new Twitter(config),
  path = require('path'),
  moment = require('moment'),
  displayCount = 5;

//create static serving of files
app.use('/static', express.static(path.join(__dirname, '..\\public')));

//setup pug templates
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');


const stream = twitter.stream('statuses/user_timeline');

stream.on('tweet', function (tweet) {
  console.log(tweet)
})

function getTwitterData(next) {

  //object to hold all of profile API data
  const templateData = {
    tweets: [],
    profile: [],
    following: [],
    messages: []
  }

  //get friends
  twitter.get('friends/list', {
    screen_name: config.screen_name,
    count: displayCount
  }, function (err, data, response) {
    const followers = data.users;

    followers.forEach(follower => {
      templateData.following.push({
        follower_name: follower.name,
        follower_screenName: follower.screen_name,
        follower_img: follower.profile_image_url
      });
    });
  });

  //get messages
  twitter.get('direct_messages', {
    screen_name: config.screen_name,
    count: 5
  }, function (err, data, response) {
    if (!err && data) {
      data.forEach(msg => {
        templateData.messages.push({
          message_text: msg.text,
          message_sender_name: msg.sender_screen_name,
          message_user_name: msg.recipient_screen_name,
          message_photo: msg.sender.profile_image_url,
          message_time: msg.created_at.slice(0, 10)
        })
      })
    } else {
      next(err)
    }
  });

  //get tweets
  twitter.get('statuses/user_timeline', {
    screen_name: config.screen_name,
    count: displayCount
  }, function (err, data, response) {
    if (!err && data) {
      for (let i in data) {
        //destructure the basic data
        const {
          text,
          favorite_count,
          retweet_count,
        } = data[i];
        //create posts array for pug template
        templateData.tweets.push({
          content: text,
          favCount: favorite_count,
          retweetCount: retweet_count,
          userName: data[i].user.name,
          screenName: data[i].user.screen_name,
          profilePic: data[i].user.profile_image_url,
          postTime: data[i].created_at.slice(0, 10)
        })
      }
      //profile info
      templateData.profile.push({
        banner: data[0].user.profile_banner_url,
        screenName: data[0].user.screen_name,
        profileImg: data[0].user.profile_image_url,
        following: data[0].user.friends_count
      })
      //pass info arrays into next function call
      next(err, templateData);
    } else {
      next(err)
    }
  })
}




app.get('/', function (req, res) {
  //make API call
  getTwitterData(function (err, data) {
    //check if any errors
    if (!err && data) {
      //pass data parameter into timeline object for pug rendering
      res.render('index', {
        timeline: data
      });
    } else {
      res.send('err.message')
    }
  });
});

app.listen(port, () => {
  console.log(`server started on port: ${port}`);
});