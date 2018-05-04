module.exports = (Plugin, Api, Vendor) => {
	if (typeof BDFDB !== "object") global.BDFDB = {$: Vendor.$, BDv2Api: Api};
	
	const {$} = Vendor;

	return class extends Plugin {
		initConstructor () {
			this.css = `
				${BDFDB.idCNS.friends+BDFDB.dotCNS.friendstabbaritem+BDFDB.dotCN.badge}:not(.betterfriendcount-badge) {
					display: none !important;
				}
			`;
			
			this.relationshipTypes = {};
		}
		
		onStart () {
			var libraryScript = null;
			if (typeof BDFDB !== "object" || typeof BDFDB.isLibraryOutdated !== "function" || BDFDB.isLibraryOutdated()) {
				libraryScript = document.querySelector('head script[src="https://mwittrien.github.io/BetterDiscordAddons/Plugins/BDFDB.js"]');
				if (libraryScript) libraryScript.remove();
				libraryScript = document.createElement("script");
				libraryScript.setAttribute("type", "text/javascript");
				libraryScript.setAttribute("src", "https://mwittrien.github.io/BetterDiscordAddons/Plugins/BDFDB.js");
				document.head.appendChild(libraryScript);
			}
			this.startTimeout = setTimeout(() => {this.initialize();}, 30000);
			if (typeof BDFDB === "object" && typeof BDFDB.isLibraryOutdated === "function") this.initialize();
			else libraryScript.addEventListener("load", () => {this.initialize();});
			return true;
		}

		initialize () {
			if (typeof BDFDB === "object") {		
				BDFDB.loadMessage(this);
				
				var observer = null;
				
				observer = new MutationObserver((changes, _) => {
					changes.forEach(
						(change, i) => {
							if (change.addedNodes) {
								change.addedNodes.forEach((node) => {
									if (node && node.tagName && node.querySelector(BDFDB.dotCN.friendscolumn)) {
										this.addCountNumbers();
									}
								});
							}
							if (change.removedNodes) {
								change.removedNodes.forEach((node) => {
									if (node && node.tagName && node.querySelector(BDFDB.dotCN.friendscolumn)) {
										this.addCountNumbers();
									}
								});
							}
						}
					);
				});
				BDFDB.addObserver(this, BDFDB.idCN.friends, {name:"friendListObserver",instance:observer}, {childList:true, subtree:true});
				
				observer = new MutationObserver((changes, _) => {
					changes.forEach(
						(change, i) => {
							this.addCountNumbers();
						}
					);
				});
				BDFDB.addObserver(this, BDFDB.dotCN.friendsonline, {name:"friendCountObserver",instance:observer}, {childList:true, subtree:true, characterData:true});
				
				this.FriendUtils = BDFDB.WebModules.findByProperties(["getFriendIDs", "getRelationships"]);
				this.UserMetaStore = BDFDB.WebModules.findByProperties(["getStatuses", "getOnlineFriendCount"]);
				var RelationshipTypes = BDFDB.WebModules.findByProperties(["RelationshipTypes"]).RelationshipTypes;
				for (let type in RelationshipTypes) {
					this.relationshipTypes[RelationshipTypes[type]] = type;
				}
				this.addCountNumbers();

				return true;
			}
			else {
				console.error(this.name + ": Fatal Error: Could not load BD functions!");
				return false;
			}
		}

		onStop () {
			if (typeof BDFDB === "object") {
				document.querySelectorAll(".betterfriendcount-badge").forEach(counter => {counter.remove();});
				
				BDFDB.unloadMessage(this);
				return true;
			}
			else {
				return false;
			}
		}
		
		onSwitch () {
			this.addCountNumbers();
			
			BDFDB.addObserver(this, BDFDB.idCN.friends, {name:"friendListObserver"}, {childList:true, subtree:true});
		}
		
		// begin of own functions
		
		addCountNumbers () {
			var friendstabbar = document.querySelector(BDFDB.idCNS.friends + BDFDB.dotCN.friendstabbar);
			if (!friendstabbar) return;
			friendstabbar.querySelectorAll(".betterfriendcount-badge").forEach(counter => {counter.remove();});
			
			var relationships = this.FriendUtils.getRelationships(), relationshipCount = {};
			for (let type in this.relationshipTypes) {relationshipCount[this.relationshipTypes[type]] = 0;}
			for (let id in relationships) {relationshipCount[this.relationshipTypes[relationships[id]]]++;}
			
			var tabitems = friendstabbar.querySelectorAll(BDFDB.dotCN.friendstabbaritem);
			$(`<div class="badge betterfriendcount-badge friendcount">${relationshipCount.FRIEND}</div>`).appendTo(tabitems[1]);
			$(`<div class="badge betterfriendcount-badge onlinefriendcount">${this.UserMetaStore.getOnlineFriendCount()}</div>`).appendTo(tabitems[2]);
			$(`<div class="badge betterfriendcount-badge requestincount">${relationshipCount.PENDING_INCOMING}</div>`).appendTo(tabitems[3]);
			$(`<div class="badge betterfriendcount-badge requestoutcount">${relationshipCount.PENDING_OUTGOING}</div>`).appendTo(tabitems[3]);
			$(`<div class="badge betterfriendcount-badge blockedcount">${relationshipCount.BLOCKED}</div>`).appendTo(tabitems[4]);
		}
	}
};
