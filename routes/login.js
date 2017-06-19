const xmldom = require('xmldom');
const samlp = require('samlp');

module.exports = function(req, res, next) {
    let opts = {};
    const encodedSAMLRequest = (req.query || {}).SAMLRequest ||
        (req.body || {}).SAMLRequest;
    samlp.parseRequest(
        req,
        {},
        function(err, data) {
            if (err) return next(err);

            res.render('login', {
                SAMLRequest: encodedSAMLRequest,
                RelayState: (req.query || {}).RelayState ||
                    (req.body || {}).RelayState || '',
                redirect_uri: req.query.redirect_uri ||
                    'https://YOUR_TENANT.auth0.com/login/callback?connection=MySAMLIdP',
                audience: req.query.audience || '_mockAudience'
            });
        });
}