// get/create/close/focus automatic posting window

var cur_window_id = null;

function getPostWindow(cb) {
	if(cur_window_id !== null) {
		chrome.windows.get(cur_window_id, {populate: true}, function(window){
		
			if(chrome.runtime.lastError || !window)
				cb(null)
			else
				cb(window)
		});
	}
	else
		cb(null);
}

function createPostWindow(cb) {
	getPostWindow(function(window) {
		if(!window) {
			chrome.windows.create({url:"google.com", type:"popup"}, function(window_) {
				
				cur_window_id = window_.id;
				// get with populate property to set tab too
				getPostWindow(function(window) {
					//launch debugger for use later
					chrome.debugger.attach({tabId: window.tabs[0].id}, "1.0", function() {
						cb(window);
					});
				}, true);
			});
		}
		else
			cb(window);
	});
}

function closePostWindow(success) {
	if(success) {
		cur_status_box = null;
		cur_retry_func = null;
		cur_success_cb = null;
	}
	getPostWindow(function(window) {
		if(window)
			chrome.windows.remove(window.id);
	});
}

function focusPostWindow() {
	getPostWindow(function(window) {
		chrome.windows.update(window.id, {focused:true});
	});
}

// persist inject sccripts to post window

var cur_injected_scripts = [];
var last_injected_url = "";

var last_url_change_time = 0;
var last_url_change_time_url = "";
function getUrlAge(url) {
	if(url != last_url_change_time_url) {
		last_url_change_time_url = url;
		last_url_change_time = (new Date()).getTime();
		return 0;
	}
	else {
		return (new Date()).getTime() - last_url_change_time;
	}
}

function persistInjectScripts() {
	
	getPostWindow(function(window) {
		if(!window)
			return;
			
		// don't reinject till finished loading
		if(window.tabs[0].status != "complete") {
			last_url_change_time = 0; // reset timer incase page changed somehow
			return;
		}
		
		let tab_id = window.tabs[0].id;
		let tab_url = window.tabs[0].url;
		
		if(tab_url == last_injected_url) {
			return; // no need to reinject. url hasn't changed
		}
		else { // url has changed. reinject soon:
			
			// only inject after 500ms passed from loading..
			// this prevents page changing to same url or maybe other weird behavior
			if(getUrlAge(tab_url) > 500)
				last_injected_url = tab_url; // reinjecting scripts... update url
			else
				return			
		}
		
		let injectQueue = cur_injected_scripts.slice(0);
		
		function runQueue() {
			let file = injectQueue.shift();
			
			chrome.tabs.executeScript(tab_id, {file: file, allFrames:false}, function() {
				console.log('injected '+file);
				if(injectQueue.length > 0)
					runQueue();
			});
		}
		runQueue();
	});
	
	setTimeout(persistInjectScripts, 100);
}
persistInjectScripts()

function setPersistInjectScripts(files) {
	cur_injected_scripts = files;
}

// now we need a way to determine whether site opened with openUploadTab has:
//
// 1. succeeded in making the post with confirmation from tab: display success & move onto the next step with postEverywhere()
// 2. failed to make the post
//   A. with a fail code and confirmation from tab: display fail & move onto the next step with postEverywhere()
//   B. the tab has closed unexpectedly and therefore failed: same as above

var cur_status_box = null;
var cur_retry_func = null;
var cur_success_cb = null;

function checkPostWindowStatus() {
	if(!cur_status_box && !cur_retry_func) {
		setTimeout(checkPostWindowStatus, 100);
		return;
	}
	
	getPostWindow(function(window) {
		if(!window) {
			// case 2B. tab has closed unexpectedly and failed
			tabFinished(false);
			
			cur_status_box = null;
			cur_retry_func = null;
			cur_success_cb = null;
		}
	});
	
	setTimeout(checkPostWindowStatus, 100);
}
checkPostWindowStatus();

function siteIsVideoToLink(postFunc) {
	function postFuncToSiteName(func) {
		if(func == postToYouTube) return "youtube"
		else if(func == postToBitChute) return "bitchute"
		else return ""
	}
	
	return postFuncToSiteName(postFunc) == video_info.video_to_link;
}

// tab messages listener in finalize_misc.js and case 1. and 2A. are taken care of here:
function tabFinished(success) {
	if(success) {
		cur_status_box.showSuccess();
		
		if(cur_success_cb)
			cur_success_cb();
			
		postEverywhere();
	}
	else { // tab finish failed
		if(cur_retry_func) {
			let status_box = cur_status_box;
			let retry_func = cur_retry_func;
			status_box.showFail(function() {
				status_box.hide();
				retry_func();
			});
		}
		
		// FAILED SITE. only continue if rest of sites don't depend on its video link.
		// i.e. If youtube fails, twitter can't post because it won't have the link of youtube video.
		if( siteIsVideoToLink(cur_retry_func) ) {
			alert("Could not post to video site used for social links. Please retry "+video_info.video_to_link+" to continue.");
		}
		else {
			postEverywhere();
		}
	}
}

// put it all together and present interface for opening site in posting window

function openUploadTab(url, script, status_box, retry_func, success_cb) {
	createPostWindow(function(window) {
		cur_status_box = status_box;
		cur_retry_func = retry_func;
		cur_success_cb = success_cb;
		
		chrome.tabs.update(window.tabs[0].id, {url:url});
		setPersistInjectScripts( ['utils.js', script] );
		
		status_box.showProgress(
			function skip() {
				closePostWindow();
			},
			function retry() {
				openUploadTab(url, script, status_box, retry_func, success_cb);
			}
		);
	});
}
