var inputs_to_save = (
	Array.from(document.getElementsByTagName("input")).filter(i => (i.type=="text" || i.type=="checkbox" || i.type=="number"))
	.concat(Array.from(document.getElementsByTagName("textarea")))
	.concat(Array.from(document.getElementsByTagName("select")))
).filter(i => !i.getAttribute("data-nosave") && i.id)

function cacheSaveableInputs() {
	var dict = {};
	inputs_to_save.forEach(function(i) {
		dict[i.id] = i.type == "checkbox"? i.checked : i.value;
	});
	dict["video_tags_input"] = document.getElementById("video_tags_input").getTags()
	chrome.storage.local.set({"remember_inputs": dict}, function() {
		//xx
	});
}

function loadSavedInputs() {
	chrome.storage.local.get(["remember_inputs"], function(result) {
		var dict = result["remember_inputs"];
		if (!dict)
			return;
			
		if (dict["video_tags_input"]) {
			dict["video_tags_input"].forEach(function(t){
				document.getElementById("video_tags_input").addTag(t)
			});
			delete dict["video_tags_input"]
		}
		
		Object.keys(dict).forEach(function(key) {
			var el = document.getElementById(key);
			if(!el)
				return
				
			if(el.type == "checkbox")
				el.checked = dict[key]
			else
				el.value = dict[key];
		});
	});
}

window.addEventListener("load", function() {
	loadSavedInputs();
});
window.addEventListener("beforeunload", function() {
	cacheSaveableInputs();
});
