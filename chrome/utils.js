function $(id) { return document.getElementById(id) }
function _G(id) { return document.getElementById(id) }
function getClass(name) { return Array.from(document.getElementsByClassName(name)) }
function getId(id) { return document.getElementById(id) }
function getTags(tagName) { return Array.from(document.getElementsByTagName(tagName)) }
function getInputs(type) { return getTags("input").filter(function(inp){return inp.type == type}) }

// stuff for site injection:

function simulateEnterPress(el) {
	const enterPress = new KeyboardEvent("keydown", {
		bubbles: true, cancelable: true, keyCode: 13
	});
	el.dispatchEvent(enterPress);
}

function getVideoLink() {
	if(video_info.video_to_link == "youtube")
		return video_info.youtube_video_link || "";
	else
		return video_info.bitchute_video_link || "";
}

function simulateTypeText(text_, cb) {
	chrome.runtime.sendMessage({simulateTyping:true, text:text_});
	if(cb) {
		// wait 500 ms for every 50 chars
		if(text_.length < 50)
			setTimeout(cb, 500);
		else
			setTimeout(cb, 2500);
	}
}
function simulateCtrlEnter(cb) {
	chrome.runtime.sendMessage({simulateCtrlEnter:true});
	setTimeout(cb, 500);
}
function simulateDoubleUpPress() {
	chrome.runtime.sendMessage({simulateDoubleUpPress:true});
}
function simulateClearTextbox(cb) {
	chrome.runtime.sendMessage({simulateClearTextbox:true});
	if(cb)
		setTimeout(cb, 750);
}

function simulateHover(x_,y_) {
	chrome.runtime.sendMessage({simulateHover:true, x:x_, y:y_});
}

function getSocialHeadline() {
	var appendLink = getVideoLink();
	if(appendLink && appendLink.length > 0)
		appendLink = " "+appendLink;
	return (video_info.headline + appendLink).trim();
}

function onFbPage() {
	return !! window.location.href.match(/facebook\.com\/./);
}

function getSocialPostType() {
	if(video_filelist
	|| (video_filelist_full_vid && video_info.fb_page_full_vid && onFbPage()) )
		return "video";
	else if(imgs_filelist)
		return "images";
	else
		return "none";
}

function loadVidInfoFromStorage_Social(cb) {
	chrome.storage.local.get("vid_info", function(result) {
		video_info = result["vid_info"];
		console.log(video_info.social_vid_url)
		blobUrlToFileList(video_info.social_vid_url, function(v_fl) {
			video_filelist = v_fl;
			
			console.log("aaa") 
			
			blobUrlsToFileList(video_info.social_imgs_urls, function(i_fl) {
				console.log("bbb") 
				imgs_filelist = i_fl;
				
				blobUrlToFileList(video_info.vid_url, function(v_fl_full) {
					video_filelist_full_vid = v_fl_full;
					cb();
				}, video_info.upload_vid_file_name);
			}, video_info.social_imgs_file_names);
		}, "vid.mp4");
	});
}

function loadVidInfoFromStorage_Video(cb) {
	chrome.storage.local.get("vid_info", function(result) {
		video_info = result["vid_info"];
		blobUrlToFileList(video_info.vid_url, function(v_fl) {
			video_filelist = v_fl;
			blobUrlToFileList(video_info.thumb_url, function(t_fl) {
				thumb_filelist = t_fl;
				
				blobUrlToFileList(video_info.thumb_url_small, function(t_fl_small) {
					thumb_filelist_small = t_fl_small;
					cb();
				});
			});
		}, video_info.upload_vid_file_name);
	});
}

function wait(condition, callback, timeoutMS, conditionDur, conditionSince_) {
	conditionSince_ = conditionSince_ || Date.now()
	conditionDur = conditionDur || 0
	timeoutMS=timeoutMS||-1;
	if(timeoutMS > 1 || timeoutMS == -1) {
		var nextTimeout = Math.max(timeoutMS-30, 1);
		if(timeoutMS == -1)
			nextTimeout = -1;
		
		// make sure condition remains true for at least 1 second
		if (condition()) {
			if(conditionDur == 0 || Date.now() - conditionSince_ >= conditionDur)
				callback();
			else
				setTimeout(function(){wait(condition, callback, nextTimeout, conditionDur, conditionSince_)}, 100);
		}
		else {
			conditionSince_ = Date.now()
			setTimeout(function(){wait(condition, callback, nextTimeout, conditionDur, conditionSince_)}, 100);
		}
	}
	else if(timeoutMS <= 1) {
		console.log("wait() for " + condition.name + " failed");
	}
}

// remove ending / and www., http is necessary for some sites to detect link
function simplifyUrl(url) {
	var prefix = "http://";
	// remove http
	var parts = url.split("//")
	if(parts.length > 1) {
		url = parts.slice(1).join("");
		//prefix = parts[0]+"//";
	}
	// remove www
	if (url.startsWith("www."))
		url = url.substring("www.".length);
	// remove ending /
	if (url.endsWith("/"))
		url = url.substring(0, url.length-1)
	
	return prefix+url
}

function onlyUnique(value, index, self) { 
	return self.indexOf(value) === index;
}

function makePow2( aSize ){
  return Math.pow( 2, Math.ceil( Math.log( aSize ) / Math.log( 2 ) ) );
}

function closeWindow() {
	window.open('localhost', '_self', '');
	window.close();
}

function extToMime(ext) {
	var dict = {
		"png": "image/png",
		"jpg": "image/jpg",
		"gif": "image/gif",
		
		"mp4": "video/mp4",
		"webm": "video/webm",
		"mkv": "video/mkv",
		"mov": "video/mov",
		"flv": "video/flv",
		"mpeg4": "video/mp4",
		"avi": "video/avi",
		"wmv": "video/wmv",
	};
	return dict[ext] || "image/png";
}

function makeFile(blob, name) {
	var ext = name.split(".").slice(-1)[0];
	var file = new File([blob], name, {type:extToMime(ext)})
	return file;
}

function fileListFromFile(file) {
	const dT = new DataTransfer();
	dT.items.add(file);
	return dT.files;
}

function blobToFileList(blob, name) {//good
	name = name || "img.png"
	
	const dT = new DataTransfer();
	
	var file = makeFile(blob, name)
	console.log(file.type);
	console.log(file)
	dT.items.add(file);

	return dT.files;
}
function blobsToFileList(blobs, names) {//good
	names = names||[];
	
	const dT = new DataTransfer();
	for(var i=0; i<blobs.length; i++) {
		var file = makeFile(blobs[i], names[i])
		dT.items.add(file);
	}
	return dT.files;
}

function halfCanvas(canvas_) {
	var canvas = document.createElement('canvas');
	canvas.width = Math.ceil(canvas_.width/2);
	canvas.height = Math.ceil(canvas_.height/2);
	var ctx = canvas.getContext('2d');
	ctx.drawImage(canvas_, 0, 0, canvas.width, canvas.height);
	
	return canvas;
}

function canvasToImageBlob(canvas) {
	var blobBin = atob(canvas.toDataURL().split(",")[1])
	var array = [];
	for(var i = 0; i < blobBin.length; i++) {
		array.push(blobBin.charCodeAt(i));
	}
	var file=new Blob([new Uint8Array(array)], {type: 'image/png'});
	
	return file;
}

function videoFrameToBlob(video) {
	var canvas = document.createElement('canvas');
	canvas.height = video.videoHeight;
	canvas.width = video.videoWidth;
	var ctx = canvas.getContext('2d');
	ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
	
	return canvasToImageBlob(canvas)
}

function videoFrameToUrl(video) {
	var canvas = document.createElement('canvas');
	canvas.height = video.videoHeight;
	canvas.width = video.videoWidth;
	var ctx = canvas.getContext('2d');
	ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
	
	return canvas.toDataURL()
}

///////////
// clear //
///////////
function clearStorageChunks(saveName) {
	chrome.storage.local.get([saveName], function(result) {
		var info = result[saveName];
		var chunks_arr = new Array(info.chunksCount);
		
		chrome.storage.local.remove([saveName]);
		
		//save blob to chrome.storage
		var chunks_left = chunks_arr.length;
		for (let i=0; i<chunks_arr.length; i++) {
			let saveChunkName = saveName+"_"+i;

			chrome.storage.local.remove([saveChunkName]);
		}
	});
}

//////////
// load //
//////////

function blobUrlToFileList(url, cb, name) {
	if(!url) {
		cb(null);
		return
	}
	
	fetch(url)
	.then(res => res.blob())
	.then(blob => cb(blobToFileList(blob, name)))
}

function blobUrlsToFileList(urls, cb, names) {
	if(!urls || urls.length == 0) {
		cb(null);
		return;
	}
		
	var blobs = [];
	for(var i=0; i<urls.length; i++) {
		fetch(urls[i])
		.then(res => res.blob())
		.then(function(blob) {
			blobs.unshift(blob)
			if(blobs.length == urls.length) {
				cb(blobsToFileList(blobs, names))
			}
		})
	}
}

function loadFileFromStorageChunked(saveName, cb) {
	chrome.storage.local.get([saveName], function(result) {
		var blob_url = result[saveName];
		
		console.log("blob_url: " + blob_url);
		

	});
}

//////////
// save //
//////////

function blobToBase64(blob, cb) {//good
    var reader = new FileReader();
    console.log('loading')
    reader.onload = function() {
		var dataUrl = reader.result;
		console.log('loaded')
		var base64 = dataUrl.split(',')[1];
		cb(base64);
    };
    //console.log("data -> blob...")
    reader.readAsDataURL(blob);
};

function saveFileToStorageChunked(file, saveName, cb) {
	var blob_url = URL.createObjectURL(file);
	console.log("blob_url: " + blob_url);
	//save blob to chrome.storage
	chrome.storage.local.set({[saveName]: blob_url}, function() {
		cb(true);
	});
}

////////////////
// font utils //
////////////////

// textMetrics by Ken Fyrstenberg, Epistemex
function textMetrics(ctx, txt) {

    var tm = ctx.measureText(txt),
        w = tm.width,
        h, el;  // height, div element

    if (typeof tm.fontBoundingBoxAscent === "undefined") {

        // create a div element and get height from that
        el = document.createElement('div');
        el.style.cssText = "position:fixed;font:" + ctx.font +
                           ";padding:0;margin:0;left:-9999px;top:-9999px";
        el.innerHTML = txt;

        document.body.appendChild(el);    
        h = parseInt(getComputedStyle(el).getPropertyValue('height'), 10);
        document.body.removeChild(el);

    } 
    else {
        // in the future ...
        h = tm.fontBoundingBoxAscent + tm.fontBoundingBoxDescent;
    }

    return [w, h];
}

function getOptimalSize(ctx, txt, fontName, tolerance, style) {

    tolerance = (tolerance === undefined) ? 0.02 : tolerance;
    fontName = (fontName === undefined) ? 'sans-serif' : fontName;
    style = (style === undefined) ? '' : style + ' ';

    var w = ctx.canvas.width*0.97,
        h = ctx.canvas.height,
        current = h,
        i = 0,
        max = 100,
        tm,
        wl = w - w * tolerance * 0.5,
        wu = w + w * tolerance * 0.5,
        hl = h - h * tolerance * 0.5,
        hu = h + h * tolerance * 0.5;

    for (; i < max; i++) {

        ctx.font = style + current + 'px ' + fontName;
        tm = textMetrics(ctx, txt);

        if ((tm[0] >= wl && tm[0] <= wu)) {
            return tm;
        }

        if (tm[1] > current) {
            current *= (1 - tolerance);
        } 
        else {
            current *= (1 + tolerance);
        }

    }
    return [-1, -1];
}

// misc

function downloadUrl(url, name) {
	let a = document.createElement('a')
	a.href = url
	a.download = name||"file"
	a.click()
	a.remove();
}

function clamp(v, min, max) {
	return Math.min(Math.max(v, min), max);
}

function getOffset(el) {
  rect = el.getBoundingClientRect();
  return {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY
  }
}

function mergeDicts(a,b){
	Object.keys(b).forEach(function(key) {
		a[key] = b[key]
	});
	return a;
}
