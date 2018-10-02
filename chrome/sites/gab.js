var video_filelist = null;
var imgs_filelist = null;
var video_info = {title: "", description: "", tags: []};

function onlyUnique(value, index, self) { 
	return self.indexOf(value) === index;
}

// gab has sub iframes
loadVidInfoFromStorage_Social(function() {
	doPageSpecific();
});

function injectToSubframes() {
	chrome.runtime.sendMessage({injectToSubframes: true, script: "sites/gab.js"});
}

// 1. get all files imported
function doPageSpecific() {
	console.log("doPageSpecific()")
	
	// top level iframe have to click post & reinject once composer iframe appears
	if (window.frameElement == null) {
		// also make sure this isn't reinject, post hasn't appeared yet
		if (Array.from(document.getElementsByTagName("iframe")).filter(i => i.id && i.id.startsWith("post-composer")).length != 0) {
			setTimeout(function publishPost() {
				if(getSocialPostType() == "images") {
					console.log('set imgs_filelist')
					Array.from(document.getElementsByTagName("input")).filter(function(inp) { return inp.type=="file" })[0].files = imgs_filelist
				}
				
				function clickPostButton() {
					console.log('clicking post')
					if(document.getElementsByClassName("composer__content__right__button")[0])
						document.getElementsByClassName("composer__content__right__button")[0].click()
					setTimeout(clickPostButton, 1000); // keep clicking till all images uploaded
				}
				setTimeout(clickPostButton, 2500);
				
				wait(function finishedPosting() {
					// once post composer box disappears, it's posted
					return ! document.getElementsByClassName("composer__content")[0]
				}, function() {
					// all done w/ gab post
					setTimeout(function() {
						chrome.runtime.sendMessage({closeThis: true});
					}, 1000);
				}, -1);
			}, 2500);
			return;
		}
		
		wait(function postButtonAppear() { return !! document.getElementsByClassName("post-composer-call__message")[0] }, function() {
			document.getElementsByClassName("post-composer-call__message")[0].click()
			
			wait(function composerFrameAppear() { return Array.from(document.getElementsByTagName("iframe")).filter(i => i.id && i.id.startsWith("post-composer")).length > 0 }, function() {
				console.log("injecting to subframes")
				injectToSubframes();
			}, -1)
		}, -1);
	}
	// bottom level iframe where text is typed
	else {
		console.log('aa')
		wait(function tinyMceAppear() { return !! document.getElementById("tinymce") }, function() {
			console.log("all files loaded");
			
			makeGabPost();
		}, -1, 1000);
	}
	

}

// 2. upload video
function makeGabPost() {
	console.log("in makeGabPost()")
	
	console.log(document.getElementById("tinymce"));
	document.getElementById("tinymce").children[0].innerText = getSocialHeadline();
}
