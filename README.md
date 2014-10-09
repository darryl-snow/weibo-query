# Weibo Test

This app allows you to use the Weibo JavaScript SDK to:
- authenticate using Oauth2.0
- query the API to get details about a particular Weibo post
- reply to (comment on) a weibo post
- forward (share) a weibo post
- like a weibo post
- see the exact API requests that are made

## Requirements

* NodeJS & NPM
* CoffeeScript (`npm install -g coffee`)

## Instructions

* Run the start command:

```
npm start
```

> Note: you may need to use `sudo` to run the app as it's using port 80. You'll also need to add a line in your hosts file so that a fake domain points to http://localhost - this is because the app settings on weibo require that the app's URL be a valid http://xxx.xxx domain name. Add this line in `/etc/hosts`:
```
127.0.0.1 weibotest.com
```
Then in the app settings on open.weibo.com, ensure that weibotest.com is set as the app's domain and URL.

* In your browser go to [http://weibotest.com](http://weibotest.com)

## Explanation

Every interaction with Sina weibo requires Oauth2.0 authorisation. So you need to first send a request to the authorisation URL (which you can get using the API), then have a callback page on your server which handles the authorisation result, either displaying an error or saving the access token and user data in session storage so that they can be used to make further api requests. Once you have those stored, the user will be able to use the share buttons that interact with the weibo API.

[Email me](mailto:darryl_snow@apple.com) if you have any questions