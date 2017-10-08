var Redis = require('ioredis')
var redis = new Redis(process.env.REDIS_URL)

var cache = {}

cache.get_or_set = function(key, get_value, callback) {
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

module.exports = cache
