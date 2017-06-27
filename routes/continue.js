const fs = require('fs');

const uuidv4 = require('uuid/v4');
const samlp = require('samlp');
const saml20 = require('saml').Saml20;

const SignedXml = require('xml-crypto').SignedXml;

let getProp = function(obj, path) {
    return path.split('.').reduce(function(prev, curr) {
        return prev[curr];
    }, obj);
}

let supplant = function(tmpl, o) {
    return tmpl.replace(
        /\@\@([^\@]*)\@\@/g,
        function(a, b) {
            let r = getProp(o, b);
            return typeof r === 'string' ||
                typeof r === 'number' ? r : a;
        }
    );
};

let formatDate = function(date) {
    return date.getUTCFullYear() + '-' + ('0' + (date.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + date.getUTCDate()).slice(-2) + 'T' + ('0' + date.getUTCHours()).slice(-2) + ":" + ('0' + date.getUTCMinutes()).slice(-2) + ":" + ('0' + date.getUTCSeconds()).slice(-2) + "Z";
};

let pemToCert = function(pem) {
    let cert = /-----BEGIN CERTIFICATE-----([^-]*)-----END CERTIFICATE-----/g.exec(pem.toString());
    if (cert.length > 0) {
        return cert[1].replace(/[\n|\r\n]/g, '');
    }

    return null;
};

let removeWhitespace = function(xml) {
    let trimmed = xml
        .replace(/\r\n/g, '')
        .replace(/\n/g, '')
        .replace(/>(\s*)</g, '><') //unindent
        .trim();
    return trimmed;
};

let buildSamlResponse = function(req, res, next, reqData) {
    let date = new Date();
    let issueInstant = formatDate(date);
    date.setDate(date.getDate() + 1);
    let afterInstant = formatDate(date);

    let cert = pemToCert(fs.readFileSync('server.cert'));
    let sig;
    try {
        sig = new SignedXml(null, {
            idAttribute: 'ID'
        });
        sig.addReference("//*[local-name(.)='Assertion']", ["http://www.w3.org/2000/09/xmldsig#enveloped-signature", "http://www.w3.org/2001/10/xml-exc-c14n#"],
                         'http://www.w3.org/2000/09/xmldsig#sha1');
        sig.signingKey = fs.readFileSync('server.key');

        sig.keyInfoProvider = {
            getKeyInfo: function(key, prefix) {
                prefix = prefix ? prefix + ':' : prefix;
                return "<" + prefix + "X509Data><" + prefix + "X509Certificate>" + cert + "</" + prefix + "X509Certificate></" + prefix + "X509Data>";
            }
        };
    }
    catch(err) {
        return next(err);
    }

    let templateVariables = {
        id: uuidv4(),
        inResponseTo: reqData.id,
        instant: issueInstant,
        after: afterInstant,
        redirect_uri: req.body.redirect_uri,
        destination: req.body.redirect_uri ||
            reqData.destination || '_mockedDestination',
        audience: req.body.audience || 'urn:_fake',
        issuer: 'SAMLIdPIssuer',
        successStatusCode: 'urn:oasis:names:tc:SAML:2.0:status:Success'
    };

    let samlAssertion = supplant(
        req.body.SAMLAssertion,
        templateVariables
    );

    try {
        sig.computeSignature(removeWhitespace(samlAssertion), {
            prefix: req.body.prefix || 'ds'
        });
    }
    catch(err) {
        return next(err);
    }

    let signedAssertion = sig.getSignedXml();

    templateVariables.assertion = signedAssertion;
    let samlResponse = removeWhitespace(supplant(
        req.body.SAMLTemplate,
        templateVariables
    ));

    res.render('form', {
        callback: req.body.redirect_uri ||
            'https://YOUR_TENANT.auth0.com/login/callback?connection=MySAMLIdP',
        type: 'SAMLResponse',
        token: new Buffer(samlResponse).toString('base64'),
        RelayState: req.body.RelayState
    });
};

module.exports = function(req, res, next) {
    const samlRequest = req.body.SAMLRequest;
    if (samlRequest) {
        samlp.parseRequest(
            req, {},
            function(err, data) {
                if (err) return next(err);
                buildSamlResponse(req, res, next, data);
            }
        );
    } else {
        buildSamlResponse(req, res, next, {
            issuer: '',
            destination: '',
            id: ''
        });
    }
}
