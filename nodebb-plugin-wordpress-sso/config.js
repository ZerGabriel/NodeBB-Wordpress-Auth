module.exports = 
{
    type: 'oauth2',	
    name: 'wordpress',	
    wordpress_url : 'http://example.com/',
    oauth2: {
        authorizationURL: 'http://example.com/oauth/authorize',
        tokenURL: 'http://example.com/oauth/token',
        clientID: 'my-wordpress-oauth-client-id-here',
        clientSecret: 'my-wordpress-oauth-client-secret-here'
    },
    userRoute: 'http://example.com/oauth/me',
    host: 'http://example.com',
    port: 80,
    userRoute_path: '/oauth/me/?access_token='
};

