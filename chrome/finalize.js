// to allow for repost w/ yt link when i mess up
var debug_video_link = "";

function saveVidInfoToStorage(cb, clearVidLinks) {
	chrome.storage.local.get("vid_info", function(result) {
		video_info = result["vid_info"] || {};
		
		// may need URL createObjectURL
		var social_imgs_ = Array.from(_G("social_image_preview").getElementsByTagName("img")).reverse().map(convertImgToJpgUrl);
		var social_imgs_names_ = Array.from(_G("social_image_preview").getElementsByTagName("img")).map((i) => i.fileName.split(".")[0]+"_.jpg");
		if(social_imgs_.length == 0 || _G("social_preview_select").value == "None")
			social_imgs_ = null
		
		var info_dict = {
			title: _G("title_input").value.trim(),
			description: _G("description_textarea").value.trim(),
			tags: _G("video_tags_input").getTags(),
			category: _G("video_category").value,
			headline: _G("social_headline").value.trim(),
			
			fb_page_full_vid: _G("fb_page_full_vid").checked,
			
			vid_url: !vid_blob? null: URL.createObjectURL(vid_blob),
			thumb_url: !vid_blob? null: URL.createObjectURL(canvasToImageBlob(_G("thumbnail_canvas"))),
			thumb_url_small: !vid_blob? null: URL.createObjectURL(canvasToImageBlob(halfCanvas(_G("thumbnail_canvas")))),
			
			upload_vid_file_name: vid_file_name,
			
			social_vid_url: social_vid_clip? URL.createObjectURL(social_vid_clip) : null,
			social_vid_url_insta: social_vid_clip_insta? URL.createObjectURL(social_vid_clip_insta) : null,
			
			social_imgs_urls: social_imgs_,
			social_imgs_file_names: social_imgs_names_,
			
			video_to_link: _G("video_to_link").value,
		}
		
		if(debug_video_link) {
			info_dict.youtube_video_link = debug_video_link;
		}
		
		if(clearVidLinks) {
			info_dict.bitchute_video_link = null;
			info_dict.youtube_video_link = null;
		}
		
		// add all new values from video_info to info_dict
		info_dict = mergeDicts(video_info, info_dict)
		
		chrome.storage.local.set({"vid_info": info_dict}, cb);
	});
}

var use_vid_for_social = true;

var social_vid_clip = null;
var social_vid_clip_insta = null;
var social_vid_imgs = [];
var processing_social_vid_clip = false;
var done_processing_social_vid = false;

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

var saved_social_vid = false;
var postEverywhereClicked = false;
function postEverywhere() {
	if (!postEverywhereClicked)
		return;
	
	if (use_vid_for_social && !processing_social_vid_clip && vid_blob && anySocialChecked()) {
		processing_social_vid_clip = true;
		
		_G("vid_processing_text").style.display = "inline";

		getVideoClip(function(blob, blob_mpeg4insta) {
			_G("vid_processing_text").style.display = "none";
			if (!blob) {
				done_processing_social_vid = true;
				return;
			}
			console.log(blob);
			console.log(blob_mpeg4insta);
			social_vid_clip = blob;
			social_vid_clip_insta = blob_mpeg4insta;
			done_processing_social_vid = true;
		});
	}
	else if(!vid_blob || !anySocialChecked()) {
		use_vid_for_social = false;
	}
	
	//
	
	if (vid_post_queue.length > 0 && vid_blob) {
		(vid_post_queue.shift())()
	}
	else if (social_post_queue.length > 0) {
		wait(function doneProcessingSocialVid() {
			return !use_vid_for_social || done_processing_social_vid;
		}, function cb() {
			if(!saved_social_vid) {
				saved_social_vid = true;
				// save vid again for socials before post
				saveVidInfoToStorage(function() {
					(social_post_queue.shift())()
				});
			}
			else
				(social_post_queue.shift())()
		});
	}
	else if(last_post_queue.length > 0 && vid_blob) { // dtube posted last
		(last_post_queue.shift())()
	}
	else {
		_G("post_button").style.display = "none";
		_G("post_complete_text").style.display = "block";
		_G("refresh_page").onclick = function(){window.location.reload(true)}
		console.log("postEverywhere complete")
		
		chrome.tabs.getCurrent( function(tab){
			chrome.tabs.update(tab.id, {active:true});
			window.scrollTo(0,document.body.scrollHeight);
		});
	}
}

_G("post_button").onclick = function() {
	//console.log("posting...")
	//console.log("saving vid to storage")
	if(postEverywhereClicked)
		return;
	
	_G("post_button").disabled = true
	_G("post_button").value = "Posting..."
	
	use_vid_for_social = _G("social_preview_select").value == "Clip";
	postEverywhereClicked = true;
	
	saveVidInfoToStorage(function() {
		console.log("calling postEverywhere()")
		postEverywhere();
	}, true);
}
