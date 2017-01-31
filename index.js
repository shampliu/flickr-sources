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
system.stderr.write('User ID: ');
var user_id = system.stdin.readLine();

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

var res = "WORKED??";

casper.thenOpen('https://www.flickr.com/photos/' + user_id + '/stats').wait(5000).then(function() {
  this.capture('stats.png');

  res = this.evaluate(function() {
    var stats = {
      "Flickr" : {
        "total" : 0

      },
      "Other" : {
        "total" : 0,
        "sources" : {}

      }
    }

    console.log('checking 1')

    var rows = Array.prototype.slice.apply(document.querySelectorAll('.sources-breakdown-list > .referrer-rows > .referrer-row'));
    rows.map(function(row) {
      console.log('checking 2')
      console.log(rows.length);

      var header = row.querySelector('.header').childNodes;
      var views = parseInt(header[1].innerHTML);

      console.log(views)

      if (views > 0) {
        console.log("Views is greater than 0")
        var type = header[0].innerHTML;


        if (type.indexOf('flickr') !== -1) {
          stats["Flickr"].total += views;
        } else if (type.indexOf('other') !== -1) {
          stats["Other"].total += views;

          var other_sources = Array.prototype.slice.apply(row.querySelector('.referrer-row-breakdown').childNodes);
          other_sources.map(function(source) {
            var url = source.attributes.href;
            var views = parseInt(source.querySelector('.header').childNodes[1].innerHTML)
            if (stats["Other"]["sources"].hasOwnProperty(url)) {
              stats["Other"]["sources"][url] += views;
            } else {
              stats["Other"]["sources"][url] = views;
            }
          })



        }
      }

    });

    console.log(stats["Flickr"]["total"])
    console.log(stats["Other"]["total"])

    return JSON.stringify(stats);
  })

}).wait(5000);

casper.then(function() {
  console.log('finished stats');
  console.log(res);
}).wait(5000)

casper.run();
