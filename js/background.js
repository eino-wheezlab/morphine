(function () { "use strict";

/*** setup ***/
var version = "1.0.0";

!Data.has("charge-interval") && Data.set("charge-interval", 10);
!Data.has("charge-size") && Data.set("charge-size", 1);

!Data.has("target-block") && Data.set("target-block", []);
!Data.has("target-allow") && Data.set("target-allow", []);

chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });


/*** state ***/
var state = window.state = {
	balance: 0,
	meter: 0,
	add: {
		id: -1,
		fn: function () {
			var size = Data.get("charge-size"),
				balance = state.balance + size,
				max = (size * (60 / Data.get("charge-interval"))) * 12;
			
			state.balance = Math.min(balance, max);
			state.sync();
		},
		start: function () {
			clearInterval(state.add.id);
			
			state.add.id = setInterval(state.add.fn, 1000 * 60 * Data.get("charge-interval"));
		}
	},
	use: {
		id: null,
		fn: function () {
			if (--state.meter === 0) {
				clearInterval(state.use.id);
				state.use.id = null;
			}
			
			state.use.display();
		},
		start: function () {
			if (!state.use.id) {
				state.use.id = setInterval(state.use.fn, 1000 * 60);
			}
			
			state.use.display();
		},
		display: function () {
			chrome.browserAction.setBadgeText({ text: state.meter ? state.meter.toString() : "" });
			
			state.sync();
		}
	},
	sync: function () {
		chrome.extension.getViews({ type: "tab" }).forEach(function (tab) {
			tab.update();
		});
	}
};

state.add.start();


/*** monitoring ***/
var check = function (url, tID) {
	if (state.meter) {
		return;
	}
	
	var block = Data.get("target-block"),
		allow = Data.get("target-allow"),
		uri = new Uri(url);
	
	var apply = function (rule) {
		var rule = new Uri(rule),
			uhost = uri.host(),
			rhost = rule.host(),
			upath = uri.path(),
			rpath = rule.path(),
			index = uhost.indexOf(rhost);
		
		return index !== -1 && index === uhost.length - rhost.length && (index > 0 ? uhost[index - 1] === "." : true)
			&& upath.indexOf(rpath) === 0 && (upath.length > rpath.length ? (rpath.substr(-1) === "/" || upath[rpath.length] === "/") : true);
	};
	
	var matches = block.some(function (rule) {
		if (apply(rule)) {
			var allowed = allow.some(function (rule) {
				return apply(rule);
			});
			
			if (!allowed) {
				return true;
			}
		}
	});
	
	matches && chrome.tabs.update(tID, {
		url: "popup.html?" + encodeURIComponent(url)
	});
};

chrome.tabs.onCreated.addListener(function (tab) {
	tab.url && check(tab.url, tab.id);
});

chrome.tabs.onUpdated.addListener(function (tID, changed, tab) {
	changed.url && check(changed.url, tID);
});

})();