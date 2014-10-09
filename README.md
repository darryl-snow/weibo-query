# Weibo Test

This app allows you to use the Weibo JavaScript SDK to:
- authenticate using Oauth2.0
- query the API to get details about a particular Weibo post
- reply to (comment on) a weibo post
- forward (share) a weibo post
- like a weibo post

## Requirements

* NodeJS & NPM
* CoffeeScript (`npm install -g coffee`)
* [LiveRefresh Chrome extension](https://chrome.google.com/webstore/detail/liverefresh/anjedjjhoempagnghcgbeembkdniplnn) _(optional)_

## Instructions

* Run the start command:

```
npm start
```

> Note: you may need to use `sudo` to run the app as it's using port 80

* In your browser go to [http://localhost:3000](http://localhost:3000)

## Explanation

Every interaction with Sina weibo requires Oauth2.0 authorisation. So you need to first send a request to the authorisation URL (which you can get using the API), then have a callback page on your server which handles the authorisation result, either displaying an error or saving the access token and user data in session storage so that they can be used to make further api requests. Once you have those stored, the user will be able to use the share buttons that interact with the weibo API.

[Email me](mailto:darryl_snow@apple.com) if you have any questions