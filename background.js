(function(){
	
	// Tabs to reload
	var tabs = {};
	
	// Context menu items
	var menuItems = {
		"000":{"title": "Cancel", "time": -1},
		"010":{"type": "separator"},
		"020":{"title": "1 Minute", "time": 1*60},
		"030":{"title": "5 Minutes", "time": 5*60},
		"040":{"title": "15 Minutes", "time": 15*60},
		"050":{"title": "30 Minutes", "time": 30*60},
		"060":{"title": "45 Minutes", "time": 45*60},
		"070":{"type": "separator"},
		"080":{"title": "Custom...", "time": '?'}
	};

	/* 
	 * Get unix-like timestamp
	 */
	var utime = function(){ return Math.round(Date.now() / 1000); };

	/*
	 * Get title for page action on specified tab
	 */
	var getPageActionTitle = function(tabInfo) {
		var date = new Date((tabInfo.lastupdate + tabInfo.time) * 1000);
		var time = tabInfo.time > 60 ? (tabInfo.time/60) + "m" : tabInfo.time + "s";
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var seconds = date.getSeconds();
		
		hours = hours < 10 ? "0" + hours : hours;
		minutes = minutes < 10 ? "0" + minutes : minutes;
		seconds = seconds < 10 ? "0" + seconds : seconds;
		
		var title = "Reload every " + time + ". ";
		title += "Next reload: " + hours + ":" + minutes + ":" + seconds + "Hs. "
		title += "Click to cancel"
		
		return title;
	};

	/*
	 * Context Menu click Handler
	 */
	var onClickHandler = function (info, tab) {
		var id = info.menuItemId;
		var time = menuItems[id].time || 0;
		var tabId = parseInt(tab.id,10);
		
		if (time < 0) { cancel(tabId, true); }
		if (time > 0) { setup(tabId, time); }
		if (time === '?') {
			var ctime = window.prompt("Reload every... (minutes)","10");
			if (ctime !== null)	{
				ctime = parseInt(ctime,10) * 60;
				if (ctime > 0) { setup(tabId, ctime); }
			}
		}
	};

	/*
	 * Setup TabRealoder on given tab
	 */
	var setup = function(tabId, time){
		if (tabId in tabs) { clearTimeout(tabs[tabId].timeout); }
		var timeout = setTimeout(function(){reload(tabId)}, time * 1000);
		tabs[tabId] = {"lastupdate": utime(), "time": time, "timeout":timeout};
		chrome.pageAction.show(tabId);
		chrome.pageAction.setTitle({"tabId": tabId, "title": getPageActionTitle(tabs[tabId])});
	};

	/*
	 * Cancel TabReloader on given tab
	 */
	var cancel = function(tabId, removePageAction) {
		if (tabId in tabs) {
			clearTimeout(tabs[tabId].timeout);
			delete tabs[tabId];
			if (removePageAction === true) { chrome.pageAction.hide(tabId); }
		}
	};

	/*
	 * Realod a Tab
	 */
	var reload = function(tabId){
		// Make sure that tab exists and has TabReload enabled
		chrome.tabs.get(tabId, function(tab){
			if (tab && tabId in tabs) {
				chrome.tabs.reload(tabId);
			}
		});
	};

	// Click on page action cancel TabReloader
	chrome.pageAction.onClicked.addListener(function(tab){ cancel(tab.id, true); });

	// When a tab is closed check if has to be removed from tabs configuration
	chrome.tabs.onRemoved.addListener(function(tabId, removeInfo){ cancel(tabId, false); });

	// When a tab is updated(reloaded) reset TabReload configuration
	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){ 
		if (tabId in tabs) { setup(tabId, tabs[tabId].time); }
	});

	// Handle context menu clicks
	chrome.contextMenus.onClicked.addListener(onClickHandler);
	
	/*
	 * Build context menu
	 */
	for (item in menuItems) {
		var type = 'type' in menuItems[item] ? menuItems[item].type : 'normal';
		chrome.contextMenus.create({"title": menuItems[item].title, "type": type, "id": item});
	}
	
})();