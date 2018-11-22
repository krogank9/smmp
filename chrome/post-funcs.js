//vid

function postToRealVideo() {
	if(!_G("post_realvideo").checked) {
		postEverywhere();
		return
	}
	console.log("posting to real.video")
	openUploadTab("https://www.brighteon.com/dashboard/upload", "sites/realvideo.js", function(tab){
		tabOpened(tab.id, _G("status_realvideo"), postToRealVideo);
	})
}
function postToBitTube() {
	if(!_G("post_bittube").checked) {
		postEverywhere();
		return
	}
	console.log("posting to BitTube")
	openUploadTab("https://bit.tube/uploadmedia", "sites/bittube.js", function(tab){
		tabOpened(tab.id, _G("status_bittube"), postToBitTube);
	})
}
function postToMetacafe() {
	if(!_G("post_metacafe").checked) {
		postEverywhere();
		return
	}
	console.log("posting to Metacafe")
	openUploadTab("http://www.metacafe.com/upload-video/", "sites/metacafe.js", function(tab){
		tabOpened(tab.id, _G("status_metacafe"), postToMetacafe);
	})
}
function postToTopbuzz() {
	if(!_G("post_topbuzz").checked) {
		postEverywhere();
		return
	}
	console.log("posting to Topbuzz")
	openUploadTab("https://www.topbuzz.com/profile_v2/video", "sites/topbuzz.js", function(tab){
		tabOpened(tab.id, _G("status_topbuzz"), postToTopbuzz);
	})
}
function postVimeoThumb() {
	if(!_G("post_vimeo").checked) {
		postEverywhere();
		return
	}

	var new_vid_info;
	chrome.storage.local.get("vid_info", function(result) {
		new_video_info = result["vid_info"];
		
		if(!new_video_info.vimeo_link) {
			postEverywhere(); 
			return
		}
		
		var link = new_video_info.vimeo_link;
		var vid_id = link.split("/");
		vid_id.pop();
		vid_id = vid_id.pop(); // fmt: "https://vimeo.com/user89495732/review/289892675/a3e676cedf" need 2nd to last
		
		var edit_link = "https://vimeo.com/manage/____/general".replace("____", vid_id);
		
		console.log("setting Vimeo thumbnail")
		openUploadTab(edit_link, "sites/vimeo_thumb.js", function(tab){
			tabOpened(tab.id, _G("status_vimeo"), postVimeoThumb);
		})
	});
}
function postToVimeo() {
	if(!_G("post_vimeo").checked) {
		postEverywhere();
		return
	}
	console.log("posting to Vimeo")
	openUploadTab("https://vimeo.com/upload", "sites/vimeo.js", function(tab){
		tabOpened(tab.id, _G("status_vimeo"), postToVimeo, function() {vid_post_queue.unshift(postVimeoThumb)});
	})
}
function postToDTube() {
	if(!_G("post_dtube").checked) {
		postEverywhere();
		return
	}
	console.log("posting to DTube")
	openUploadTab("https://d.tube/#!/upload", "sites/dtube.js", function(tab){
		tabOpened(tab.id, _G("status_dtube"), postToDTube);
	}) 
}
function postToDailymotion() {
	if(!_G("post_dailymotion").checked) {
		postEverywhere();
		return;
	}
	console.log("posting to Dailymotion")
	openUploadTab("https://www.dailymotion.com/partner/media/video/upload", "sites/dailymotion.js", function(tab){
		tabOpened(tab.id, _G("status_dailymotion"), postToDailymotion);
	}) 
}
function postToBitChute() {
	if(!_G("post_bitchute").checked) {
		postEverywhere();
		return
	}
	console.log("posting to BitChute")
	openUploadTab("https://www.bitchute.com/myupload", "sites/bitchute.js", function(tab){
		tabOpened(tab.id, _G("status_bitchute"), postToBitChute);
	}) 
}
function postToYouTube() {
	if(!_G("post_youtube").checked) {
		postEverywhere();
		return
	}
	console.log("posting to YouTube")
	openUploadTab("https://www.youtube.com/upload", "sites/youtube.js", function(tab){
		tabOpened(tab.id, _G("status_youtube"), postToYouTube);
	}) 
}

//social

var use_vid_for_social = true;

var social_vid_clip = null;
var social_vid_clip_insta = null;
var social_vid_imgs = [];
var processing_social_vid_clip = false;
var done_processing_social_vid = false;

function hasImageOrVideo() {
	return _G("social_preview_select").value != "None"
		&& (
			(_G("social_preview_select").value == "Images" && Array.from(_G("social_image_preview").getElementsByTagName("img")).length > 0)
			||
			(_G("social_preview_select").value == "Clip" && vid_blob)
		);
}

function postToGplus() {
	if(!_G("post_gplus").checked) {
		postEverywhere();
		return
	}
	console.log("posting to Gplus")
	openUploadTab("https://plus.google.com/", "sites/gplus.js", function(tab){
		tabOpened(tab.id, _G("status_gplus"), postToGplus);
	})
}
function postToTumblr() {
	if(!_G("post_tumblr").checked) {
		postEverywhere();
		return
	}
	console.log("posting to Tumblr")
	openUploadTab("https://www.tumblr.com/dashboard/", "sites/tumblr.js", function(tab){
		tabOpened(tab.id, _G("status_tumblr"), postToTumblr);
	})
}
function postToInstagram() {
	if(!_G("post_instagram").checked || !hasImageOrVideo()) {
		postEverywhere();
		return
	}
	console.log("posting to Instagram")
	openUploadTab("https://www.instagram.com/logan_krumbhaar/", "sites/instagram.js", function(tab){
		tabOpened(tab.id, _G("status_instagram"), postToInstagram);
	})
}
function postToTwitter() {
	if(!_G("post_twitter").checked) {
		postEverywhere();
		return
	}
	console.log("posting to Twitter")
	openUploadTab("https://www.twitter.com", "sites/twitter.js", function(tab){
		tabOpened(tab.id, _G("status_twitter"), postToTwitter);
	})
}
function postToGab() {
	if(!_G("post_gab").checked) {
		postEverywhere();
		return
	}
	console.log("posting to Gab")
	openUploadTab("https://gab.ai/home", "sites/gab.js", function(tab){
		tabOpened(tab.id, _G("status_gab"), postToGab);
	})
}
function postToMinds() {
	if(!_G("post_minds").checked) {
		postEverywhere();
		return
	}
	console.log("posting to Minds")
	openUploadTab("https://www.minds.com/newsfeed/subscribed", "sites/minds.js", function(tab){
		tabOpened(tab.id, _G("status_minds"), postToMinds);
	})
}
function postToFacebookPersonal() {
	if(!_G("post_facebook_personal").checked) {
		postEverywhere();
		return
	}
	console.log("posting to Facebook (Personal)")
	openUploadTab("https://www.facebook.com", "sites/facebook_personal.js", function(tab){
		tabOpened(tab.id, _G("status_facebook_personal"), postToFacebookPersonal);
	})
}
function postToFacebookPage() {
	if(!_G("post_facebook_page").checked) {
		postEverywhere();
		return
	}
	var page = simplifyUrl( _G("facebook_page_url").value );
	
	console.log("posting to Facebook Page: "+page)
	openUploadTab(page, "sites/facebook_page.js", function(tab){
		tabOpened(tab.id, _G("status_facebook_page"), postToFacebookPage);
	})
}

function anySocialChecked() {
	return ( _G("post_facebook_page").checked && ! _G("fb_page_full_vid").checked )
		|| _G("post_facebook_personal").checked
		|| _G("post_minds").checked
		|| _G("post_gab").checked
		|| _G("post_twitter").checked
		|| _G("post_tumblr").checked
		|| _G("post_instagram").checked
}

var vid_post_queue = [postToYouTube, postToBitChute, postToDailymotion, postToVimeo, postToTopbuzz, postToMetacafe, postToBitTube, postToRealVideo];
var social_post_queue = [postToTwitter, postToGplus, postToGab, postToMinds, postToTumblr, postToInstagram, postToFacebookPersonal, postToFacebookPage];
var last_post_queue = [postToDTube]
