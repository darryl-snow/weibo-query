express = require "express"
util = require "util"
jade = require("jade").__express
stylus = require "stylus"
weibo = require "weibo"
session = require "cookie-session"
bodyParser = require "body-parser"
mid = require "weibo-mid"

app = express()

app.set "port", 80
app.set "views", __dirname + "/views"
app.set "view engine", "jade"
app.use bodyParser.json()
app.use bodyParser.urlencoded()
app.use session
	secret: "thisisasecret"

# WEIBO CONFIGURATION

appkey = "3294558148"
secret = "c2c4b03bafe54f720577deb9ff7fccc5"
oauthCallbackUrl = "http://weibotest.com/auth"
authURL = ""
accessToken = ""

weibo.init "weibo", appkey, secret, oauthCallbackUrl
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
weibo.get_authorization_url
	blogtype: "weibo"
	oauth_callback: oauthCallbackUrl
, (err, auth_info) ->
	console.error err if err
	authURL = auth_info.auth_url

# the root URL
app.get "/", (req, res) ->
	user = req.session.oauthUser
	accessToken = req.session.accessToken
	# check if the user is logged in and authorised
	if !user
		# if not then show the login page
		res.render "index",
			authURL: authURL
	else
		# otherwise welcome the user
		res.render "index-loggedin",
			title: "Weibo API Test"
			user: user

app.get "/login", (req, res) ->
	res.redirect authURL

# this is the callback URL to handle the authentication info
app.get "/auth", (req, res) ->
	weibo.get_access_token
		blogtype: "weibo"
		oauth_token: appkey
		oauth_verifier: req.query.code
		oauth_token_secret: secret
	, (err, token) ->
		console.error err if err
		accessToken = token.access_token
		weibo.user_show
			blogtype: "weibo"
			source: appkey
			access_token: accessToken
		, token.uid, "", (err, User) ->
			console.error err if err
			# WARNING: need to comment out lines 713-729 in node_modules/weibo/lib/tapi.js - it's out of date
			req.session.oauthUser = User
			req.session.accessToken = accessToken
			res.redirect "/"

app.post "/search", (req, res) ->
	weibomid = req.body.url.substr req.body.url.lastIndexOf("/") + 1
	id = mid.decode(weibomid)
	# userid = req.body.url.substr(21).slice 0,req.body.url.substr(21).indexOf("/")
	b = new Buffer mid, "base64"
	console.log b.toString "utf8"
	weibo.show
		blogtype: "weibo"
		source: appkey
		access_token: accessToken
	, id, (err, status) ->
		console.log err if err
		# console.log status
		res.json
			request:
				url: "https://api.weibo.com/2/statuses/show.json"
				type: "GET"
				parameters:
					source: appkey
					access_token: accessToken
					id: id
			status: status

app.get "/logout", (req, res) ->
	req.session = null
	res.send "Logged out"

app.use stylus.middleware
	src: __dirname + "/styles",
	dest: __dirname + "/styles/"
app.use express.static __dirname

app.use (req, res) ->
	res.render "404",
		path: req.path.substr(1)
		req: util.inspect req, {depth: null}

server = app.listen app.get "port"
console.log "Listening on port " + app.get "port"