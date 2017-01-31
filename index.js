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
system.stderr.write('Password: ');
var password = system.stdin.readLine();

casper.start('https://www.flickr.com/signin')

casper.then(function() {
  console.log('On login page');

  this.evaluate(function (user) {
    console.log('Filling in username')
    var usernameInput = document.getElementById("login-username");
    usernameInput.value = user;
    document.getElementById('login-signin').click();
  }, username)
// }).waitForSelector("#mbr-login-greeting");
}).wait(5000);

// casper.evaluate(function(user, pass) {
//   var usernameInput = document.getElementById("login-username");
//   usernameInput.value = user;
//   document.getElementById('login-signin').click();
// }, username, password);

casper.then(function() {
  this.capture('password-input.png')
  this.evaluate(function (pass) {
    console.log('Filling in password')
    var passwordInput = document.getElementById("login-passwd");
    passwordInput.value = pass;
    document.getElementById('login-signin').click();
  }, password)
// }).waitForUrl(/flickr/);
}).wait(5000)

casper.then(function() {
  this.capture('main.png')
})

casper.thenOpen('https://www.flickr.com/photos/spaceabstract/stats', function() {
  this.capture('stats.png');
  console.log('On stats page');
});

casper.run();
