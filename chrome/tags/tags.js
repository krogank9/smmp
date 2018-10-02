[].forEach.call(document.getElementsByClassName('tags-input'), function (el) {
	let mainInput = document.createElement('input'),
		tags = [],
		MAX_TAGS = 20
		
	//el.addEventListener('click', function() {mainInput.focus()})

	mainInput.setAttribute('type', 'text');
	mainInput.classList.add('main-input');
	mainInput.addEventListener('blur', function (e) {
		if (tags.length < MAX_TAGS) {
			let filteredTag = filterTag(mainInput.value);
			if (filteredTag.length > 0)
				addTag(filteredTag);
			mainInput.value = '';
		}
	})
	mainInput.addEventListener('keydown', function (e) {
		let keyCode = e.which || e.keyCode;
		if (keyCode === 13 && tags.length < MAX_TAGS) {
			let filteredTag = filterTag(mainInput.value);
			if (filteredTag.length > 0)
				addTag(filteredTag);
			mainInput.value = '';
		}
	});

	mainInput.addEventListener('keydown', function (e) {
		let keyCode = e.which || e.keyCode;
		if (keyCode === 8 && mainInput.value.length === 0 && tags.length > 0) {
			removeTag(tags.length - 1);
		}
	});

	el.appendChild(mainInput);

	//addTag('hello!');

	function addTag (text) {
		if(el.getTags().indexOf(text) != -1) {
			removeTag( el.getTags().indexOf(text) )
		}
		
		let tag = {
			text: text,
			element: document.createElement('span'),
		};

		tag.element.classList.add('tag');
		tag.element.textContent = tag.text;

		let closeBtn = document.createElement('span');
		closeBtn.classList.add('close');
		closeBtn.addEventListener('click', function () {
			removeTag(tags.indexOf(tag));
		});
		tag.element.appendChild(closeBtn);

		tags.push(tag);

		el.insertBefore(tag.element, mainInput);
		
		if(el.tagsChanged) {
			el.tagsChanged();
		}
	}

	function removeTag (index) {
		let tag = tags[index];
		tags.splice(index, 1);
		el.removeChild(tag.element);
		
		if(el.tagsChanged) {
			el.tagsChanged();
		}
	}

	function filterTag (tag) {
		return tag.replace(/[^\w -]/g, '').trim().replace(/\W+/g, ' ');
	}
	
	el.getTags = function() {
		return tags.map(function(t) {
			return t.text;
		});
	}
	el.addTag = function(t) {
		addTag(t)
	}
});
