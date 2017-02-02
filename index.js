phantom.casperPath = 'node_modules/casperjs';
phantom.injectJs('/node_modules/casperjs/bin/bootstrap.js');

var fs = require('fs');
var system = require('system');
var casper = require('casper').create();

// TODO add Google Chrome browser agent

// Global Configs
system.stderr.write('Email: ');
var USERNAME = system.stdin.readLine();
system.stderr.write('Password: ');
var PASSWORD = system.stdin.readLine();
system.stderr.write('User ID: ');
var USER_ID = system.stdin.readLine();

var DEBUG_MODE = true;
var INFO_MODE = true;
var DURATION = 12; // months
// TODO add options for time period of scrape (number of days?)

if (INFO_MODE) {
  // For console.log statements from inside evaluate()
  casper.on("remote.message", function (msg) {
      console.log(msg);
  });
}

if (DEBUG_MODE) {
  // Print out all the error messages from the web page
  casper.on("page.error", function(msg, trace) {
    casper.echo("[Remote Page Error] " + msg, "ERROR");
    casper.echo("[Remote Error trace] " + JSON.stringify(trace, undefined, 4));
  });
}

// Runtime Globals
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

// TODO take out stats from args
function scrapeCurrentDay(stats, document) {
  var rows = Array.prototype.slice.apply(document.querySelectorAll('.sources-breakdown-list > .referrer-rows > .referrer-row'));
  rows.map(function(row) {
    var header = row.querySelector('.header').childNodes;
    var views = parseInt(header[1].innerHTML);

    if (views > 0) {
      var type = header[0].innerHTML;
      if (type.indexOf('flickr') !== -1) {
        stats["Flickr"].total += views;
      } else if (type.indexOf('other') !== -1) {
        stats["Other"].total += views;

        var other_sources = Array.prototype.slice.apply(row.querySelector('.referrer-row-breakdown').childNodes);
        other_sources.map(function(source) {
          var url = source.href || "No referrer";
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

  console.log("Retrieving stats for " + "January" + " " + days_buttons[ind].innerHTML); // TODO support current month
  days_buttons[ind].focus();
  triggerMouseEvent(days_buttons[ind], 'mousedown', document)
}

casper.start('https://www.flickr.com/signin')

casper.then(function() {
  this.evaluate(function (user) {
    var usernameInput = document.getElementById("login-username");
    usernameInput.value = user;
    document.getElementById('login-signin').click();
  }, USERNAME)
}).waitFor(function() {
  return this.evaluate(function() {
    return document.getElementById("login-passwd") != null;
  });
})
// }).wait(4000);

casper.then(function() {
  this.evaluate(function(pass) {
    var passwordInput = document.getElementById("login-passwd");
    passwordInput.value = pass;
    document.getElementById('login-signin').click();
  }, PASSWORD)
// }).waitForUrl(/^https://flickr.com/);
}).wait(3000)

casper.thenOpen('https://www.flickr.com/photos/' + USER_ID + '/stats').wait(3000)

var done = false;
casper.repeat(DURATION, function() {
  if (done) {
    return;
  }

  casper.then(function() {
    var days_in_month = this.evaluate(function(getDays, triggerMouseEvent) {
      return getDays(document, triggerMouseEvent).length;
    }, getDays, triggerMouseEvent)

    var i = 0;
    var that = this;
    this.repeat(days_in_month, function() {
      that.then(function() {
        that.evaluate(function(clickDay, getDays, triggerMouseEvent, i) {
          clickDay(i, triggerMouseEvent, getDays, document);
        }, clickDay, getDays, triggerMouseEvent, i)
      }).wait(3000);

      that.then(function() {
        var res = this.evaluate(function(stats, triggerMouseEvent, scrapeCurrentDay) {
          scrapeCurrentDay(stats, document);
          return JSON.stringify(stats);
        }, stats, triggerMouseEvent, scrapeCurrentDay);

        res_arr.push(res);
        this.echo(res);
      }).wait(2000);

      that.then(function() {
        i++;
      });
    })
  }).wait(3000);

  casper.then(function() {
    done = this.evaluate(function(triggerMouseEvent, getDays, clickDay) {
      var date_button = document.querySelector('.source-breakdown-misc-wrapper > .half-source-breakdown.section > .section-title > .date-picker');
      triggerMouseEvent(date_button, 'click', document)

      var prev_button = document.querySelector('button.pika-prev');

      if (prev_button.className.indexOf("is-disabled") != -1) {
        console.log('Last month')
        return true;
      }
      prev_button.focus();
      triggerMouseEvent(prev_button, 'mousedown', document); // goes to previous month
      clickDay(0, triggerMouseEvent, getDays, document)
      return false;
    }, triggerMouseEvent, getDays, clickDay)
  }).wait(3000)
})

// Format the results and write to file
casper.then(function() {
  var parsed = JSON.parse('[' + res_arr + ']')

  // List sources of first object
  for (var key in parsed[0]["Other"]["sources"]) {
    console.log('Adding source:', key)
  }

  // Reduce array of objects to one object
  var result = parsed.reduce(function(a, b) {
    a["Flickr"].total += b["Flickr"].total;
    a["Other"].total += b["Other"].total;

    if (b["Other"].total > 0) {
      for (var key in b["Other"].sources) {
        if (a["Other"]["sources"][key] != undefined) {
          a["Other"]["sources"][key] = a["Other"]["sources"][key] + b["Other"].sources[key];
        } else {
          console.log('Adding source:', key)
          a["Other"]["sources"][key] = b["Other"].sources[key];
        }
      }
    }
    return a;
  })

  this.echo(JSON.stringify(result));

  // Write results to JSON file
  var today = new Date();
  var month = today.getMonth() + 1;
  var day = today.getDate();
  var year = today.getFullYear();
  var filename = "data-" + year + "-" + month + "-" + day+".json";
  var filepath = fs.pathJoin(fs.workingDirectory, filename);

  fs.write(filepath, JSON.stringify(result, null, 2), 'w');
});

casper.run();
