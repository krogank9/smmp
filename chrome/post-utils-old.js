
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
