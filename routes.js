const express = require('express');
const xpath = require('xpath');
const xmldom = require('xmldom');
const samlp = require('samlp');
const saml20 = require('saml').Saml20;
const parameters = require('parameters-middleware');

const loginRoute = require('./routes/login');
const continueRoute = require('./routes/continue');

const router = express.Router();

router.get('/', function(req, res, next) {
    res.render('index');
});

router.get('/login', loginRoute);
router.post('/continue', parameters({
    body: ['SAMLTemplate', 'SAMLAssertion', 'redirect_uri',
           'RelayState', 'SAMLRequest']
}), continueRoute);

router.get('/server.cert', function(req, res){
  var file = __dirname + '/../server.cert';
  res.download(file);
});

module.exports = router;