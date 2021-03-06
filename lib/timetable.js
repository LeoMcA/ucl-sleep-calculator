var dedupe = require('dedupe')
var cache = require('./cache')
var request = require('request')

class Timetable {
  constructor (opts) {
    this._base_url = opts.base_url
    this._client_secret = opts.client_secret
    this._token = opts.token
  }

  build_query () {
    return `${this._base_url}/timetable/personal` +
           `?token=${this._token}` +
           `&client_secret=${this._client_secret}`
  }

  query (cb, params) {
    if (!params) params = ''
    cache.get_or_set(this.build_query() + params, callback => {
      request(this.build_query(), (err, reqRes, body) => {
        if (err) {
          cb(err, null)
        } else {
          callback(body)
        }
      })
    }, (err, value) => {
      if (err) {
        cb(err, null)
      } else {
        var timetable = JSON.parse(value).timetable
        cb(null, timetable)
      }
    })
  }

  for_day (day, cb) {
    this.query((err, timetable) => {
      if (err) {
        cb(err, null)
      } else {
        var day_timetable = new DayTimetable(timetable[day])
        cb(null, day_timetable)
      }
    }, `&date_filter=${day}`)
  }
}

class DayTimetable {
  constructor (data) {
    this._data = data
  }

  first_class () {
    var day_timetable = this._data
    if (day_timetable) {
      day_timetable.sort((a, b) => {
        if (a.start_time < b.start_time) return -1
        if (a.start_time > b.start_time) return 1
        return 0
      })
      return day_timetable[0]
    } else {
      return null
    }
  }
}

module.exports = Timetable
