phantom.casperPath = 'node_modules/casperjs';
phantom.injectJs('/node_modules/casperjs/bin/bootstrap.js');

var system = require('system');
var casper = require('casper').create();

// For console.log statements from inside evaluate()
casper.on("remote.message", function (msg) {
    console.log(msg);
});

// Print out all the error messages from the web page
casper.on("page.error", function(msg, trace) {
    casper.echo("[Remote Page Error] " + msg, "ERROR");
    casper.echo("[Remote Error trace] " + JSON.stringify(trace, undefined, 4));
});

// Globals

system.stderr.write('Email: ');
var username = system.stdin.readLine();
system.stderr.write('Password: ');
var password = system.stdin.readLine();
system.stderr.write('User ID: ');
var user_id = system.stdin.readLine();

// var res; // JSON string
var res_arr = [];

var stats = {
  "Flickr" : {
    "total" : 0

  },
  "Other" : {
    "total" : 0,
    "sources" : {}

  }
}

function triggerMouseEvent (node, eventType, document) {
  var clickEvent = document.createEvent ('MouseEvents');
  clickEvent.initEvent (eventType, true, true);
  node.dispatchEvent (clickEvent);
}

function scrapeCurrentDay(stats, document) {
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
}

function getDays(document, triggerMouseEvent) {
  var date_button = document.querySelector('.source-breakdown-misc-wrapper > .half-source-breakdown.section > .section-title > .date-picker');

  // Click the date picker first
  triggerMouseEvent(date_button, 'click', document);

  var calendar_rows = Array.prototype.slice.apply(document.querySelectorAll('.pika-lendar > table > tbody > tr'))
  var days_buttons = [];
  calendar_rows.map(function(row) {
    var tds = Array.prototype.slice.apply(row.childNodes)
    tds.map(function(day) {
      if (day.className !== "is-disabled" && day.className !== "is-empty") {
        days_buttons.push(day.childNodes[0]);
      }
    })
  });

  return days_buttons;
}

function clickDay(ind, triggerMouseEvent, getDays, document) {
  var days_buttons = getDays(document, triggerMouseEvent)

  console.log("Clicking day index # " + ind + " out of " + days_buttons.length + " days");
  days_buttons[ind].focus();
  triggerMouseEvent(days_buttons[ind], 'mousedown', document)
}

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
  this.evaluate(function(pass) {
    var passwordInput = document.getElementById("login-passwd");
    passwordInput.value = pass;
    document.getElementById('login-signin').click();
  }, password)
// }).waitForUrl(/flickr/);
}).wait(4000)

casper.thenOpen('https://www.flickr.com/photos/' + user_id + '/stats').wait(3000)

casper.then(function() {
  this.evaluate(function(triggerMouseEvent, getDays, clickDay) {
    var date_button = document.querySelector('.source-breakdown-misc-wrapper > .half-source-breakdown.section > .section-title > .date-picker');
    triggerMouseEvent(date_button, 'click', document)

    var prev_button = document.querySelector('button.pika-prev');
    // //
    // // if we can't go back to the previous month anymore
    // if (prev_button == null) {
    //   console.log('null previous button')
    //   return;
    // }
    prev_button.focus();
    triggerMouseEvent(prev_button, 'mousedown', document); // goes to previous month
    clickDay(0, triggerMouseEvent, getDays, document)
  }, triggerMouseEvent, getDays, clickDay)
}).wait(3000)

casper.then(function() {
  var days_in_month = this.evaluate(function(getDays, triggerMouseEvent) {
    return getDays(document, triggerMouseEvent).length;
  }, getDays, triggerMouseEvent)

  this.echo("Number of days in month is " + days_in_month);

  var i = 0;
  var that = this;
  this.repeat(days_in_month, function() {
    that.then(function() {
      console.log('Clicking day index # ' + i);

      that.evaluate(function(clickDay, getDays, triggerMouseEvent, i) {
        clickDay(i, triggerMouseEvent, getDays, document);

      }, clickDay, getDays, triggerMouseEvent, i)
    }).wait(3000);

    casper.then(function() {
      var res = this.evaluate(function(stats, triggerMouseEvent, scrapeCurrentDay) {
        scrapeCurrentDay(stats, document);
        return JSON.stringify(stats);
      }, stats, triggerMouseEvent, scrapeCurrentDay);

      res_arr.push(res);
      this.echo(res);
    }).wait(3000);

    i++;
  })
}).wait(3000);

casper.then(function() {
  this.capture('check.png')
  this.echo(res_arr);
  // this.echo(JSON.stringify(stats)); // doesn't work
})

casper.run();
