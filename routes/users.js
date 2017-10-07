var express = require('express')
var router = express.Router()
var config = require('../config')
var crypto = require('crypto')
var request = require('request')

router.get('/', (req, res, next) => {
  crypto.randomBytes(48, (err, buf) => {
    var state = buf.toString('hex')

    res.cookie('state', state)
    res.redirect(`${config.base_url}/oauth/authorise` +
                  `?client_id=${config.client_id}` +
                  `&state=${state}`)
  })
})

router.get('/callback', (req, res, next) => {
  var q = req.query
  if (q.result === 'allowed' && config.client_id === q.client_id && req.cookies.state === q.state) {
    request(`${config.base_url}/oauth/token` +
            `?client_id=${config.client_id}` +
            `&code=${q.code}` +
            `&client_secret=${config.client_secret}`,
            (err, reqRes, body) => {
              b = JSON.parse(body)
              if (err) res.status(500).send(`OAuth failed: ${err}`)
              if (b.ok && config.client_id === b.client_id && req.cookies.state === b.state) {
                res.cookie('token', b.token)
                res.redirect('/')
              } else {
                res.status(500).send('OAuth failed')
              }
            })
  } else {
    res.status(500).send('OAuth failed')
  }
})

module.exports = router;
