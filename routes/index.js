var express = require('express');
var router = express.Router();
var request = require('request')
var maps = require('@google/maps')
var util = require('util')
var moment = require('moment-timezone')
var Timetable = require('../lib/timetable')

moment.tz.setDefault('Europe/London')

/* GET home page. */
router.get('/', function(req, res, next) {
  var token = req.cookies.token
  if (token) {
    res.render('index')
  } else {
    res.redirect('/auth')
  }
});

function next_day (day) {
  var now = moment()
  if (now.day() == day) {
    var date = now
  } else if (now.day() <= day) {
    var date = now.day(day)
  } else {
    var date = now.add(1, 'week').day(day)
  }
  return date
}

router.post('/', (req, res, next) => {
  var token = req.cookies.token
  var timetable = new Timetable({ base_url: process.env.BASE_URL,
                                  client_secret: process.env.CLIENT_SECRET,
                                  token: token })

  var b = req.body
  var day_date = next_day(b.day).format('YYYY-MM-DD')

  timetable.for_day(day_date, (err, day_timetable) => {
    var first_class = day_timetable.first_class()

    if (first_class) {
      first_class.location = first_class.location.address.join(' ')
      first_class.time = moment(`${day_date} ${first_class.start_time}`)

      var mapsClient = maps.createClient({ key: process.env.GOOGLE_KEY })

      var location_blank = !first_class.location.trim()
      if (location_blank) {
        res.render('calculation', {
          no_location: true,
          first_class: first_class
        })
      } else {
        mapsClient.distanceMatrix({
          origins: b.location,
          destinations: first_class.location,
          mode: 'walking'
        }, (err, mRes) => {
          if (err) {
            res.status(500).send(`Google Maps API failed: ${err.json.error_message}`)
          } else {
            var duration = mRes.json.rows[0].elements[0].duration
            var wake_time = first_class.time.subtract(b.extra, 'minutes')
                                            .subtract(duration.value, 'seconds')

            res.render('calculation', {
              first_class: first_class,
              travel_time: duration.text,
              extra_time: b.extra,
              wake_time: wake_time.format('h:mm a')
            })
          }
        })
      }
    } else {
      res.render('calculation', {
        no_class: true
      })
    }

  })
})

module.exports = router;
