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
		postID: "",
		userID: "",
		mid: ""
	},

	//- UI elements
	el: {
		forwardWidget: $(".forward-widget"),
		replyWidget: $(".reply-widget"),
		likeButton: $(".button-share--like"),
		requestDetails: $("#request-details"),
		searchQuery: $("#query"),
		searchButton: $("#search"),
		searchResult: $("#search-result"),
		tileFooter: $(".search-results-tile .tile-footer")
	},

	/**
	 * Initial Setup
	 */
	init: function() {

		//- add event listeners to the UI once the SDK is initialised
		weiboTest.bindUIEvents();

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

				//- save the weibo access token and user ID
				weiboTest.config.accessToken = WB2.oauthData.access_token;
				weiboTest.config.userID = WB2.oauthData.uid;

				clearInterval(timer);
			}
		}, 500);

	},

	/**
	 * Add event listeneres to buttons in the UI
	 */
	bindUIEvents: function() {

		weiboTest.el.searchButton.on("click", weiboTest.search);
		weiboTest.el.replyWidget.on("click", weiboTest.replyPopup);
		weiboTest.el.forwardWidget.on("click", weiboTest.forwardPopup);
		weiboTest.el.likeButton.on("click", weiboTest.like);

	},

	/**
	 * Send a request to the server to search for a weibo
	 * based on the URL supplied in the search bar
	 */
	search: function(e) {

		if(e)
			e.preventDefault();

		//- only perform the search if we have valid a URL input
		if(weiboTest.el.searchQuery[0].validity.valid) {

			// check if the user is logged in / authorised
			if(WB2.oauthData.access_token) {

				//- disable the search button until search is complete
				weiboTest.el.searchButton.prop("disabled", true);

				//- hide the share buttons during the search
				weiboTest.el.tileFooter.addClass("hidden");

				// get the MID from the end of the URL in the search input
				weiboTest.config.mid = weiboTest.el.searchQuery.val().substr(weiboTest.el.searchQuery.val().lastIndexOf("/") + 1);

				// first convert the MID to the ID
				// - requires a call to the server because the JavaScript SDK can't do this
				// but there is a NodeJS library that can. Could also use browserify to require
				// the weibo-mid package into the browser code...
				$.ajax({
					type: "POST",
					url: "/getid",
					data: {
						mid: weiboTest.config.mid
					},
					success: function(id) {

						//- use the SDK to make an API request
						//- in this case we're searching for a weibo post based on the ID
						WB2.anyWhere(function(W){
							W.parseCMD(
								"/statuses/show.json",
								function(result, status) {

									// search complete

									//- reenable the search button
									weiboTest.el.searchButton.prop("disabled", false);

									//- reshow the share buttons
									weiboTest.el.tileFooter.removeClass("hidden");

									//- save the Post ID so we can use it for the share buttons
									weiboTest.config.postID = id.id;
									
									//- update the UI with the results
									weiboTest.updateUI({
										status: result,
										request: {
											url: "https://api.weibo.com/2/statuses/show.json",
											type: "GET",
											parameters: {
												source: weiboTest.config.appKey,
												access_token: weiboTest.config.accessToken,
												id: id.id,
											}
										}
									});

									//- have a geeky peek at what we get back from the server
									console.info(result);

								},
								{ //request parameters send to the API
									id: id.id,
									source: weiboTest.config.appKey,
									access_token: weiboTest.config.accessToken
								},
								{
									method: "get"
								}
							);
						});

					},
					dataType: "json"
				});

			} else {

				// open the login popup
				weiboTest.login();

			}

		} else {

			console.warn("invalid search query...");

		}

	},

	/**
	 * This function updates the UI. It shows the search results and also displays the
	 * request paramaters for each API request.
	 */
	updateUI: function(obj) {

		//- update the search results (bottom left) tile if there is a result
		if(obj.status) {
			
			var pic = "";
			if(obj.status.original_pic)
				pic = "<div data-tile-state='expanded' class='tile-image'><img src='" + obj.status.original_pic + "' alt='" + obj.status.text + "'></div>";

			// parse the time to put in the top left of the tile
			var weiboHours = (new Date(obj.status.created_at).getHours() > 12)? new Date(obj.status.created_at).getHours() -12 : new Date(obj.status.created_at).getHours();
			var weiboMinutes = new Date(obj.status.created_at).getMinutes();
			var ampm = (new Date(obj.status.created_at).getHours() >= 12)? "pm" : "am";
			var weiboTime = weiboHours + ":" + weiboMinutes + ampm;

			// add HTML to the tile
			weiboTest.el.searchResult.html(
				"	<header class='tile-header'>" +
				"		<time datetime='" + obj.status.created_at + "' class='tile-timestamp'>" + weiboTime + "</time>" +
				"	</header>" +
				"	<blockquote class='tile-content'>" + pic +
				"		<cite class='tile-cite tile-cite-above'>" +
				"			<a href='http://weibo.com/" + obj.status.user.id + "' target='_blank' class='tile-source block'>" +
				"				<img src='" + obj.status.user.profile_image_url + "' alt='' class='tile-source-image'>" +
				"				<span class='tile-source-name'>" + obj.status.user.name + "</span>" +
				"				<span class='tile-source-username block-link'>@" + obj.status.user.screen_name + "</span>" +
				"			</a>" +
				"		</cite>" +
				"		<p class='tile-copy'>" + obj.status.text + " " +
				"			<a href='http://s.weibo.com/weibo/AppleLive' target='_blank'></a>" +
				"			<a href='http://s.weibo.com/weibo/AppleLive' target='_blank' class='link-hashtag'>" +
				"				<s>#</s><b>AppleLive</b><s>#</s>" +
				"			</a>" +
				"		</p>" +
				"		<cite class='tile-cite tile-cite-below'>" +
				"			<a href='" + weiboTest.el.searchQuery.val() + "' target='_blank' aria-label='weibo.com' class='tile-link'></a>" +
				"		</cite>" +
				"	</blockquote>"
			);

			// show the social buttons
			weiboTest.el.tileFooter.show();

			// get the weibo MID and update the widgets and the tile itself
			weiboTest.config.mid = weiboTest.el.searchQuery.val().substr(weiboTest.el.searchQuery.val().lastIndexOf("/") + 1);
			
			weiboTest.el.searchResult.parent().data("mid", weiboTest.config.mid);

			var replyWidget = $(".search-results-tile").find(".reply-widget");
			if(replyWidget) {
				// new search results where there was no previous MID
				replyWidget.attr("href", replyWidget.attr("href").replace("?mid=&","?mid=" + weiboTest.config.mid + "&"));
				// replace an existing search result
				replyWidget.attr("href", replyWidget.attr("href").replace(replyWidget.attr("href").substr(replyWidget.attr("href").indexOf("?")+5).substr(0, replyWidget.attr("href").substr(replyWidget.attr("href").indexOf("?")+5).indexOf("&")), weiboTest.config.mid));
			}

			var forwardWidget = $(".search-results-tile").find(".forward-widget");
			if(forwardWidget) {
				// new search results where there was no previous MID
				forwardWidget.attr("href", forwardWidget.attr("href").replace("?mid=&","?mid=" + weiboTest.config.mid + "&"));
				// replace an existing search result
				forwardWidget.attr("href", forwardWidget.attr("href").replace(forwardWidget.attr("href").substr(forwardWidget.attr("href").indexOf("?")+5).substr(0, forwardWidget.attr("href").substr(forwardWidget.attr("href").indexOf("?")+5).indexOf("&")), weiboTest.config.mid));
			}
		}

		//- update the request details (right) tile
		if(obj.request) {

			//- grab the request parameters
			var parameters = "";
			for(var item in obj.request.parameters) {
				parameters += item + ": " + obj.request.parameters[item] + "\n";
			}

			// update the HTML for the request tile
			weiboTest.el.requestDetails.html(
				"<label>Request URL:</label>" +
				"<pre>" + obj.request.url + "</pre>" +
				"<label>Request Type:</label>" +
				"<pre>" + obj.request.type + "</pre>" +
				"<label>Request Parameters:</label>" +
				"<pre>" + parameters + "</pre>"
			);

		}

	},

	/**
	 * This function is called from the callback page in the popup window during
	 * the Oauth process. Its job is to receive and save the precious access token :)
	 */
	authorise: function(token) {
		weiboTest.config.accessToken = token;
		weiboTest.initialiseWeibo();
		return true;
	},

	/**
	 * The user isn't logged in so we need to open a popup window and direct them
	 * to the Weibo authorisation page. After they've logged in and authorised the app,
	 * weibo will automatically redirect them back to the callback URL ("/auth") with an
	 * access code that we can use to get an access token for the API.
	 */
	login: function() {

		// open window
		var loginwindow = window.open("/login", "登录微博", ['toolbar=1,status=0,resizable=1,width=640,height=430,left=', (screen.width - 640) / 2, ',top=', (screen.height - 430) / 2].join(''));
		if (!loginwindow) document.location.href = "/login";

	},

	/**
	 * Open a popup window with the URL to reply to/comment on the weibo.
	 * API: http://open.weibo.com/wiki/2/comments/create
	 */
	replyPopup: function(e) {

		if(e)
			e.preventDefault();

		// check they're logged in
		if(WB2.oauthData.access_token) {

			target = $(this).attr("href");

			// open window
			if (!window.open(target, "发布微博评论", ['toolbar=1,status=0,resizable=1,width=640,height=430,left=', (screen.width - 640) / 2, ',top=', (screen.height - 430) / 2].join(''))) document.location.href = target;

			weiboTest.updateUI({
				request: {
					url: "https://api.weibo.com/2/comments/create.json",
					type: "POST",
					parameters: {
						id: weiboTest.config.postID,
						comment_ori: 1,
						comment: "whatever you write in the popup window",
						source: weiboTest.config.appKey,
						access_token: weiboTest.config.accessToken
					}
				}
			});

		} else {
			// not logged in so show the login/authorisation popup
			weiboTest.login();
		}

	},

	/**
	 * Open a popup window with the URL to forward the weibo.
	 * API: http://open.weibo.com/wiki/2/statuses/repost
	 */
	forwardPopup: function(e) {

		if(e)
			e.preventDefault();

		// check they're logged in
		if(WB2.oauthData.access_token) {

			target = $(this).attr("href");

			// open window
			if (!window.open(target, "转发微博", ['toolbar=1,status=0,resizable=1,width=640,height=430,left=', (screen.width - 640) / 2, ',top=', (screen.height - 430) / 2].join(''))) document.location.href = target;

			weiboTest.updateUI({
				request: {
					url: "https://api.weibo.com/2/statuses/repost.json",
					type: "POST",
					parameters: {
						id: weiboTest.config.postID,
						source: weiboTest.config.appKey,
						access_token: weiboTest.config.accessToken
					}
				}
			});

		} else {
			// not logged in so show the login/authorisation popup
			weiboTest.login();
		}

	},

	/**
	 * Use the Weibo JavaScript SDK to forward someone else's weibo on your blog.
	 * There is no widget to do this automatically so we're calling the API directly.
	 * API: http://open.weibo.com/wiki/2/attitudes/create
	 */
	like: function(e) {

		if(e)
			e.preventDefault();

		//- disable the forward button until the social interaction is complete
		weiboTest.el.likeButton.prop("disabled", true);

		// check they're logged in
		if(WB2.oauthData.access_token) {

			// first get the Post ID. We know the MID so we have to convert it. If you already know the ID, no need.
			$.ajax({
				type: "POST",
				url: "/getid",
				data: {
					mid: $(e.target).parent().parent().parent().parent().parent().data("mid") //hey, it's friday afternoon... basically need to associate the weibo ID/MID with each tile so this function knows which post to like
				},
				success: function(id) {

					// So we have the weibo post ID, let's query the API
					WB2.anyWhere(function(W){
						W.parseCMD(
							"/attitudes/create.json",
							function(result, status) {

								//- re-enable the forward button now that the interaction is complete
								weiboTest.el.likeButton.prop("disabled", false);

								//- show the request details on the page
								weiboTest.updateUI({
									request: {
										url: "https://api.weibo.com/2/attitudes/create.json",
										type: "POST",
										parameters: {
											id: id.id,
											source: weiboTest.config.appKey,
											access_token: weiboTest.config.accessToken,
											attitude: "heart"
										}
									}
								});

								//- take a geeky peek at what the API returns
								console.log(result);

							},
							{ //request parameters
								id: id.id,
								source: weiboTest.config.appKey,
								access_token: weiboTest.config.accessToken,
								attitude: "heart"
							},
							{
								method: "post"
							}
						);
					});

				}
			});

		} else {

			// not logged in so show the login/authorisation popup
			weiboTest.login();

		}

	}

}

weiboTest.init();