var dedupe = require('dedupe')
var cache = require('./cache')

class Timetable {
  constructor (opts) {
    this._base_url = opts.base_url
    this._client_secret = opts.client_secret
    this._token = opts.token
  }

  build_query () {
    return `${this._base_url}/timetable/personal_fast` +
           `?token=${this._token}` +
           `&client_secret=${this._client_secret}`
  }

  query (cb) {
    console.log(this.build_query())
    cache.get_or_set(this.build_query(), callback => {
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
    })
  }
}

class DayTimetable {
  constructor (data) {
    this._data = data
  }

  first_class () {
    var day_timetable = this._data
    day_timetable = dedupe(day_timetable, x => x.start_time)
    day_timetable.sort((a, b) => {
      if (a.start_time < b.start_time) return -1
      if (a.start_time > b.start_time) return 1
      return 0
    })
    return day_timetable[0]
  }
}

module.exports = Timetable
