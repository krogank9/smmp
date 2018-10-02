chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.query({url:"chrome-extension://*/video-post.html"}, function(tabs) {
		if(tabs[0]) {
			chrome.tabs.update(tabs[0].id, {active:true}, function(tab){ });
			chrome.windows.update(tabs[0].windowId, {focused:true}, function(window){})
		}
		else {
			chrome.tabs.create({url: chrome.extension.getURL('video-post.html')});
		}
	})
});
