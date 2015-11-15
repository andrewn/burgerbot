burgerbot
===

Watches the Berlin service portal for Anmeldung appointment slots and sends a notification via [Pushover](https://pushover.net) when some are found.

## Install

1. Clone this repo
2. `npm install`

## Config

Set the following environment variables:

| Variable                | Purpose             | Required? |
|-------------------------|---------------------|-----------|
| PUSH_TOKEN              | Pushover app token  | Yes       |
| PUSH_USERKEY            | Pushover user id    | Yes       |
| SCRAPE_INTERVAL_SEC     | How often to check  | Yes       |
| NOTIFICATION_TIMEOUT_MS | Doesn't resend a notification within this time | No |
| APP_URL                 | Public URL of this app (to include link in notification) | No |
| URL                     | URL of service end point to poll | No |

## Running

    PUSH_TOKEN=xxx PUSH_USERKEY=yyy SCRAPE_INTERVAL_SEC=60 npm start

## Credits

Based on this [Burgetbot written in Ruby](https://gist.github.com/daxadax/233e7810a53e31b6f0a8).
