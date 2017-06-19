# Magical SAML IdP


1. [Head to your Auth0 Dashboard](https://manage.auth0.com/#/connections/enterprise)
2. Create a new SAML connection
3. Use a URL such as: `http://localhost:3000/login?&audience=urn:auth0:YOUR_TENANT:CONNECTION_NAME&redirect_uri=https://YOUR_TENANT.auth0.com/login/callback?connection=CONNECTION_NAME`
4. Run `npm install`
5. Run `npm start`
6. Download and use the cert from http://localhost:3000/server.cert
7. Hit Try in your Auth0 Dashboard's connection, and make sure it works, or visit localhost:3000/login for an IdP-initiated flow

## Template variables supported

```
templateVariables = {
    id: '_abc',
    inResponseTo: SAMLRequest.id,
    instant: issueInstant,
    after: issueInstant + 1 day,
    redirect_uri: req.body.redirect_uri,
    destination: req.body.redirect_uri ||
        SAMLRequest.destination || '_mockedDestination',
    audience: req.body.audience || 'urn:_fake',
    issuer: 'SAMLIdPIssuer',
    successStatusCode: 'urn:oasis:names:tc:SAML:2.0:status:Success'
    assertion: signedAssertion
};
```

Example template:

```
The time is: @@instant@@
```

## UI

- SAMLAssertion: Everything you want the app to automagically sign and make available in `@@assertion@@`
- Redirect URI: The endpoint where the SAMLResponse and RelayState will be posted
- Audience: What you want made available in `@@audience@@` - optional, but you'll likely want to set this
- RelayState: The `RelayState` parameter that is sent to the redirect URI
- SAMLTemplate: The template for the overall SAMLResponse. In this template the SAMLAssertion from earlier is signed and made available in `@@assertion@@`