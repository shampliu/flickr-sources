phantom.casperPath = 'node_modules/casperjs';
phantom.injectJs('/node_modules/casperjs/bin/bootstrap.js');

var system = require('system');
var casper = require('casper').create();

// for console log from inside evaluate
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
  this.evaluate(function(pass) {
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

var res = "Could not fetch stats";

casper.thenOpen('https://www.flickr.com/photos/' + user_id + '/stats').wait(5000).then(function() {
  this.capture('stats.png');

  res = this.evaluate(function() {

    function scrapeCurrentDay(stats) {
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
      })
    }

    function triggerMouseEvent (node, eventType) {
      var clickEvent = document.createEvent ('MouseEvents');
      clickEvent.initEvent (eventType, true, true);
      node.dispatchEvent (clickEvent);
    }

    // get array of days
    var button = document.querySelector('.source-breakdown-misc-wrapper > .half-source-breakdown.section > .section-title > .date-picker');
    triggerMouseEvent(button, 'click')
    var calendar_rows = Array.prototype.slice.apply(document.querySelectorAll('.pika-lendar > table > tbody > tr'))
    var days = [];
    console.log("calendar_rows size is", calendar_rows.length)
    calendar_rows.map(function(row) {
      var tds = Array.prototype.slice.apply(row.childNodes)
      tds.map(function(day) { days.push(day) })
    });
    console.log("days size is", days.length);

    for (var i = days.length - 1; i >= 0; i--) {
      if (days[i].className == "is-disabled" || days[i].className ==)
    }

    var current_day;


    // var current_day = days.find(function(d) {
      // return Array.prototype.slice.apply(d.classList).indexOf('is-selected') !== -1
    // })
    // var ind = days.indexOf(current_day);

    var stats = {
      "Flickr" : {
        "total" : 0

      },
      "Other" : {
        "total" : 0,
        "sources" : {}

      }
    }

    // get previous month button
    var prev;
    // while (previousbutton is not class of disabled)
    //   if not currentmonth
    //     click last day in month
    //   while (current day is not disabled)
    //     scrapeCurrentDay
    //     go to previous day
    //   button = new prev button

    scrapeCurrentDay(stats)




    return JSON.stringify(stats);
  })

  // this.capture('stats2.png')

}).wait(5000);

casper.then(function() {
  console.log('finished stats');
  console.log(res);
}).wait(5000)

casper.run();
