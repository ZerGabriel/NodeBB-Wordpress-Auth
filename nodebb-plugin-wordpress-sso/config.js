module.exports = 
{
    name: 'wordpress', // No need to change in most case
    wordpress_url : 'http://example.com/', // Replace example.com with your wordpress url
    oauth2: {
        authorizationURL: 'http://example.com/oauth/authorize', // Replace example.com with your wordpress url
        tokenURL: 'http://example.com/oauth/token', // Replace example.com with your wordpress url
        clientID: 'my-wordpress-oauth-client-id-here', // Provide clientID of client you created in wordpress 
        clientSecret: 'my-wordpress-oauth-client-secret-here' // Provide clientSecret of client you created in wordpress 
    },
    userRoute: 'http://example.com/oauth/me', // Replace example.com with your wordpress url
    host: 'http://example.com', // Replace example.com with your wordpress url
    port: 80, // No need to change in most case
    userRoute_path: '/oauth/me/?access_token=', // No need to change in most case
    nodebb_url: 'http://forum.example.com/' // Replace forum.example.com with url of your NodeBB forum 
};

