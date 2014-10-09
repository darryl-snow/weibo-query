# Weibo Test

This app allows you to use the Weibo JavaScript SDKs to:
- authenticate using Oauth2.0
- query the API to get details about a particular Weibo post
- reply to (comment on) a weibo post
- forward (share) a weibo post
- like a weibo post
- see the exact API requests that are made

## Requirements

* A weibo account
* A weibo app
* NodeJS & NPM
* CoffeeScript (`npm install -g coffee`)

## Development

* Set your hosts file to point `apple.com to localhost` for testing/development:

```
sudo echo "127.0.0.1 apple.com" >> /etc/hosts
```

> NOTE: the domain you use, whether apple.com or not, has to match with the domain used in your app settings on open.weibo.com. Be sure to also change the **oauthCallbackURL** variable on **line 30** of `index.coffee` as well.

* Edit the App Key and App secret in `index.coffee` to match those for your weibo app

* Edit the App Key in `/scripts/weiboTest.js` and `/views/index-loggedin.jade`

* Install dependencies:

```
npm install
```

> NOTE: you'll need to comment out lines 713-729 in node_modules/weibo/lib/tapi.js - it's out of date

* Run the start command:

```
npm start
```

> NOTE: you need to use `sudo` to run the app as it's using port 80. 

* In your browser go to [http://apple.com](http://apple.com) (or whatever URL you've set in your app details on `open.weibo.com` and in the callback URL in `index.coffee`)

> NOTE: Remember to remove the line in your hosts file when you've finished! :)

## How to use it

* Click the login button to login to weibo and authorise the app
* Enter the URL of a weibo post in the search bar at the top and then click "go"
* The weibo post will appear on the left of the page and the request made to the weibo API will appear on the right
* Click any of the 3 social interaction buttons beneath the post - again the request details will appear on the right of the page

## Explanation

Every interaction with Sina weibo requires Oauth2.0 authorisation. So you need to first send a request to the authorisation URL (which you can get using the API), then have a callback page on your server which handles the authorisation result, either displaying an error or saving the access token and user data in session storage so that they can be used to make further api requests. Once you have those stored, the user will be able to use the share buttons that interact with the weibo API.

[Email me](mailto:darryl_snow@apple.com) if you have any questions