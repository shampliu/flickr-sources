phantom.casperPath = 'node_modules/casperjs';
phantom.injectJs('/node_modules/casperjs/bin/bootstrap.js');

var system = require('system');
var casper = require('casper').create();

// for console log from inside evaluate
casper.on("remote.message", function (msg) {
    console.log(msg);
});

// Print out all the error messages from the web page
casper.on("page.error", function(msg, trace) {
    casper.echo("[Remote Page Error] " + msg, "ERROR");
    casper.echo("[Remote Error trace] " + JSON.stringify(trace, undefined, 4));
});

system.stderr.write('Email: ');
var username = system.stdin.readLine();
system.stderr.write('Password: ');
var password = system.stdin.readLine();
system.stderr.write('User ID: ');
var user_id = system.stdin.readLine();

casper.start('https://www.flickr.com/signin')

casper.then(function() {
  this.evaluate(function (user) {
    var usernameInput = document.getElementById("login-username");
    usernameInput.value = user;
    document.getElementById('login-signin').click();
  }, username)
// }).waitForSelector("#mbr-login-greeting");
}).wait(4000);

casper.then(function() {
  this.capture('password-input.png')
  this.evaluate(function(pass) {
    var passwordInput = document.getElementById("login-passwd");
    passwordInput.value = pass;
    document.getElementById('login-signin').click();
  }, password)
// }).waitForUrl(/flickr/);
}).wait(4000)

casper.then(function() {
  this.capture('main.png')
})

var res = "Could not fetch stats";

var stats = {
  "Flickr" : {
    "total" : 0

  },
  "Other" : {
    "total" : 0,
    "sources" : {}

  }
}

casper.thenOpen('https://www.flickr.com/photos/' + user_id + '/stats').wait(4000).then(function() {
  this.capture('stats.png');
});

function triggerMouseEvent (node, eventType, document) {
  var clickEvent = document.createEvent ('MouseEvents');
  clickEvent.initEvent (eventType, true, true);
  node.dispatchEvent (clickEvent);
}

casper.then(function() {
  this.capture('1.png')
  this.evaluate(function(triggerMouseEvent) {
    var date_button = document.querySelector('.source-breakdown-misc-wrapper > .half-source-breakdown.section > .section-title > .date-picker');
    triggerMouseEvent(date_button, 'click', document)

    var prev_button = document.querySelector('button.pika-prev');
    console.log(prev_button.innerHTML);
    // //
    // // if we can't go back to the previous month anymore
    // if (prev_button == null) {
    //   console.log('null previous button')
    //   return;
    // }
    prev_button.focus();
    triggerMouseEvent(prev_button, 'mousedown', document); // goes to previous month
  }, triggerMouseEvent)
}).wait(4000)

casper.then(function() {
  this.capture('2.png')
  res = this.evaluate(function(stats, triggerMouseEvent) {
    var block;

    function scrapeCurrentDay(stats) {
      var rows = Array.prototype.slice.apply(document.querySelectorAll('.sources-breakdown-list > .referrer-rows > .referrer-row'));
      rows.map(function(row) {
        var header = row.querySelector('.header').childNodes;
        var views = parseInt(header[1].innerHTML);

        console.log(views)

        if (views > 0) {
          var type = header[0].innerHTML;
          if (type.indexOf('flickr') !== -1) {
            stats["Flickr"].total += views;
          } else if (type.indexOf('other') !== -1) {
            stats["Other"].total += views;

            var other_sources = Array.prototype.slice.apply(row.querySelector('.referrer-row-breakdown').childNodes);
            other_sources.map(function(source) {
              var url = source.attributes.href || "No referrer";
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

      block = false;
    }


    // var button = document.querySelector('.source-breakdown-misc-wrapper > .half-source-breakdown.section > .section-title > .date-picker');

    console.log('1');
    console.log(JSON.stringify(stats));

    var prev_button = null; // previous month button

    // while(true) {
      console.log('INSIDE WHILE');
      var date_button = document.querySelector('.source-breakdown-misc-wrapper > .half-source-breakdown.section > .section-title > .date-picker');
      triggerMouseEvent(date_button, 'click', document);
      console.log('TRIGGERED BUTTON');

      // casper.then(function(stats) {
        var calendar_rows = Array.prototype.slice.apply(document.querySelectorAll('.pika-lendar > table > tbody > tr'))
        var days_buttons = [];
        console.log("calendar_rows size is", calendar_rows.length)
        calendar_rows.map(function(row) {
          var tds = Array.prototype.slice.apply(row.childNodes)
          tds.map(function(day) {
            if (day.className !== "is-disabled" && day.className !== "is-empty") {
              days_buttons.push(day.childNodes[0]);
            }
          })
        });
        console.log("days size is", days_buttons.length);


        for (var i = 0; i < days_buttons.length; i++) {
          block = true;

          console.log("scraping day button #", i+1)
      //
      //     casper.then(function() {
          triggerMouseEvent(date_button, 'click', document);
      //     });
      //
      //     casper.then(function(days_buttons, i) {
          days_buttons[i].focus();
          triggerMouseEvent(days_buttons[i], 'mousedown', document);
      //     }, days_buttons, i)
      //
          setTimeout(scrapeCurrentDay(stats, block), 2000);
          while(block) { }

        }
      // }, stats)

      // casper.then(function() {
      // date_button = document.querySelector('.source-breakdown-misc-wrapper > .half-source-breakdown.section > .section-title > .date-picker');
      // console.log(date_button.innerHTML);
      // triggerMouseEvent(date_button, 'click', document)
      // // })
      // prev_button = document.querySelector('button.pika-prev');
      // console.log(prev_button.innerHTML);
      // //
      // // if we can't go back to the previous month anymore
      // if (prev_button == null) {
      //   console.log('null previous button')
      //   return;
      // }
      // prev_button.focus();
      // triggerMouseEvent(prev_button, 'mousedown', document); // goes to previous month

      // block = true;
      // setTimeout( function() {
      //   block = false;
      // }, 5000);
      // while(block) { }

    // }
    console.log('2');
    console.log(JSON.stringify(stats));

    return JSON.stringify(stats);
  }, stats, triggerMouseEvent)

}).wait(4000);

casper.then(function() {
  this.capture('check.png')
  this.echo('3 finished stats');
  this.echo(res);
  this.echo(JSON.stringify(stats)); // doesn't work
}).wait(5000)

casper.run();
