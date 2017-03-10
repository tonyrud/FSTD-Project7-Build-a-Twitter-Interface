// import config from ('./config.js')

const express = require('express'),
  app = express(),
  port = 8080,
  Twitter = require('twit'),
  config = require('./config.js'),
  twitter = new Twitter(config),
  path = require('path');

//create static serving of files
app.use('/static', express.static(path.join(__dirname, '..\\public')));


function getTimeline(next) {

  twitter.get('friends/ids', {
    screen_name: 'tonrudny',
    count: 5
  }, function (err, data, response) {
    if (!err && data)
      console.log(data);
  })
}
// T.get('followers/ids', { screen_name: 'tonrudny' },  function (err, data, response) {
//   console.log(data)
// })

// stream.on('tweet', function (tweet) {
//   console.log(tweet)
// })



//setup pug templates
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

app.get('/', function (req, res) {

  getTimeline();

  // res.render('index', {
  //   title: 'Twitter Client',
  //   message: 'Hello there!',
  //   key: config.access_token
  // })
})

app.listen(port, () => {
  console.log(`server started on port: ${port}`);
});