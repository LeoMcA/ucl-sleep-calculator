# Setting up

Copy `.env.dist` to `.env`.

## UCL API

[Sign in to the UCL API Dashboard](https://uclapi.com/dashboard/).

Create a new application:
* Set the OAuth Settings > Callback URL to `https://your-domain-here/auth/callback`
* Tick the Personal Timetable scope

Copy the creds to `.env`:
* Set `CLIENT_ID` to the value in OAuth Settings > Client ID
* Set `CLIENT_SECRET` to the value in OAuth Settings > Client Secret

## Distance Matrix API

[Get an API key for the Google Maps Distance Matrix API](https://developers.google.com/maps/documentation/distance-matrix/get-api-key).

Set `GOOGLE_KEY` in `.env` to the key.

## Install dependencies

```
cd ./ucl-sleep-calculator
npm install
```

## Install redis

```
pacman -S redis
```

## Install localtunnel

```
npm install -g localtunnel
```

## Install heroku

```
npm install -g npm-cli
```

# Running

Start redis:

```
redis-server
```

Set up the local tunnel:

```
lt --port 5000
```

Start the local server:

```
heroku local
```
