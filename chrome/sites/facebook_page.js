var video_filelist = null;
var imgs_filelist = null;
var video_info = {title: "", description: "", tags: []};

function onlyUnique(value, index, self) { 
	return self.indexOf(value) === index;
}

// 0. wait for everything to be loaded
//wait( function waitLoad() {return !!document.getElementById("fileupload")}, importFilesFromStorage, 10000 );
importFilesFromStorage();

// 1. get all files imported
function importFilesFromStorage() {
	console.log("loading files")
	
	loadVidInfoFromStorage_Social(function() {
		console.log("all files loaded");
		console.log(video_filelist)
		
		wait(function tweetBoxAppear() { return !! document.getElementById("PageComposerPagelet_") }, function() {
			Array.from(document.getElementById("PageComposerPagelet_").getElementsByTagName("div")).filter(d => d.getAttribute("role")=="presentation")[1].click()
			
			if(getSocialPostType() == "video")
				setTimeout(uploadVideo, 1000);
			else if(getSocialPostType() == "images")
				setTimeout(uploadImages, 1000);
			else
				setTimeout(makeTextPost, 1000);
		}, 10000, 1000);
		//wait(function waitTextboxShow() { return !! document.getElementById("tweet-box-home-timeline").childNodes[0] }, uploadVideo, -1);
	});
}

function waitNoLoadingPosts(cb) {
	wait(function noLoadingPosts() {
		return ! Array.from(document.getElementById("pagelet_timeline_main_column").getElementsByTagName("div")).filter(d=>window.getComputedStyle(d).opacity==0.4)[0];
	}, cb, 30000, 1000);
}

// 2a. make text post
function makeTextPost() {
	simulateTypeText(getSocialHeadline(1000, false, true), function() {
		setTimeout(function() {
			simulateCtrlEnter(function() {
				waitNoLoadingPosts(function() {
					chrome.runtime.sendMessage({closeThis: true});
				});
			});
		}, 2000);
	});
}

// 2b. make images post
function uploadImages() {
	var fb_descr = getSocialHeadline(1000, false, true);

	console.log("fb_descr: '"+fb_descr+"'");
	simulateTypeText(fb_descr, function() {
		// after post pagelet opens, set the video file list
		setTimeout(function() {
			// click photo button
			Array.from(document.getElementById("PageComposerPagelet_").getElementsByTagName("a")).filter(a=>a.getAttribute("role")=="presentation")[0].click()
			
			setTimeout(function(){
				document.getElementById("PageComposerPagelet_").getElementsByTagName("input")[0].files = imgs_filelist
				//Array.from(document.getElementsByTagName("input")).filter(i => i.type=="file")[1].files = video_filelist
				
				wait(function imagesDoneUploading() {
					var contentOpen = !! document.getElementById("PageComposerPagelet_").getElementsByClassName("fbScrollableAreaContent")[0];
					var imgsAppeared = contentOpen && Array.from(document.getElementById("PageComposerPagelet_").getElementsByClassName("fbScrollableAreaContent")[0].getElementsByTagName("img")).length != 0
					var allHaveAlt = contentOpen && Array.from(document.getElementById("PageComposerPagelet_").getElementsByClassName("fbScrollableAreaContent")[0].getElementsByTagName("img")).filter(i=>!i.getAttribute("alt")).length == 0
					
					return contentOpen && imgsAppeared && allHaveAlt;
				}, function publishPost() {
					// press share
					simulateCtrlEnter(function() {
						wait(function uploadBoxClosed(){
							return ! document.getElementById("PageComposerPagelet_").getElementsByClassName("fbScrollableAreaContent")[0]
						}, function() {
							setTimeout(function() {
								// give a sec to close
								waitNoLoadingPosts(function() {
									chrome.runtime.sendMessage({closeThis: true});
								});
							}, 1000);
						}, -1, 100);
					});
					//Array.from(document.getElementById("PageComposerPagelet_").getElementsByTagName("button")).filter(b=>b.type =="submit").slice(-1)[0].click();
				});
			}, 2000);
		}, 1000);
	});
}

// 2c. upload video
function uploadVideo() {
	console.log("in uploadVideo()")
		
	//simulateTypeText(video_info.headline + appendLink);
		
	//document.getElementById("tweet-box-home-timeline").childNodes[0].innerHTML = video_info.headline + appendLink;
	
	setTimeout(function() {
		// click photo/vid upload
		Array.from(document.getElementById("PageComposerPagelet_").getElementsByTagName("div")).filter(d => d.getAttribute("data-hover")=="tooltip")[0].click()
		
		// after photo page opens, set the video file list
		setTimeout(function() {
			if(video_info.fb_page_full_vid === true) {
				Array.from(document.getElementsByTagName("input")).filter(i => i.type=="file")[0].files = video_filelist_full_vid
			}
			else {
				Array.from(document.getElementsByTagName("input")).filter(i => i.type=="file")[0].files = video_filelist
			}
			
			wait(function waitUploadCompleted() {
				var upload_bar = Array.from(document.getElementsByTagName("div")).filter(d => d.getAttribute("data-testid") == "video_upload_complete_bar")[0];
				return upload_bar && upload_bar.innerText && upload_bar.innerText.trim().startsWith("100");
			}, setVidInfoAndPublish);
		}, 2500);
	}, 500);
}

// 3. set vid info for fb page video
function setVidInfoAndPublish() {
	var composer_dialog = Array.from(document.getElementsByTagName("div")).filter(d => d.getAttribute("data-testid") == "VIDEO_COMPOSER_DIALOG")[0];
	// type title
	var title_input = Array.from(document.getElementsByTagName("input")).filter(d => d.getAttribute("data-testid") == "VIDEO_TITLE_BAR_TEXT_INPUT")[0];
	title_input.click();
	simulateTypeText(video_info.title, function() {
		// type descr
		var descr_input = Array.from(composer_dialog.getElementsByTagName("div")).filter(d => d.getAttribute("role") == "combobox")[0];
		descr_input.click()
		
		// append the video link if enabled & one was set
		var fb_descr = getSocialHeadline();
		
		if(video_info.fb_page_full_vid === true
			&& !video_info.description.includes("https://") // FB page links may require captcha, just prevent
			&& !video_info.description.includes("http://")) {
			fb_descr = video_info.description;
		}
		
		simulateTypeText(fb_descr.trim(), function() {
			var tag_input = Array.from(composer_dialog.getElementsByTagName("input")).filter(d => d.getAttribute("role") == "combobox")[0];
			tag_input.click();
			
			let tags = video_info.tags.slice(0, 8); // max 8 tags on fb
			let cbQueue = [];
			function nextCb() {
				if(cbQueue.length > 0)
					(cbQueue.shift())();
			}
			
			for(var i=0; i<tags.length; i++) {
				let tag = tags[i];
				
				cbQueue.push(function() {
					simulateTypeText(tag);
					// wait for "add tag" to appear
					setTimeout(function() {
						// press up twice to select exact tag instead of suggestions in list
						simulateDoubleUpPress();
						
						// press enter on exact tag to add
						setTimeout(function() {
							simulateTypeText("\n");
							setTimeout(nextCb, 500);
						}, 250);
					}, 1000);
				});
			}
			
			cbQueue.push(function() {
				setTimeout(function() {
					Array.from(document.getElementsByTagName("a")).filter(d => d.getAttribute("data-testid") == "VIDEO_COMPOSER_NEXT_BUTTON")[0].click();
					setTimeout(function() {
						Array.from(document.getElementsByTagName("a")).filter(d => d.getAttribute("data-testid") == "VIDEO_COMPOSER_PUBLISH_BUTTON")[0].click();
						
						// note: before close wait till upload box closes or it will prevent tab close.
						wait(function composerClosed() {
							return ! Array.from(document.getElementsByTagName("div")).filter(d => d.getAttribute("data-testid") == "VIDEO_COMPOSER_DIALOG")[0]
						}, function() {
							chrome.runtime.sendMessage({closeThis: true});
						});
					}, 500);
				}, 1000);
			});
			nextCb();
		});
	});
}
