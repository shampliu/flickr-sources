phantom.casperPath = 'node_modules/casperjs';
phantom.injectJs('/node_modules/casperjs/bin/bootstrap.js');

var system = require('system');
var casper = require('casper').create({
  verbose: true
});

casper.on("remote.message", function (msg) {
    console.log(msg);
});

system.stderr.write('Email: ');
var username = system.stdin.readLine();
console.log('username =', username)
system.stderr.write('Password: ');
var password = system.stdin.readLine();

var loginURL = "";

casper.start('https://www.flickr.com/signin')

casper.then(function() {
  console.log('On login page');

  // loginURL = this.getCurrentURL();
  //
  this.evaluate(function (user) {
    console.log('Filling in username')
    var usernameInput = document.getElementById("login-username");
    usernameInput.value = user;
    document.getElementById('login-signin').click();
  }, username)
}).wait(5000);

// casper.evaluate(function(user, pass) {
//   var usernameInput = document.getElementById("login-username");
//   usernameInput.value = user;
//   document.getElementById('login-signin').click();
// }, username, password);

casper.then(function() {
  this.capture('before1.png')
  // this.click('#login-signin', 10, 10);
  // console.log('Next clicked');
});
// casper.then(function() {
//   this.capture('before2.png')
//   this.click('#login-signin', 10, 10);
//   console.log('Next clicked');
// });
// casper.then(function() {
//   this.capture('before3.png')
//   this.click('#login-signin',"50%","50%");
//   console.log('Next clicked');
// });

casper.then(function() {
  this.capture('password.png');

  this.evaluate(function() {
    var passwordInput = document.getElementById("login-passwd");
    passwordInput.value = password
  });
});

casper.then(function() {
  this.click('#login-signin');
  console.log('Next clicked');
});
casper.then(function() {
  this.click('#login-signin', 10, 10);
  console.log('Next clicked');
});
casper.then(function() {
  this.click('#login-signin',"50%","50%");
  console.log('Next clicked');
});

casper.thenOpen('https://www.flickr.com/photos/spaceabstract/stats', function() {
  this.capture('stats.png');
  console.log('On stats page');
});

casper.run();
