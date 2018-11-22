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

var open_upload_tab_ids = {};
var isOpeningTab = false;
function tabOpened(id, status_box_, postFunc_, successCallback_) {
	
	open_upload_tab_ids[id] = {
		status_box: status_box_,
		postFunc: postFunc_,
		successCallback: successCallback_
	}
	
	let postFunc__ = postFunc_;
	let id_ = id;
	status_box_.showProgress(
		function skip() {
			console.log("skipping");
			chrome.debugger.detach({tabId: id_}, function cb() {
				if(chrome.runtime.lastError) {
					// wasn't attached to tab in first place
				}
				chrome.tabs.remove(id_);
				tabClosed(id_, false, postFunc__);
			});
			
			postEverywhere();
		},
		function retry() {
			chrome.debugger.detach({tabId: id_}, function cb() {
				if(chrome.runtime.lastError) {
					// wasn't attached to tab in first place
				}
				chrome.tabs.remove(id_);
				tabClosed(id_, false, postFunc__);
			});
			
			postFunc__();
		}
	);
}
function tabClosed(id, success, postFunc) {
	id = new String(id)
	if(!(id in open_upload_tab_ids))
		return
	
	if(success) {
		open_upload_tab_ids[id].status_box.showSuccess();
		if(open_upload_tab_ids[id].successCallback)
			open_upload_tab_ids[id].successCallback();
	}
	if(success === false && postFunc) {
		let statusBox = open_upload_tab_ids[id].status_box;
		open_upload_tab_ids[id].status_box.showFail(function() {
			statusBox.hide();
			postFunc();
		});
	}
	
	delete open_upload_tab_ids[id];
}

function postFuncToSiteName(func) {
	if(func == postToYouTube) return "youtube"
	else if(func == postToBitChute) return "bitchute"
	else return ""
}

function checkTabPrematureClose() {
	if(isOpeningTab) // don't check premature close if in the middle of opening a tab
		return;
	
	let calledPostAgain = false;
	
	var keys = Object.keys(open_upload_tab_ids);
	for(var i=0; i<keys.length; i++) {
		var k = keys[i];
		let str_tab_id = k;
		let tab_id = parseInt(k);
		chrome.tabs.get(tab_id, function(tab) {
			if(chrome.runtime.lastError || !tab) {

				// give option to retry tab later
				console.log(open_upload_tab_ids[str_tab_id])
				let postFunc = open_upload_tab_ids[str_tab_id].postFunc;
				let statusBox = open_upload_tab_ids[str_tab_id].status_box;
				tabClosed(str_tab_id, false, postFunc)
				
				var postFuncNames = {
					postToYouTube: "youtube",
					postToBitChute: "bitchute"
				}
				
				// restart loop where left off, unless it stopped on the site which social links to
				if(!calledPostAgain && postFuncToSiteName(postFunc) != video_info.video_to_link) {
					calledPostAgain = true; // make sure not call post multiple times when looping closed tabs
					postEverywhere();
				}
				else if (postFuncToSiteName(postFunc) == video_info.video_to_link) {
					chrome.tabs.getCurrent(function(tab){
						chrome.tabs.update(tab.id, {active:true});
					});
					alert("Could not post to video site used for social links. Please retry "+video_info.video_to_link+" to continue.");
				}
				return;
			}
		});
	}
	
	setTimeout(checkTabPrematureClose, 100);
}
checkTabPrematureClose();

//reinject scripts after url change
function persistInjectTab(id, siteFile) {
	let id_ = id;
	let siteFile_ = siteFile;
	let curUrl_ = "";
	
	function reinjectTab() {
		chrome.tabs.get(id_, function(tab) {
			if(chrome.runtime.lastError)
				return;
			else if(!tab)
				return;
			else if(tab.url != curUrl_) {
				curUrl_ = tab.url;
				console.log("CHANGED: "+tab.url);
				
				// inject scripts
				chrome.tabs.executeScript(id_, {file: "utils.js", allFrames:false}, function() {
					if(chrome.runtime.lastError)
						return;
					chrome.tabs.executeScript(id_, {file: siteFile_, allFrames:false}, function() {
						if(chrome.runtime.lastError)
							return;
						console.log("executed scripts in upload tab.")
					});
				});
			}
			
			// url & injection up to date, tab still open if no return above, keep persisting scripts
			setTimeout(reinjectTab, 200);
		});
	}
	reinjectTab();
}

function openUploadTab(url, script, cb) {
	isOpeningTab = true;
	chrome.tabs.create({url: url, active: false},function(tab) {
		if(chrome.runtime.lastError) {
			isOpeningTab = false;
			return;
		}
		
		// need to set active after creation so it doesn't steal window focus.
		// so you can go into another browser window and work while it is automating
		chrome.tabs.update(tab.id, {active:true});
		persistInjectTab(tab.id, script);
		
		if(cb)
			cb(tab);
			
		isOpeningTab = false;
	});
}

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
