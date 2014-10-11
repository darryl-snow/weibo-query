/**
 * Weibo JavaScript SDK API: http://jssdk.sinaapp.com/api.php
 * Weibo API: open.weibo.com/wiki/微博API
 * Weibo API Test tool: http://open.weibo.com/tools/apitest.php
 *
 * @author  Darryl Snow
 * @email	darryl_snow@apple.com / dazsnow@gmail.com
 */
var weiboTest = {

	//- data for using the Weibo SDK
	//- be sure to change the app key if needed!
	config: {
		appKey: "109545286",
		accessToken: "",
		currentAction: "",
		currentPost: ""
	},

	//- UI elements
	el: {
		footer: $(".footer, .footer *"),
		forwardButton: $(".button-forward"),
		likeButton: $(".button-like"),
		replyButton: $(".button-reply"),
		searchQuery: $("#query"),
		searchButton: $("#search"),
		requestURL: $("#request-url"),
		requestType: $("#request-type"),
		requestParameters: $("#request-parameters"),
		tiles: $("#tiles")
	},

	// this is the info for the default tile first shown on the page.
	// more tile data will be added to this array with each search.
	tiles: [{
		mid: "Br0MWAcwj",
		id: "3764378908627939",
		created_at: "Wed Oct 08 17:11:50 +0800 2014",
		text: "Apple Watch Edition - 这一系列照片 拍的太好看了！请的都是大牌摄影师。 http://t.cn/Rha0TS2",
		user: {
			name: "CallMe关",
			screen_name: "CallMe关",
			profile_image_url: "http://tp4.sinaimg.cn/1585746615/180/5672195547/1"
		}
	}
	],

	/**
	 * Initial Setup
	 */
	init: function() {

		// render tiles
		weiboTest.renderTiles();

	},

	/**
	 * Render all tile data on the page
	 */
	renderTiles: function() {

		// loop through all available tile data and render
		// on the page if it's not already there
		for(var i = 0; i < weiboTest.tiles.length; i++) {

			var tile = weiboTest.tiles[i];

			// only render the tile if it's not already on the page
			if($("[data-mid=" + tile.mid + "]").length === 0) {

				// parse the time to put in the top left of the tile
				var weiboHours = (new Date(tile.created_at).getHours() > 12)? new Date(tile.created_at).getHours() -12 : new Date(tile.created_at).getHours();
				var weiboMinutes = new Date(tile.created_at).getMinutes();
				var ampm = (new Date(tile.created_at).getHours() >= 12)? "pm" : "am";
				var weiboTime = weiboHours + ":" + weiboMinutes + ampm;

				// render a tile template to the page
				weiboTest.el.tiles.append(
					"<article class='tile' data-mid='" + tile.mid + "' data-id='" + tile.id + "'>" +
					"	<header class='tile-header'>" +
					"		<time class='tile-timestamp' datetime='" + tile.created_at + "'>" + weiboTime + "</time>" +
					"	</header>" +
					"	<blockquote class='tile-content'>" +
					"		<cite class='tile-cite tile-cite-above'>" +
					"			<a class='tile-source block' href='http://weibo.com/" + tile.user.id +"' target='_blank'>" +
					"				<img class='tile-source-image' src='" + tile.user.profile_image_url + "' alt=''>" +
					"				<span class='tile-source-name'>" + tile.user.name + "</span>" +
					"				<span class='tile-source-username'>@" + tile.user.screen_name + "</span>" +
					"			</a>" +
					"		</cite>" +
					"		<p class='tile-copy'>" + tile.text + " " +
					"			<a class='link-hashtag' href='http://s.weibo.com/weibo/AppleLive' target='_blank'>" +
					"				<s>#</s><b>AppleLive</b><s>#</s>" +
					"			</a>" +
					"		</p>" +
					"		<cite class='tile-cite tile-cite-below'>" +
					"			<a class='tile-link' href='" + weiboTest.el.searchQuery.val() + "' target='_blank' aria-label='weibo.com'></a>" +
					"		</cite>" +
					"	</blockquote>" +
					"	<footer class='tile-footer'>" +
					"		<aside class='tile-share'>" +
					"			<ul class='tile-share-links'>" +
					"				<li class='tile-share-link'>" +
					"					<a class='icon icon-reply button-reply' href='http://widget.weibo.com/dialog/PublishWeb.php?mid=" + tile.mid + "&refer=y&tag=AppleLive&language=zh_cn&app_src=aE3ae&button=comment' target='_blank', data-share='reply', aria-label='评论' data-for-post='" + tile.mid + "'></a>" +
					"				</li>" +
					"				<li class='tile-share-link'>" +
					"					<a class='icon icon-retweet button-forward' href='http://widget.weibo.com/dialog/PublishWeb.php?mid=" + tile.mid + "&refer=y&tag=AppleLive&language=zh_cn&app_src=aE3ae&button=forward' target='_blank', data-share='retweet', aria-label='转发' data-for-post='" + tile.mid + "'></a>" +
					"				</li>" +
					"				<li class='tile-share-link'>" +
					"					<a class='icon icon-favorite button-like' href='#' target='_blank', data-share='favourite', aria-label='赞' data-for-post='" + tile.mid + "'></a>" +
					"				</li>" +
					"			</ul>" +
					"		</aside>" +
					"	</footer>" +
					"</article>"
				);

			}

		}

		//- add event listeners to the UI once all tiles
		// have been rendered
		weiboTest.bindUIEvents();

	},

	/**
	 * Update the footer content to show details of the request made to the Weibo API
	 */
	showRequest: function(url, type, parameters) {

		weiboTest.el.requestURL.text(url);
		weiboTest.el.requestType.text(type);
		weiboTest.el.requestParameters.text(JSON.stringify(parameters));

		weiboTest.toggleFooter();

	},

	/**
	 * Add event listeneres to buttons in the UI
	 */
	bindUIEvents: function() {

		// reset all event bindings when updating the UI
		$("*").unbind();

		// allow the search box to submit when the user presses enter
		weiboTest.el.searchQuery.on("keypress", function(e) {
			if(e.which == 13)
				weiboTest.search();
		});

		weiboTest.el.searchButton.on("click", weiboTest.search);
		weiboTest.el.replyButton.on("click", weiboTest.reply);
		weiboTest.el.forwardButton.on("click", weiboTest.forward);
		weiboTest.el.likeButton.on("click", weiboTest.like);
		weiboTest.el.footer.on("click", weiboTest.toggleFooter);

	},

	/**
	 * Toggle the footer
	 */
	toggleFooter: function() {

		weiboTest.el.footer.toggleClass("open");

	},

	/**
	 * Open a popup window. If it doesn't work, open the url in the same window.
	 * @url 	[string] The URL to be opened in the popup window
	 * @title 	[string] The title of the popup window
	 *
	 * returns window object
	 */
	openWindow: function(url, title) {

		var popup = window.open(url, title, ['toolbar=1,status=0,resizable=1,width=640,height=430,left=', (screen.width - 640) / 2, ',top=', (screen.height - 430) / 2].join(''));
		if(!popup) document.location.href = url;

		return popup;

	},

	/**
	 * Check if the user is logged in to weibo and has authorised the app.
	 *
	 * @return [boolean]
	 */
	checkLogin: function() {

		if(WB2.oauthData.access_token)
			return true;
		else
			return false;

	},

	/**
	 * The user isn't logged in so we need to open a popup window and direct them
	 * to the Weibo authorisation page. After they've logged in and authorised the app,
	 * weibo will automatically redirect them back to the callback URL ("/auth") with an
	 * access code that we can use to get an access token for the API.
	 */
	login: function() {

		openWindow("/login", "登录微博");

	},

	/**
	 * This function is called from the callback page in the popup window during
	 * the Oauth process. Its job is to receive and save the precious access token :)
	 *
	 * @token [string]	The access token granted by Weibo
	 */
	authorise: function(token) {

		// save the access token
		weiboTest.config.accessToken = token;

		// now we have the access token we need to re-try initialising the SDK
		// so that we can use it to perform API requests
		weiboTest.initialiseWeibo();

	},

	/**
	 * Initialise the Weibo SDK - requires the Oauth access token
	 */
	initialiseWeibo: function() {

		WB2.init({
			source: weiboTest.config.appKey,
			access_token: weiboTest.config.accessToken
		});

		//- wait for the Weibo SDK to initialise
		timer = setInterval(function(){
			if(WB2.oauthData.access_token) {

				// now we are logged in, authorised, and initialised, 
				// we can perform the original action
				weiboTest.config.currentAction();

				// clear the interval
				clearInterval(timer);
			}
		}, 500);

	},

	/**
	 * Query the API for details about the weibo based on the URL
	 * entered in the search field
	 */
	search: function() {

		//- only perform the search if we have valid a URL input
		if(weiboTest.el.searchQuery[0].validity.valid) {

			// check if the user is logged in / authorised
			if(weiboTest.checkLogin()) {

				//- disable the search button until search is complete
				weiboTest.el.searchButton.prop("disabled", true);

				// The last part of a Weibo URL is the MID, which is a 
				// base62 encoded version of the ID. We need to convert the
				// MID to an ID in order to lookup the Weibo with the API.
				// So we have a server-side function to do that (the client-side)
				// SDK doesn't have a function for this - I guess you could use
				// browserify to require the `weibo-mid` library...
				// Let's wait until we've got the ID then proceed...
				var searchQuery = weiboTest.el.searchQuery.val();
				var mid = searchQuery.substr(searchQuery.lastIndexOf("/") + 1);

				$.when(weiboTest.lookupID(mid)).then(
					function(status) {
						// success callback
						
						// save the Weibo ID
						var id = status.id;

						// compose the parameters we're going to send to the api
						var parameters = {
							id: id,
							source: weiboTest.config.appKey,
							access_token: weiboTest.config.accessToken
						};

						// Query the Weibo API to get the post info
						WB2.anyWhere(function(W){
							W.parseCMD(
								"/statuses/show.json",
								function(result, status) {

									//- have a geeky peek at what we get back from the server
									console.info(result);

									//- for some reason the MID for the post returned
									//- is the same as the ID so we need to change it
									result.mid = mid;

									//- add the post to the tiles collection
									weiboTest.tiles.push(result);

									//- update the UI
									weiboTest.renderTiles();

									//- update the request details in the footer
									weiboTest.showRequest("http://api.weibo.com/2/statuses/show.json", "GET", parameters);

									//- reenable the search button now that we've got the post info
									weiboTest.el.searchButton.prop("disabled", false);

								},
								parameters,
								{
									method: "get"
								}
							);
						});

					},
					function(status) {
						// failure callback
						console.error(status);
					},
					function(status) {
						// progress callback
						console.info(status);
					}
				);

			} else {

				// save the current action so we can get back to it later
				weiboTest.config.currentAction = weiboTest.search;

				// open the login popup
				weiboTest.login();

			}

		} else
			console.warn("Invalid input...");

	},

	/**
	 * Query the server for the ID of the post based on the MID
	 * @mid 	[String]	The MID of the Weibo post
	 *
	 * returns a promise
	 */
	lookupID: function(mid) {

		var dfd = new $.Deferred();

		$.ajax({
			type: "POST",
			url: "/getid",
			data: {
				mid: mid
			},
			beforeSend: function() {
				dfd.notify("looking up ID");
			},
			success: function(id) {
				dfd.resolve(id);
			},
			error: function(err) {
				dfd.fail(err);
			},
			complete: function() {
				dfd.notify("found ID");
			}
		});	

		return dfd.promise();

	},

	/**
	 * Open a popup for the user to reply to the Weibo post
	 * API: http://open.weibo.com/wiki/2/comments/create
	 */
	reply: function(e) {

		var target = "";
		var id = "";

		if(e) {
			// the function was called from a button click
			e.preventDefault();
			target = $(this).attr("href");
			id = $(".tile[data-mid=" + $(this).data("for-post") + "]").data("id");
		} else {
			// the function was called as a callback after the login process, i.e. no UI event
			target = $(".tile[data-mid=" + weiboTest.config.currentPost + "]").find(".button-reply").attr("href");
			id = $(".tile[data-mid=" + weiboTest.config.currentPost + "]").data("id");
		}

		// check if the user is logged in / authorised
		if(weiboTest.checkLogin()) {

			// open the reply widget in a popup window
			weiboTest.openWindow(target, "评论");

			// Gather the request details to show in the footer
			var parameters = {
				id: id,
				comment_ori: 1,
				comment: "whatever you write in the popup window",
				source: weiboTest.config.appKey,
				access_token: weiboTest.config.accessToken
			}

			//- update the request details in the footer
			weiboTest.showRequest("https://api.weibo.com/2/comments/create.json", "POST", parameters);

		} else {

			// not logged in so save what we're doing so we can come
			// back to it later, and show the login/authorisation popup
			weiboTest.config.currentAction = weiboTest.reply;
			weiboTest.config.currentPost = $(this).data("for-post");
			weiboTest.login();

		}

	},

	/**
	 * Open a popup for the user to forward the weibo post.
	 * API: http://open.weibo.com/wiki/2/statuses/repost
	 */
	forward: function(e) {

		var target = "";
		var id = "";

		if(e) {
			// the function was called from a button click
			e.preventDefault();
			target = $(this).attr("href");
			id = $(".tile[data-mid=" + $(this).data("for-post") + "]").data("id");
		} else {
			// the function was called as a callback after the login process, i.e. no UI event
			target = $(".tile[data-mid=" + weiboTest.config.currentPost + "]").find(".button-forward").attr("href");
			id = $(".tile[data-mid=" + weiboTest.config.currentPost + "]").data("id");
		}

		// check if the user is logged in / authorised
		if(weiboTest.checkLogin()) {

			// open the forward widget in a popup window
			weiboTest.openWindow(target, "转发");

			// Gather the request details to show in the footer
			var parameters = {
				id: id,
				source: weiboTest.config.appKey,
				access_token: weiboTest.config.accessToken
			}

			//- update the request details in the footer
			weiboTest.showRequest("https://api.weibo.com/2/statuses/repost.json", "POST", parameters);

		} else {

			// not logged in so save what we're doing so we can come
			// back to it later, and show the login/authorisation popup
			weiboTest.config.currentAction = weiboTest.forward;
			weiboTest.config.currentPost = $(this).data("for-post");
			weiboTest.login();

		}

	},

	/**
	 * Use the Weibo JavaScript SDK to forward someone else's weibo on the user's own blog.
	 * There is no widget to do this automatically so we're calling the API directly.
	 * API: http://open.weibo.com/wiki/2/attitudes/create
	 */
	like: function(e) {

		var id = "";

		if(e) {
			e.preventDefault();
			id = $(".tile[data-mid=" + $(this).data("for-post") + "]").data("id");
		} else {
			id = $(".tile[data-mid=" + weiboTest.config.currentPost + "]").data("id");
		}

		// check if the user is logged in / authorised
		if(weiboTest.checkLogin()) {

			// compose the parameters we're going to send to the api
			var parameters = {
				id: id,
				source: weiboTest.config.appKey,
				access_token: weiboTest.config.accessToken,
				attitude: "heart"
			};

			// We have the weibo post ID, let's query the API
			WB2.anyWhere(function(W){
				W.parseCMD(
					"/attitudes/create.json",
					function(result, status) {
						
						//- take a geeky peek at what the API returns
						console.log(result);

						//- update the request details in the footer
						weiboTest.showRequest("https://api.weibo.com/2/attitudes/create.json", "POST", parameters);

					},
					parameters,
					{
						method: "post"
					}
				);
			});


		} else {

			// not logged in so save what we're doing so we can come
			// back to it later, and show the login/authorisation popup
			weiboTest.config.currentAction = weiboTest.like;
			weiboTest.config.currentPost = $(this).data("for-post");
			weiboTest.login();

		}

	}

}

weiboTest.init();