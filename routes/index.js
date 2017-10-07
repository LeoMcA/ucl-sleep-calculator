var express = require('express');
var router = express.Router();
var config = require('../config')
var request = require('request')
var maps = require('@google/maps')
var util = require('util')
var moment = require('moment')
var Redis = require('ioredis')
var redis = new Redis()
var dedupe = require('dedupe')

function cache_get_or_set(key, get_value, callback) {
  redis.get(key, (err, res) => {
    if (err) callback(err, null)
    if (!res) {
      get_value(value => {
        redis.set(key, value)
        callback(null, value)
      })
    } else {
      callback(null, res)
    }
  })
}

/* GET home page. */
router.get('/', function(req, res, next) {
  var token = req.cookies.token
  if (token) {
    res.render('index')
  } else {
    res.redirect('/auth')
  }
});

router.post('/', (req, res, next) => {
  var b = req.body
  if (moment().day() == b.day) {
    var date = moment()
  } else if (moment().day() <= b.day) {
    var date = moment().day(b.day)
  } else {
    var date = moment().add(1, 'week').day(b.day)
  }
  console.log('date', date.format('YYYY-MM-DD'))

  var token = req.cookies.token
  var timetable_query = `${config.base_url}/timetable/personal` +
                        `?token=${token}` +
                        `&client_secret=${config.client_secret}`
  console.log(timetable_query)

  cache_get_or_set(timetable_query, callback => {
    request(timetable_query, (err, reqRes, body) => {
      if (err) {
        res.status(500).send('Timetable API failed')
      } else {
        callback(body)
      }
    })
  }, (err, value) => {
    if (err) {
      res.status(500).send('Redis failed')
    } else {
      var day_timetable = JSON.parse(value).timetable[date.format('YYYY-MM-DD')]
      day_timetable = dedupe(day_timetable, x => x.start_time)
      day_timetable.sort((a, b) => {
        if (a.start_time < b.start_time) return -1
        if (a.start_time > b.start_time) return 1
        return 0
      })

      var class_location = day_timetable[0].location.address.join(' ')
      var class_time = moment(`${date.format('YYYY-MM-DD')} ${day_timetable[0].start_time}`)
      console.log('class_time', class_time)

      var mapsClient = maps.createClient({ key: config.google_key })

      mapsClient.distanceMatrix({
        origins: b.location,
        destinations: 'WC1E 6BT',
        mode: 'walking'
      }, (err, mRes) => {
        if (err) {
          res.status(500).send(`Google Maps API failed: ${err.json.error_message}`)
        } else {
          // console.log(util.inspect(mRes.json, { depth: null }))
          var duration = mRes.json.rows[0].elements[0].duration

          var wake_time = class_time.subtract(duration.value, 'minutes')

          res.render('calculation', { travel_time: duration.text, wake_time: wake_time.format('h:mm a') })
        }
      })
    }
  })

})

module.exports = router;
