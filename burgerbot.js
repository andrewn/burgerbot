var express = require('express');
var scraperjs = require('scraperjs');
var Pushover = require('node-pushover');

if (!process.env.PUSH_TOKEN || !process.env.PUSH_USERKEY) {
  console.error('Set PUSH_TOKEN and PUSH_USERKEY');
  process.exit(1);
}

if (!process.env.SCRAPE_INTERVAL_SEC) {
  console.error('Set SCRAPE_INTERVAL_SEC');
  process.exit(1);
}

var SCRAPE_INTERVAL_MS = 1000 * process.env.SCRAPE_INTERVAL_SEC;

var push = new Pushover({
    token: process.env.PUSH_TOKEN,
    user: process.env.PUSH_USERKEY,
});

var appointments,
    serviceUrl;

var app = express();

app.get('/', function (req, res) {
  var html = '<h1>Burgerbot</h1>' +
    '<ul>' +
      (
        appointments && appointments.length > 0 ?
          appointments.map(html).join('\n') :
          '<li>:-(</li>'
      ) +
    '</ul>';
  res.send(html);
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  serviceUrl = 'http://' + host + ':' + port;

  console.log('Example app listening at http://%s:%s', host, port);
});

var url = 'http://www.kimonolabs.com/load?url=https%3A%2F%2Fservice.berlin.de%2Fterminvereinbarung%2Ftermin%2Ftag.php%3Ftermin%3D1%26dienstleister%255B%255D%3D122210%26dienstleister%255B%255D%3D122217%26dienstleister%255B%255D%3D122219%26dienstleister%255B%255D%3D122227%26dienstleister%255B%255D%3D122231%26dienstleister%255B%255D%3D122238%26dienstleister%255B%255D%3D122243%26dienstleister%255B%255D%3D122252%26dienstleister%255B%255D%3D122260%26dienstleister%255B%255D%3D122262%26dienstleister%255B%255D%3D122254%26dienstleister%255B%255D%3D122271%26dienstleister%255B%255D%3D122273%26dienstleister%255B%255D%3D122277%26dienstleister%255B%255D%3D122280%26dienstleister%255B%255D%3D122282%26dienstleister%255B%255D%3D122284%26dienstleister%255B%255D%3D122291%26dienstleister%255B%255D%3D122285%26dienstleister%255B%255D%3D122286%26dienstleister%255B%255D%3D122296%26dienstleister%255B%255D%3D150230%26dienstleister%255B%255D%3D122301%26dienstleister%255B%255D%3D122297%26dienstleister%255B%255D%3D122294%26dienstleister%255B%255D%3D122312%26dienstleister%255B%255D%3D122314%26dienstleister%255B%255D%3D122304%26dienstleister%255B%255D%3D122311%26dienstleister%255B%255D%3D122309%26dienstleister%255B%255D%3D317869%26dienstleister%255B%255D%3D324433%26dienstleister%255B%255D%3D325341%26dienstleister%255B%255D%3D324434%26dienstleister%255B%255D%3D324435%26dienstleister%255B%255D%3D122281%26dienstleister%255B%255D%3D324414%26dienstleister%255B%255D%3D122283%26dienstleister%255B%255D%3D122279%26dienstleister%255B%255D%3D122276%26dienstleister%255B%255D%3D122274%26dienstleister%255B%255D%3D122267%26dienstleister%255B%255D%3D122246%26dienstleister%255B%255D%3D122251%26dienstleister%255B%255D%3D122257%26dienstleister%255B%255D%3D122208%26dienstleister%255B%255D%3D122226%26anliegen%255B%255D%3D120686%26herkunft%3D%252Fterminvereinbarung%252F';

var table = '.calendar-month-table';
var month = '.month';
var appointment = '.calendar-month-table td a';

scrapeAndNotify();

function html(a) {
  return '<li>' +
   '<a href="' + a.url + '">' +
     a.month + ' ' + a.date +
     '</a></li>';
}

function scrapeAndNotify() {
  console.log('scrapeAndNotify');
  scrape()
    .then(function (appts) {
      console.log(appts);
      appointments = appts;
      if (appointments.length > 0) {
        push.send(
          'Appointments!',
          serviceUrl,
          function (err) {
            if (err) {
              console.error('Error sending notification');
              console.error(err);
              console.error(err.stack);
            } else {
              console.log('Successful notification');
            }
          }
        );
      }/* else {
        push.send(
          'Nada :-(',
          serviceUrl,
          function (err) {
            if (err) {
              console.error('Error sending notification');
              console.error(err);
              console.error(err.stack);
            } else {
              console.log('Successful notification');
            }
          }
        );
      }*/
      schedule(scrapeAndNotify);
    });
}

function scrape() {
  console.log('scrape');
  return scraperjs.StaticScraper.create(url)
    .scrape(function($) {
      return $(appointment).map(function() {
        return {
          month: $(this).closest(table).find(month).text(),
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
