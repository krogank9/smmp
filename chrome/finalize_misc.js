// ENSURE ONLY ONE SMMP EXTENSION TAB OPEN AT ONCE.
// On open new tab close this one, select first, and move first to new pos.
// if have multiple finalize tab open causes errors
chrome.tabs.query({url:"chrome-extension://*/video-post.html"}, function(tabs) {
	if(tabs[0] && tabs[1]) {
		// already more than one extension page open. close this one for sanity
		chrome.tabs.getCurrent(function(tab) {
			// focus original
			var toFocus = tabs[0].id == tab.id? tabs[0] : tabs[1];
			chrome.tabs.update(toFocus.id, {active:true}, function(tab){ });
			chrome.windows.update(toFocus.windowId, {focused:true}, function(window){});
			
			// remove current
			chrome.tabs.remove(tab.id, function() { });
		});
	}
});

// VISUAL STUFF

_G("imgKeepWidthSameAsHeight").style.width = _G("imgKeepWidthSameAsHeight").clientHeight+"px";
_G("tweet_dev_box").onmousedown = function(e) {
	e.preventDefault();
}
_G("tweet_dev_box").onmouseenter = function() {this.mouseIn = true;}
_G("tweet_dev_box").onmouseleave = function() {this.mouseIn = false;}
_G("tweet_dev_box").onmouseup = function() {
	if ( this.mouseIn === true )
		window.open("https://twitter.com/LoganKrumbhaar");
}

Array.from(document.getElementsByClassName("loading_icon")).forEach(function(span) {
	var count = 12;
	var first = 128336;

	let curCode = -1;
	function nextCode() {
		curCode = ((curCode+1)%count);
		span.innerHTML = "&#"+(first+curCode)+";";
		setTimeout(nextCode, 100);
	}
	nextCode();
});
Array.from(document.getElementsByClassName("dotdotdot")).forEach(function(span) {
	function nextCode() {
		span.innerHTML += ".";
		if(span.innerHTML.length > 5)
			span.innerHTML = "";
		setTimeout(nextCode, 500);
	}
	nextCode();
});

Array.from(document.getElementsByClassName("site_status_span")).forEach(function(span) {
	span.style.paddingLeft = "7pt";
	span.style.display = "none";
	
	let success = document.createElement("span");
	success.innerHTML = "&#9989; Success";
	let failed = document.createElement("span");
	failed.innerHTML = "&#10060; Failed: <a href='#'>Retry</a>";
	let progress = document.createElement("span");
	progress.innerHTML = "&#128172; In progress... <a href='#'>Skip</a> / <a href='#'>Retry</a>"
	
	span.appendChild(success);
	span.appendChild(failed);
	span.appendChild(progress);
	
	span.showSuccess = function() {
		span.style.display = "inline-block";
		success.style.display = "inline-block";
		failed.style.display = "none";
		progress.style.display = "none";
		
		span.success = true;
	}
	span.showFail = function(retryCb) {
		span.style.display = "inline-block";
		success.style.display = "none";
		failed.style.display = "inline-block";
		progress.style.display = "none";
		
		span.success = false;
		
		failed.getElementsByTagName("a")[0].onclick = retryCb
	}
	span.showProgress = function(skipCb, retryCb) {
		span.style.display = "inline-block";
		success.style.display = "none";
		failed.style.display = "none";
		progress.style.display = "inline-block";
		
		progress.getElementsByTagName("a")[0].onclick = skipCb
		progress.getElementsByTagName("a")[1].onclick = retryCb
	}
	span.hide = function() {
		span.style.display = "none";
		span.success = null;
	}
});

function isASCII(str) {
    return /^[\x00-\x7F]*$/.test(str);
}

// TAB EVENT LISTENER

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	if(message.closeThis) {
		if(message.closedErrorMessage) {
			console.log(message.closedErrorMessage); // print error message if tab failed
			tabFinished(false);
		}
		else {
			tabFinished(true);
		}
	}
	else if(message.focusThis) {
		focusPostWindow();
	}
	else if (message.injectToSubframes) {
		chrome.tabs.executeScript(sender.tab.id, {file: "utils.js", allFrames:true}, function() {
			if(chrome.runtime.lastError)
				return;
			chrome.tabs.executeScript(sender.tab.id, {file: message.script, allFrames:true}, function() {
				if(chrome.runtime.lastError)
					return;
				console.log("re injected scripts")
			});
		});
	}
	else if(message.simulateTyping) {
		console.log('simulating typing')
			
		var text = removeEmojis(message.text);
	
		//message.text = message.text.replace("\n", "\r");
		for(var i=0; i<text.length; i++) {
			var char = text[i];
			//console.log("typing: "+char);
			//var keyCode = char.charCodeAt(0);
			
			if(char == "\n") {
				chrome.debugger.sendCommand({tabId: sender.tab.id}, 'Input.dispatchKeyEvent',
				{"type" : "rawKeyDown", "windowsVirtualKeyCode" : 13, "unmodifiedText" : '\r', "text" : '\r'});
				chrome.debugger.sendCommand({tabId: sender.tab.id}, 'Input.dispatchKeyEvent',
				{"type" : "char", "windowsVirtualKeyCode" : 13, "unmodifiedText" : '\r', "text" : '\r'});
				chrome.debugger.sendCommand({tabId: sender.tab.id}, 'Input.dispatchKeyEvent',
				{"type" : "keyUp", "windowsVirtualKeyCode" : 13, "unmodifiedText" : '\r', "text" : '\r'});
			}
			else {
				chrome.debugger.sendCommand({tabId: sender.tab.id}, 'Input.dispatchKeyEvent',
				{"type" : "rawKeyDown", "unmodifiedText" : char, "text" : char});
				chrome.debugger.sendCommand({tabId: sender.tab.id}, 'Input.dispatchKeyEvent',
				{"type" : "char", "unmodifiedText" : char, "text" : char});
				chrome.debugger.sendCommand({tabId: sender.tab.id}, 'Input.dispatchKeyEvent',
				{"type" : "keyUp", "unmodifiedText" : char, "text" : char});
			}
		}
	}
	else if(message.simulateDoubleUpPress) {
		chrome.debugger.sendCommand({tabId: sender.tab.id}, 'Input.dispatchKeyEvent',
		{"type" : "rawKeyDown", "windowsVirtualKeyCode" : 38});
		chrome.debugger.sendCommand({tabId: sender.tab.id}, 'Input.dispatchKeyEvent',
		{"type" : "keyUp", "windowsVirtualKeyCode" : 38});
		
		chrome.debugger.sendCommand({tabId: sender.tab.id}, 'Input.dispatchKeyEvent',
		{"type" : "rawKeyDown", "windowsVirtualKeyCode" : 38});
		chrome.debugger.sendCommand({tabId: sender.tab.id}, 'Input.dispatchKeyEvent',
		{"type" : "keyUp", "windowsVirtualKeyCode" : 38});
	}
	else if(message.simulateCtrlEnter) {
		chrome.debugger.sendCommand({tabId: sender.tab.id}, 'Input.dispatchKeyEvent',
		{"type" : "rawKeyDown", "windowsVirtualKeyCode" : 13, modifiers: 2}); // enter w/ ctrl modifier
		chrome.debugger.sendCommand({tabId: sender.tab.id}, 'Input.dispatchKeyEvent',
		{"type" : "keyUp", "windowsVirtualKeyCode" : 13, modifiers: 2});
	}
	else if(message.simulateBackspace) {
		chrome.debugger.sendCommand({tabId: sender.tab.id}, 'Input.dispatchKeyEvent',
		{"type" : "rawKeyDown", "windowsVirtualKeyCode" : 8});
		chrome.debugger.sendCommand({tabId: sender.tab.id}, 'Input.dispatchKeyEvent',
		{"type" : "keyUp", "windowsVirtualKeyCode" : 8});
	}
	else if(message.simulateClearTextbox) {
		// press end to go to end
		chrome.debugger.sendCommand({tabId: sender.tab.id}, 'Input.dispatchKeyEvent',
		{"type" : "rawKeyDown", "windowsVirtualKeyCode" : 35});
		chrome.debugger.sendCommand({tabId: sender.tab.id}, 'Input.dispatchKeyEvent',
		{"type" : "keyUp", "windowsVirtualKeyCode" : 35});
		
		// backspace all
		for(var i=0;i<250;i++) {
			chrome.debugger.sendCommand({tabId: sender.tab.id}, 'Input.dispatchKeyEvent',
			{"type" : "rawKeyDown", "windowsVirtualKeyCode" : 8, modifiers: 2}); // backspace w/ ctrl modifier
			chrome.debugger.sendCommand({tabId: sender.tab.id}, 'Input.dispatchKeyEvent',
			{"type" : "keyUp", "windowsVirtualKeyCode" : 8, modifiers: 2});
		}
	}
	else if(message.simulateHover) {
		// first simulate move mouse to location
		chrome.debugger.sendCommand({tabId: sender.tab.id}, 'Input.dispatchMouseEvent',
		{"type" : "mouseMoved", "x":message.x, "y":message.y});
	}
	else if(message.simulateClick) {
		// first simulate move mouse to location
		chrome.debugger.sendCommand({tabId: sender.tab.id}, 'Input.dispatchMouseEvent',
		{"type" : "mousePressed", "x":message.x, "y":message.y});
		setTimeout(function() {
			chrome.debugger.sendCommand({tabId: sender.tab.id}, 'Input.dispatchMouseEvent',
			{"type" : "mouseReleased", "x":message.x, "y":message.y});
		}, 100);
	}
	else if(message.spoofMobile) {
		chrome.debugger.sendCommand({tabId: sender.tab.id}, "Network.enable", {}, function(response) {
			// Possible response: response.id / response.error
			// 3. Change the User Agent string!
			chrome.debugger.sendCommand({tabId: sender.tab.id}, "Network.setUserAgentOverride",
			{userAgent: 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Mobile Safari/537.36'},
			function(response) {});
		});
		// first simulate move mouse to location
		chrome.debugger.sendCommand({tabId: sender.tab.id}, 'Input.dispatchMouseEvent',
		{"type" : "mouseMoved", "x":message.x, "y":message.y});
	}
	else if(message.unspoofMobile) {
		chrome.debugger.sendCommand({tabId: sender.tab.id}, "Network.enable", {}, function(response) {
			// Possible response: response.id / response.error
			// 3. Change the User Agent string!
			chrome.debugger.sendCommand({tabId: sender.tab.id}, "Network.setUserAgentOverride",
			{userAgent: navigator.userAgent},
			function(response) {});
		});
	}
});
