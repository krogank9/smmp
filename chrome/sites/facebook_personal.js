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
		
		wait(function tweetBoxAppear() { return !! document.getElementsByTagName("textarea")[0] }, function() {
			document.getElementsByTagName("textarea")[0].focus();
			
			if(getSocialPostType() == "video")
				setTimeout(uploadVideo, 1000);
			else if(getSocialPostType() == "images")
				setTimeout(uploadImages, 1000);
			else
				setTimeout(makeTextPost, 1000);
		}, -1);
		//wait(function waitTextboxShow() { return !! document.getElementById("tweet-box-home-timeline").childNodes[0] }, uploadVideo, -1);
	});
}

function waitNoLoadingPosts(cb) {
	wait(function noLoadingPosts() {
		return ! Array.from(document.getElementById("stream_pagelet").getElementsByTagName("div")).filter(d=>window.getComputedStyle(d).opacity==0.4)[0];
	}, cb, -1, 1000);
}

// 2a. make text post
function makeTextPost() {
	simulateTypeText(getSocialHeadline(), function() {
		setTimeout(function() {
			simulateCtrlEnter(function() {
				waitNoLoadingPosts(function() {
					chrome.runtime.sendMessage({closeThis: true});
				});
			});
		}, 2000);
	});
}

// 2b. upload images

function uploadImages() {
	setTimeout(function() {
		var fb_descr = getSocialHeadline();
		simulateTypeText(fb_descr.trim(), function() {
			// after post pagelet opens, set the video file list
			setTimeout(function() {
				Array.from(document.getElementById("pagelet_composer").getElementsByTagName("a")).filter(a=>Array.from(a.getElementsByTagName("input")).length>0).slice(-1)[0].getElementsByTagName("input")[0].files = imgs_filelist
				//Array.from(document.getElementsByTagName("input")).filter(i => i.type=="file")[1].files = video_filelist
				
				wait(function imagesDoneUploading() {
					var contentOpen = !! document.getElementById("pagelet_composer").getElementsByClassName("fbScrollableAreaContent")[0];
					var imgsAppeared = contentOpen && Array.from(document.getElementById("pagelet_composer").getElementsByClassName("fbScrollableAreaContent")[0].getElementsByTagName("img")).length != 0
					var allHaveAlt = contentOpen && Array.from(document.getElementById("pagelet_composer").getElementsByClassName("fbScrollableAreaContent")[0].getElementsByTagName("img")).filter(i=>!i.getAttribute("alt")).length == 0
					
					return contentOpen && imgsAppeared && allHaveAlt;
				}, function publishPost() {
					// press share
					Array.from(document.getElementById("pagelet_composer").getElementsByTagName("button")).filter(b=>b.type =="submit").slice(-1)[0].click();
					
					var contentOpen = !! document.getElementById("pagelet_composer").getElementsByClassName("fbScrollableAreaContent")[0];
					
					wait(function(){return contentOpen}, function() {
						wait(function postDialogClosed() {
							return ! Array.from(document.getElementById("pagelet_composer").getElementsByTagName("button")).filter(b=>b.getAttribute("data-testid")=="react-composer-post-button")[0];
						}, function() {
							waitNoLoadingPosts(function() {
								chrome.runtime.sendMessage({closeThis: true});
							}, 2500);
						});
					});
				});
			}, 3000);
		});
	}, 500);
}

// 2c. upload video
function uploadVideo() {
	console.log("in uploadVideo()")
		
	//simulateTypeText(video_info.headline + appendLink);
		
	//document.getElementById("tweet-box-home-timeline").childNodes[0].innerHTML = video_info.headline + appendLink;
	
	setTimeout(function() {
		var fb_descr = getSocialHeadline();
		simulateTypeText(fb_descr.trim());
		
		// after post pagelet opens, set the video file list
		setTimeout(function() {
			Array.from(document.getElementById("pagelet_composer").getElementsByTagName("a")).filter(a=>Array.from(a.getElementsByTagName("input")).length>0).slice(-1)[0].getElementsByTagName("input")[0].files = video_filelist
			//Array.from(document.getElementsByTagName("input")).filter(i => i.type=="file")[1].files = video_filelist
			
			wait(function waitUploadCompleted() {
				var uploads_box = document.getElementById("pagelet_composer").getElementsByClassName("fbScrollableAreaContent")[0];
				if(!uploads_box)
					return false;
					
				return uploads_box.children[0].children[0].getAttribute("data-testid") == "media-attachment-video";
			}, function finishPublishVideo() {
				// press share
				Array.from(document.getElementById("pagelet_composer").getElementsByTagName("button")).filter(b=>b.type =="submit").slice(-1)[0].click();
				
				wait(function finishedPosting() {
					// done once vid processing dialog pops up
					return !! Array.from(document.getElementsByTagName("div")).filter(d=>d.getAttribute("role") == "dialog" && d.children[0] && d.children[0].getAttribute("data-testid")=="video_processing_dialog")[0];
				}, function() {
					chrome.runtime.sendMessage({closeThis: true});
				});
			});
		}, 2500);
	}, 500);
}
