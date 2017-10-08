var express = require('express')
var router = express.Router()
var crypto = require('crypto')
var request = require('request')

router.get('/', (req, res, next) => {
  crypto.randomBytes(48, (err, buf) => {
    var state = buf.toString('hex')

    res.cookie('state', state)
    res.redirect(`${process.env.BASE_URL}/oauth/authorise` +
                  `?client_id=${process.env.CLIENT_ID}` +
                  `&state=${state}`)
  })
})

router.get('/callback', (req, res, next) => {
  var q = req.query
  if (q.result === 'allowed' && process.env.CLIENT_ID === q.client_id && req.cookies.state === q.state) {
    request(`${process.env.BASE_URL}/oauth/token` +
            `?client_id=${process.env.CLIENT_ID}` +
            `&code=${q.code}` +
            `&client_secret=${process.env.CLIENT_SECRET}`,
            (err, reqRes, body) => {
              b = JSON.parse(body)
              if (err) res.status(500).send(`OAuth failed: ${err}`)
              if (b.ok && process.env.CLIENT_ID === b.client_id && req.cookies.state === b.state) {
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
