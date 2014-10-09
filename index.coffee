# Oauth2.0 Requires a server-side component to handle authentication
# and store session data. This server side code will need to use a Weibo
# SDK to interact with Weibo and process the authentication. Here we're
# using the NodeJS SDK, but there are others available here:
# 

# require dependencies
express = require "express"
util = require "util"
jade = require("jade").__express
stylus = require "stylus"
weibo = require "weibo"
session = require "cookie-session"
bodyParser = require "body-parser"
mid = require "weibo-mid"

# initialise the app
app = express()

# set configuration options
app.set "port", 80
app.set "views", __dirname + "/views"
app.set "view engine", "jade"
app.use bodyParser.json()
app.use bodyParser.urlencoded()
app.use session
	secret: "thisisasecret"


# WEIBO SDK CONFIGURATION
# ----------------------------------

# Darryl's
# appkey = "3294558148"
# secret = "c2c4b03bafe54f720577deb9ff7fccc5"

# Jim's
appkey = "109545286"
secret = "20fbd24d7a166fc66e58a553efa8597c"

oauthCallbackUrl = "http://apple.com/auth"
authURL = ""
accessToken = ""

# Initialise the SDK
weibo.init "weibo", appkey, secret, oauthCallbackUrl

# Add options for the oauth process - the event listeners
# are useful to show what's going on
weibo.oauth
	loginPath: "/login"
	logoutPath: "/logout"
	blogtypeField: "type"
	afterLogin: (req, res, callback) ->
		console.log req.session.oauthUser.screen_name + "login success"
		process.nextTick callback
	beforeLogout: (req, res, callback) ->
		console.log req.session.oauthUser.screen_name + "logging out"
		process.nextTick callback

# get the URL that the user will need to go to in order
# to authorise your app
weibo.get_authorization_url
	blogtype: "weibo"
	oauth_callback: oauthCallbackUrl
, (err, auth_info) ->
	console.error err if err
	authURL = auth_info.auth_url

# ROUTING
# ----------------------------------

# The root URL
app.get "/", (req, res) ->

	user = req.session.oauthUser
	accessToken = req.session.accessToken

	# check if the user is already logged in and authorised
	# (i.e. there is an existing login session)
	if !user

		# if not then show the login page
		res.render "index",
			authURL: authURL

	else

		# otherwise go into the app
		res.render "index-loggedin",
			title: "Weibo API Test"
			user: user

# Login directly
app.get "/login", (req, res) ->
	res.redirect authURL

# This is the callback URL to handle the authentication info.
# When users login, they are taken to the login/authorisation
# pages on weibo.com. They are then redirected back to this URL
# and the request carries an access code that can be used to
# retrive the access token. That access token is what we need to
# be able to use the Weibo API.
app.get "/auth", (req, res) ->

	# the access code is in req.query.code. We now use that code
	# along with the Weibo SDK to request an access token that the
	# user can use to access/use the Weibo API.
	weibo.get_access_token
		blogtype: "weibo"
		oauth_token: appkey
		oauth_verifier: req.query.code
		oauth_token_secret: secret
	, (err, token) ->

		console.error err if err

		# Hooray! we've got our access token!
		accessToken = token.access_token

		# now we grab your weibo user data so that we can store 
		# it in the session cookie. That way the page can remember you
		# and remember that you're logged in and authorised. Notice we
		# are now using our brand new access token for the API request!
		weibo.user_show
			blogtype: "weibo"
			source: appkey
			access_token: accessToken
		, token.uid, "", (err, User) ->
			console.error err if err
			# NOTE: need to comment out lines 713-729 in node_modules/weibo/lib/tapi.js - it's out of date
			req.session.oauthUser = User
			req.session.accessToken = accessToken
			res.redirect "/"

# This URL handles post requests from the page when the user submits the
# search query to search for a particular weibo post
app.post "/search", (req, res) ->

	# Unfortunately weibo uses a base62 encoded version of the weibo post ID
	# as part of the URL for each weibo post. We need to grab that encoded
	# string and decode it. Even more unfortunate is that the SDK doesn't
	# provide a way for us to decode base62 strings so we have to use another
	# library to do it... *sigh*
	weibomid = req.body.url.substr req.body.url.lastIndexOf("/") + 1
	id = mid.decode(weibomid)

	# right, now query the API to get details about that post...
	weibo.show
		blogtype: "weibo"
		source: appkey
		access_token: accessToken
	, id, (err, status) ->

		console.log err if err
		
		# ...and return those details to the user, along with details
		# about the request that was made (for reference)
		res.json
			request:
				url: "https://api.weibo.com/2/statuses/show.json"
				type: "GET"
				parameters:
					source: appkey
					access_token: accessToken
					id: id
			status: status

# Logout / kill the session
app.get "/logout", (req, res) ->
	req.session = null
	res.send "Logged out"

# this is just to compile stylus to CSS on the fly when it's requested
# Stylus > CSS
app.use stylus.middleware
	src: __dirname + "/styles",
	dest: __dirname + "/styles/"
app.use express.static __dirname

# Show a 404 page if no other routes are found
app.use (req, res) ->
	res.render "404",
		path: req.path.substr(1)
		req: util.inspect req, {depth: null}

# start the server
server = app.listen app.get "port"
console.log "Listening on port " + app.get "port"