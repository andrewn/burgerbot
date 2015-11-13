var express = require('express');
var scraperjs = require('scraperjs');
var Pushover = require('node-pushover');
var chalk = require('chalk');

if (!process.env.PUSH_TOKEN || !process.env.PUSH_USERKEY) {
  console.error( chalk.red('Set PUSH_TOKEN and PUSH_USERKEY') );
  process.exit(1);
}

if (!process.env.SCRAPE_INTERVAL_SEC) {
  console.error( chalk.red('Set SCRAPE_INTERVAL_SEC') );
  process.exit(1);
}

var SCRAPE_INTERVAL_MS = 1000 * process.env.SCRAPE_INTERVAL_SEC;

var NOTIFICATION_TIMEOUT_MS = process.env.NOTIFICATION_TIMEOUT_MS ?
  process.env.NOTIFICATION_TIMEOUT_MS * 1000 :
  60 * 5 * 1000;

console.log('SCRAPE_INTERVAL_MS:', SCRAPE_INTERVAL_MS);
console.log('NOTIFICATION_TIMEOUT_MS: ', NOTIFICATION_TIMEOUT_MS);

var push = new Pushover({
    token: process.env.PUSH_TOKEN,
    user: process.env.PUSH_USERKEY,
});

var appointments,
    serviceUrl;

var app = express();

app.get('/', function (req, res) {
  var html = '<html><head><meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0;">' +
  '<style>' +
  'body { font-family: -apple-system; sans-serif; }' +
  'ul { list-style: none; }' +
  'li { height: 2rem; margin: 0; padding: 0; }' +
  '</style>' +
  '<body>' +
    '<h1>Burgerbot</h1>' +
    '<ul>' +
      (
        appointments && appointments.length > 0 ?
          appointments.map(renderItem).join('\n') :
          '<li>:-(</li>'
      ) +
    '</ul>';
  res.send(html);
});

var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  serviceUrl = process.env.APP_URL || 'http://' + host + ':' + port;

  console.log('Example app listening at http://%s:%s', host, port);
});

var url = process.env.URL ||  'https://service.berlin.de/terminvereinbarung/termin/tag.php?termin=1&dienstleister%5B%5D=122210&dienstleister%5B%5D=122217&dienstleister%5B%5D=122219&dienstleister%5B%5D=122227&dienstleister%5B%5D=122231&dienstleister%5B%5D=122238&dienstleister%5B%5D=122243&dienstleister%5B%5D=122252&dienstleister%5B%5D=122260&dienstleister%5B%5D=122262&dienstleister%5B%5D=122254&dienstleister%5B%5D=122271&dienstleister%5B%5D=122273&dienstleister%5B%5D=122277&dienstleister%5B%5D=122280&dienstleister%5B%5D=122282&dienstleister%5B%5D=122284&dienstleister%5B%5D=122291&dienstleister%5B%5D=122285&dienstleister%5B%5D=122286&dienstleister%5B%5D=122296&dienstleister%5B%5D=150230&dienstleister%5B%5D=122301&dienstleister%5B%5D=122297&dienstleister%5B%5D=122294&dienstleister%5B%5D=122312&dienstleister%5B%5D=122314&dienstleister%5B%5D=122304&dienstleister%5B%5D=122311&dienstleister%5B%5D=122309&dienstleister%5B%5D=317869&dienstleister%5B%5D=324433&dienstleister%5B%5D=325341&dienstleister%5B%5D=324434&dienstleister%5B%5D=324435&dienstleister%5B%5D=122281&dienstleister%5B%5D=324414&dienstleister%5B%5D=122283&dienstleister%5B%5D=122279&dienstleister%5B%5D=122276&dienstleister%5B%5D=122274&dienstleister%5B%5D=122267&dienstleister%5B%5D=122246&dienstleister%5B%5D=122251&dienstleister%5B%5D=122257&dienstleister%5B%5D=122208&dienstleister%5B%5D=122226&anliegen%5B%5D=120686&herkunft=%2Fterminvereinbarung%2F';

var table = '.calendar-month-table';
var month = '.month';
var appointment = '.calendar-month-table td a';

scrapeAndNotify();

var lastNotificationTime = Date.now() - NOTIFICATION_TIMEOUT_MS - 1;

console.log('lastNotificationTime: ', lastNotificationTime);

function renderItem(a) {
  return '<li>' +
   '<a href="' + a.url + '">' +
     a.date + ' ' + a.month + ' ' +
     '</a></li>';
}

function notify() {
  var now = Date.now(),
      timeSinceLastNotification = now - lastNotificationTime;

  if (timeSinceLastNotification < NOTIFICATION_TIMEOUT_MS) {
    console.log( chalk.bold('Within notification timeout, not notifying'), timeSinceLastNotification, NOTIFICATION_TIMEOUT_MS);
    return;
  }

  console.log( chalk.bold('Outside notification time'), timeSinceLastNotification, NOTIFICATION_TIMEOUT_MS);

  push.send(
    'Appointments!',
    serviceUrl,
    function (err) {
      if (err) {
        console.error( chalk.red('Error sending notification') );
        console.error(err);
        console.error(err.stack);
      } else {
        console.log( chalk.green('Successful notification') );
      }
    }
  );

  lastNotificationTime = Date.now();
}

function scrapeAndNotify() {
  console.log('\nscrapeAndNotify');
  scrape()
    .then(function (appts) {
      console.log(JSON.stringify(appts));
      appointments = appts;
      if (appointments.length > 0) {
        console.log( chalk.bold.green('Appointments') );
        notify(appointments);
      } else {
        console.log( chalk.bold.blue('Nothing found') );
      }
      schedule(scrapeAndNotify);
    });
}

function scrape() {
  console.log('scrape');
  return scraperjs.StaticScraper.create(url)
    .scrape(function($) {
      return $(appointment).map(function() {
        return {
          month: $(this).closest(table).find(month).text().trim(),
          date: $(this).text(),
          url: $(this).attr('href')
        };
      }).get();
    });
}

function schedule(fn) {
  console.log('schedule');
  setTimeout(fn, SCRAPE_INTERVAL_MS);
}
