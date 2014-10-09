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
	},

	//- UI elements
	el: {
		forwardButton: $(".button-share--forward"),
		likeButton: $(".button-share--like"),
		modal: $("[data-remodal-id=reply-modal]").remodal(),
		postersName: $(".js-posters-name"),
		replyButton: $(".button-share--reply"),
		replyContent: $("#reply-content"),
		requestDetails: $("#request-details"),
		searchQuery: $("#query"),
		searchButton: $("#search"),
		searchResult: $("#search-result"),
		sendReplyButton: $(".button-share--send-reply"),
		shareButtons: $(".share-buttons")
	},

	/**
	 * Initial Setup
	 */
	init: function() {

		//- wait for the Weibo SDK to initialise
		timer = setInterval(function(){
			if(WB2.oauthData.access_token) {

				//- grab your weibo access token and user ID
				weiboTest.config.accessToken = WB2.oauthData.access_token;
				weiboTest.config.userID = WB2.oauthData.uid;

				clearInterval(timer);
			}
		}, 500);


		//- add event listeners to the UI once the SDK is initialised
		weiboTest.bindUIEvents();

	},

	
	/**
	 * Initialise the Weibo SDK
	 */
	initialiseWeibo: function() {

		WB2.init({
			source: weiboTest.config.appKey,
			access_token: weiboTest.config.accessToken
		});

	},

	/**
	 * Add event listeneres to buttons in the UI
	 */
	bindUIEvents: function() {

		weiboTest.el.searchButton.on("click", weiboTest.search);
		weiboTest.el.replyButton.on("click", weiboTest.showModal);
		weiboTest.el.sendReplyButton.on("click", weiboTest.reply);
		weiboTest.el.forwardButton.on("click", weiboTest.forward);
		weiboTest.el.likeButton.on("click", weiboTest.like);

	},

	/**
	 * Send a request to the server to search for a weibo
	 * based on the URL supplied in the search bar
	 */
	search: function() {

		//- only perform the search if we have valid a URL input
		if(weiboTest.el.searchQuery[0].validity.valid) {

			//- disable the search button until search is complete
			weiboTest.el.searchButton.prop("disabled", true);

			//- hide the share buttons during the search
			weiboTest.el.shareButtons.addClass("hidden");

			$.ajax({
				type: "POST",
				url: "/search",
				data: {
					url: weiboTest.el.searchQuery.val()
				},
				success: function(result) {
			
					//- reenable the search button
					weiboTest.el.searchButton.prop("disabled", false);

					//- reshow the share buttons
					weiboTest.el.shareButtons.removeClass("hidden");

					//- grab the access token from the server
					//- weiboTest.config.accessToken = result.request.parameters.access_token;

					//- save the Post ID so we can use it for the share buttons
					weiboTest.config.postID = result.request.parameters.id;
					
					//- update the UI with the results
					weiboTest.updateUI(result);

					//- initialise the weibo SDK if not already done. The search is
					//- done via the NodeJS SDK on the server but share buttons use
					//- the browser-based JavaScript SDK so we need to ensure it's
					//- initialised
					if(!WB2.oauthData.access_token)
						weiboTest.initialiseWeibo();

					//- have a geeky peek at what we get back from the server
					console.info(result);

				},
				dataType: "json"
			});

		} else {

			console.warn("invalid search query...");

		}

	},

	/**
	 * Activate the modal popup for entering the reply content.
	 * Modals use the Remodal jQuery plugin (http://vodkabears.github.io/remodal/)
	 */
	showModal: function() {

		//- disable the reply button until the social interaction is complete
		weiboTest.el.replyButton.prop("disabled", true);

		//- open the modal window for entering reply content
		weiboTest.el.modal.open();
	},

	updateUI: function(obj) {

		//- update the search results (left) tile if there is a result
		if(obj.status) {
			
			var pic = obj.status.original_pic;

			weiboTest.el.searchResult.html(
				"<label>Weibo ID:</label>" +
				"<div>" + obj.status.id + "</div>" +
				"<label>User name:</label>" +
				"<div>" + obj.status.user.screen_name + "</div>" +
				"<label>User ID:</label>" +
				"<div>" + obj.status.user.id + "</div>" +
				"<label>User URL:</label>" +
				"<a class='block' href='http://weibo.com/" + obj.status.user.id + "' title='go to " + obj.status.user.screen_name + "'s weibo page>http://weibo.com/" + obj.status.user.id + "</a>" +
				"<label>Weibo Content:</label>" +
				"<div>" + obj.status.text + "</div>"
			);

			//- add the image if there is one
			if(pic) {
				weiboTest.el.searchResult.html(
					weiboTest.el.searchResult.html() +
					"<img src='" + pic + "' alt=''>"
				);
			}

			//- update the title of the reply modal popup
			weiboTest.el.postersName.text(obj.status.user.screen_name);

		}

		//- update the request details (right) tile
		if(obj.request) {

			//- grab the request parameters
			var parameters = "";
			for(var item in obj.request.parameters) {
				parameters += item + ": " + obj.request.parameters[item] + "\n";
			}

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

	showNotification: function(type, content) {

		var notification = null;
		
		if(type === "success") {

			notification = weiboTest.el.shareButtons.after("<div class='notification'>" + content + "</div>").next();

		} else {

			notification = weiboTest.el.shareButtons.after("<div class='notification notification-error'><strong>Error:</strong> " + content + "</div>").next();

		}

		$(notification).addClass("show");

		//- make the notification disappear after 5 seconds
		setTimeout(function() {
			$(notification).removeClass("show").delay(300).remove();
		}, 5000);

	},


	/**
	 * Use the Weibo JavaScript SDK to send a reply to the weibo
	 * API: http://open.weibo.com/wiki/2/comments/create
	 */
	reply: function() {

		//- only process the reply if valid reply content has been entered
		if(weiboTest.el.replyContent[0].validity.valid && weiboTest.el.replyContent.val().length > 0) {

			//- grab the reply content from the textarea
			var replyContent = weiboTest.el.replyContent.val();

			//- disable the reply button until it's sent
			weiboTest.el.sendReplyButton.prop("disabled", true);

			//- use the SDK
			WB2.anyWhere(function(W){
				W.parseCMD(
					"/comments/create.json",
					function(result, status) {
						
						//- re-enable the reply buttons now that the interaction is complete
						weiboTest.el.replyButton.prop("disabled", false);
						weiboTest.el.sendReplyButton.prop("disabled", false);

						//- clear the reply content textarea
						weiboTest.el.replyContent.val("");

						//- close the reply content modal
						weiboTest.el.modal.close();

						//- show the request details on the page
						weiboTest.updateUI({
							request: {
								url: "https://api.weibo.com/2/comments/create.json",
								type: "POST",
								parameters: {
									id: weiboTest.config.postID,
									comment_ori: 1,
									comment: replyContent,
									source: weiboTest.config.appKey,
									access_token: weiboTest.config.accessToken
								}
							}
						});

						//- take a geeky peek at what the API returns
						console.log(result);

						//- show a notification
						if(result.error)
							weiboTest.showNotification("error", result.error);
						else
							weiboTest.showNotification("success", "<strong>Reply successful!</strong> Go to <a href='" + $("#query").val() + "'>the weibo</a> to check its replies.");

					},
					{
						id: weiboTest.config.postID,
						comment_ori: 1,
						comment: replyContent,
						source: weiboTest.config.appKey,
						access_token: weiboTest.config.accessToken
					},
					{
						method: "post"
					}
				);
			});
		}

	},

	/**
	 * Use the Weibo JavaScript SDK to forward someone else's weibo on your blog
	 * API: http://open.weibo.com/wiki/2/statuses/repost
	 */
	forward: function() {

		//- disable the forward button until the social interaction is complete
		weiboTest.el.forwardButton.prop("disabled", true);

		WB2.anyWhere(function(W){
			W.parseCMD(
				"/statuses/repost.json",
				function(result, status) {

					//- re-enable the forward button now that the interaction is complete
					weiboTest.el.forwardButton.prop("disabled", false);

					//- show the request details on the page
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
					
					//- take a geeky peek at what the API returns
					console.log(result);

					//- show a notification
					if(result.error)
						weiboTest.showNotification("error", result.error);
					else
						weiboTest.showNotification("success", "<strong>Forward successful!</strong> Go to <a href='http://weibo.com/" + weiboTest.config.userID + "'>your weibo page</a> to check.");
				},
				{
					id: weiboTest.config.postID,
					source: weiboTest.config.appKey,
					access_token: weiboTest.config.accessToken
				},
				{
					method: "post"
				}
			);
		});

	},

	/**
	 * Use the Weibo JavaScript SDK to forward someone else's weibo on your blog
	 * API: http://open.weibo.com/wiki/2/attitudes/create
	 */
	like: function() {

		//- disable the forward button until the social interaction is complete
		weiboTest.el.likeButton.prop("disabled", true);

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
								id: weiboTest.config.postID,
								source: weiboTest.config.appKey,
								access_token: weiboTest.config.accessToken
							}
						}
					});

					//- take a geeky peek at what the API returns
					console.log(result);

					//- show a notification
					if(result.error)
						weiboTest.showNotification("error", result.error);
					else
						weiboTest.showNotification("success", "Like successful! Go to <a href='" + $("#query").val() + "'>the weibo page</a> to check its likes.");

				},
				{
					id: weiboTest.config.postID,
					source: weiboTest.config.appKey,
					access_token: weiboTest.config.accessToken
				},
				{
					method: "post"
				}
			);
		});


	}

}

weiboTest.init();