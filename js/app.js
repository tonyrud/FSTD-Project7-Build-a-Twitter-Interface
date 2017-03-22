'use strict'
const express = require('express')
const app = express()
const server = require('http').createServer(app)
const port = 8080
const config = require('./config.js')
const Twitter = require('twit')
const twitter = new Twitter(config)
const path = require('path')
const bodyParser = require('body-parser')
const displayCount = 5

// create static serving of files
app.use(express.static('public'))

// setup pug templates
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, '/views'))

app.use(bodyParser.urlencoded({
  extended: true
}))

  // get friends
const getFriends = new Promise((resolve, reject) => {
  twitter.get('friends/list', {
    screen_name: config.screen_name,
    count: displayCount
  }, function (err, data, next) {
    if (!err && data) {
      const followers = data.users.map(follower => {
        let followObj = {}
        followObj.follower_name = follower.name
        followObj.follower_screenName = follower.screen_name
        followObj.follower_img = follower.profile_image_url
        return followObj
      })
      resolve({followers: followers})
    } else {
      next(err)
    }
  })
})

const getMessages = new Promise((resolve, reject) => {
  twitter.get('direct_messages', {
    screen_name: config.screen_name,
    count: 5
  }, function (err, data, next) {
    const msgObj = []
    if (!err && data) {
      data.forEach(msg => {
        msgObj.push({
          message_text: msg.text,
          message_sender_name: msg.sender_screen_name,
          message_user_name: msg.recipient_screen_name,
          message_photo: msg.sender.profile_image_url,
          message_time: msg.created_at.slice(0, 10)
        })
      })
      resolve({messages: msgObj})
    } else {
      next(err)
    }
  })
})

  // // get tweets
const getTweets = new Promise((resolve, reject) => {
  twitter.get('statuses/user_timeline', {
    screen_name: config.screen_name,
    count: displayCount
  }, function (err, data, next) {
    let tweetObj = []
    let profileObj = []
    if (!err && data) {
      for (let i in data) {
        // create posts array for pug template
        tweetObj.push({
          content: data[i].text,
          favCount: data[i].favorite_count,
          retweetCount: data[i].retweet_count,
          userName: data[i].user.name,
          screenName: data[i].user.screen_name,
          profilePic: data[i].user.profile_image_url,
          postTime: data[i].created_at.slice(0, 10)
        })
      }
     // profile info
      profileObj.push({
        banner: data[0].user.profile_banner_url,
        screenName: data[0].user.screen_name,
        profileImg: data[0].user.profile_image_url,
        following: data[0].user.friends_count
      })
      resolve({tweets: tweetObj, profile: profileObj})
    } else {
      next(err)
    }
  })
})

app.get('/', function (req, res) {
  // make API promise calls and setup data
  Promise.all([getFriends, getTweets, getMessages])
  .then(responses => {
    res.render('index', {
      followers: responses[0].followers,
      profile: responses[1].profile,
      tweets: responses[1].tweets,
      messages: responses[2].messages
    })
  })
  .catch(error => { res.render('error', {error: error}) })
})

// post tweet
app.post('/', function (req, res) {
  twitter.post('statuses/update', {
    status: req.body.postTweet
  }, function (err) {
    if (!err) {
      // redirect after posted
      res.redirect('/')
    }
  })
})

server.listen(port, () => {
  console.log(`server started on port: ${port}`)
})
