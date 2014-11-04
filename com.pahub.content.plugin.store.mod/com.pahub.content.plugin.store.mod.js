function load_mod_store_plugin(data) {
	setConstant("PAHUB_CLIENT_MODS_DIR", path.join(constant.PA_DATA_DIR, "mods"));
	setConstant("PAHUB_SERVER_MODS_DIR", path.join(constant.PA_DATA_DIR, "server_mods"));
			
	//Windows PAMM auto-created mod
	if (fs.existsSync(path.join(constant.PAHUB_CLIENT_MODS_DIR, "rPAMM")) == true) {
		deleteFolderRecursive(path.join(constant.PAHUB_CLIENT_MODS_DIR, "rPAMM"));
	}
	//Non-Windows PAMM auto-created mod
	if (fs.existsSync(path.join(constant.PAHUB_CLIENT_MODS_DIR, "PAMM")) == true) {
		deleteFolderRecursive(path.join(constant.PAHUB_CLIENT_MODS_DIR, "PAMM"));
	}
	//this can be removed down the track, it was only used in one release
	if (fs.existsSync(path.join(constant.PAHUB_CLIENT_MODS_DIR, "com.pa.raevn.rpamm")) == true) {
		deleteFolderRecursive(path.join(constant.PAHUB_CLIENT_MODS_DIR, "com.pa.raevn.rpamm"));
	}
	
	
	if (fs.existsSync(path.join(constant.PAHUB_CLIENT_MODS_DIR, "com.pa.pahub.mods.client", "ui", "mods")) == false) {
		mkdirp.sync(path.join(constant.PAHUB_CLIENT_MODS_DIR, "com.pa.pahub.mods.client", "ui", "mods"));
	}
	if (fs.existsSync(path.join(constant.PAHUB_CLIENT_MODS_DIR, "com.pa.pahub.mods.client", "modinfo.json")) == false) {
		var modinfoJSON = {
			"context": "client",
			"identifier": "com.pa.pahub.mods.client",
			"display_name": "PA Mod Manager",
			"description": " ",
			"author": "pahub",
			"version": "1.0.0",
			"signature": "not yet implemented",
			"priority": 0,
			"enabled": true,
			"content_id": "com.pa.pahub.mods.client",
			"store_id": "com.pahub.content.plugin.store.mod.client"
		};
		writeJSONtoFile(path.join(constant.PAHUB_CLIENT_MODS_DIR, "com.pa.pahub.mods.client", "modinfo.json"), modinfoJSON);
	}
	
	data.content_id = "com.pahub.content.plugin.store.mod.client";
	data.display_name = "Client Mod Store";
	pahub.api.content.addContentStore(data.content_id, data.display_name, data);
	
	var data2 = $.extend({}, data);
	data2.content_id = "com.pahub.content.plugin.store.mod.server";
	data2.display_name = "Server Mod Store";
	data2.local_content_path = "server_mods",
	data2.content_name = "Server Mod",
	data2.content_colour = [255,0,140];
	
	pahub.api.content.addContentStore(data2.content_id, data2.display_name, data2);
	
	model.content["mods"] = {
		mod_category_names: ko.observableArray(),
		online_mod_category_names: ko.observableArray()
	}
	
	var client_store = model.content.content_stores()[getMapItemIndex(model.content.content_stores(), "store_id", "com.pahub.content.plugin.store.mod.client")];
	var server_store = model.content.content_stores()[getMapItemIndex(model.content.content_stores(), "store_id", "com.pahub.content.plugin.store.mod.server")];
	
	var change_func = function(changes, store) {
		var local_categories = model.content.mods.mod_category_names;
		var online_categories = model.content.mods.online_mod_category_names;
		
		changes.forEach(function (change) {
			if (change.status == "added") {
				if(change.value.data.hasOwnProperty("category") == true) {
					for (var i = 0; i < change.value.data.category.length; i++) {
						if (change.value.local == true) {
							if (local_categories.indexOf(change.value.data.category[i].toLowerCase()) == -1) {
								local_categories.push(change.value.data.category[i].toLowerCase());
							}
						} else {
							if (online_categories.indexOf(change.value.data.category[i].toLowerCase()) == -1) {
								online_categories.push(change.value.data.category[i].toLowerCase());
							}
						}
					}
					local_categories.sort(function(left, right) {
						return left == right ? 0 : (left < right ? -1 : 1);
					});
					online_categories.sort(function(left, right) {
						return left == right ? 0 : (left < right ? -1 : 1);
					});
				}
			}
			if (change.status == "deleted") {
				var categories = [];
				
				for (var i = 0; i < store.online_content_items().length; i++) {
					if(store.online_content_items()[i].data.hasOwnProperty("category") == true) {
						for (var j = 0; j < store.online_content_items()[i].data.category.length; j++) {
							if (categories.indexOf(store.online_content_items()[i].data.category[j].toLowerCase()) == -1) {
								categories.push(store.online_content_items()[i].data.category[j].toLowerCase());
							}
						}
					}
				}
				
				model.content.mods.online_mod_category_names(categories);
			}
		});
	};
		
	client_store.local_content_items.subscribe(function(changes) { change_func(changes, client_store); }, null, "arrayChange");
	client_store.online_content_items.subscribe(function(changes) {	change_func(changes, client_store); }, null, "arrayChange");
	server_store.local_content_items.subscribe(function(changes) {change_func(changes, server_store);	}, null, "arrayChange");
	server_store.online_content_items.subscribe(function(changes) {	change_func(changes, server_store);	}, null, "arrayChange");
	
	pahub.api.content.addFilterOption(true, "Category", "data-contains", "category", "toggle", model.content.mods.mod_category_names, model.content.mods.mod_category_names);
	pahub.api.content.addFilterOption(false, "Category", "data-contains", "category", "toggle", model.content.mods.online_mod_category_names, model.content.mods.online_mod_category_names);
}

function unload_mod_store_plugin(data) {
	pahub.api.content.removeContentStore("com.pahub.content.plugin.store.mod.server");
	pahub.api.content.removeFilterOption(true, "Category", "data-contains", "category");
	pahub.api.content.removeFilterOption(false, "Category", "data-contains", "category");
}

function store_mod_enabled(content) {}

function store_mod_disabled(content) {
}

function mod_store_write_content(content_item) {
	var data = $.extend({}, content_item.data);
	data.enabled = data.enabled();
	writeJSONtoFile(path.normalize(content_item.url), data);
	mod_store_write_mod_files(content_item.store_id);
}

function mod_store_write_mod_files(store_id) {
	modsJSON = { "mount_order": [] };
	global_mod_list = [];
	scene_mod_list = {};
	//todo: prioritise/ ordering of mods
	
	var store = pahub.api.content.getContentStore(store_id);
	var local_items = store.local_content_items();
	
	local_items.sort(function(left, right) {
		var left_priority = left.data.priority || 100;
		var right_priority = right.data.priority || 100;
		return left_priority == right_priority ? 0 : (left_priority < right_priority ? -1 : 1);
	});
	
	local_items.forEach(function(item) {
		if (item.data.enabled() == true) {
			modsJSON.mount_order.push(item.content_id);
			
			if (item.data.hasOwnProperty("scenes") == true) {
				for (var scene in item.data.scenes) {
					if (scene == "global_mod_list") {
						global_mod_list = global_mod_list.concat(item.data.scenes[scene]);
					} else {
						if (scene_mod_list.hasOwnProperty(scene) == true) {
							scene_mod_list[scene] = scene_mod_list[scene].concat(item.data.scenes[scene]);
						} else {
							scene_mod_list[scene] = [].concat(item.data.scenes[scene]);
						}
					}
				}
			}
		}
	});
		

	var ui_mods_listJSON = "var global_mod_list = " + JSON.stringify(global_mod_list, null, 4) + ";\n" + "var scene_mod_list = " + JSON.stringify(scene_mod_list, null, 4) + ";\n";
	if (store_id == "com.pahub.content.plugin.store.mod.client") {
		writeJSONtoFile(path.join(constant.PAHUB_CLIENT_MODS_DIR, "mods.json"), modsJSON);
		writeToFile(path.join(constant.PAHUB_CLIENT_MODS_DIR, "com.pa.pahub.mods.client", "ui", "mods", "ui_mod_list.js"), ui_mods_listJSON);
	} else if (store_id == "com.pahub.content.plugin.store.mod.server") {
		writeJSONtoFile(path.join(constant.PAHUB_SERVER_MODS_DIR, "mods.json"), modsJSON);
	}
}

function mod_store_install_content(content_id) {
	var content = pahub.api.content.getContentItem(false, content_id);
	extractZip(path.join(constant.PAHUB_CACHE_DIR, content_id + ".zip"), 
		content_id, 
		path.join(constant.PA_DATA_DIR, content.store.data.local_content_path), 
		getZippedFilePath(path.join(constant.PAHUB_CACHE_DIR, content_id + ".zip"), "modinfo.json")
	);
}

function mod_store_find_online_content(store_id, catalogJSON) {
	var store = pahub.api.content.getContentStore(store_id);
	
	for (var i = 0; i < catalogJSON.length; i++) {
		catalogJSON[i].content_id = catalogJSON[i].identifier;
		catalogJSON[i].store_id = store_id;
		catalogJSON[i].store = store;
		
		if (catalogJSON[i].hasOwnProperty("dependencies") == true && catalogJSON[i].hasOwnProperty("required") == false) {
			catalogJSON[i]["required"] = {};
			catalogJSON[i].dependencies.forEach(function(item) {
				catalogJSON[i].required[item] = "*";
			});
		} else if (catalogJSON[i].hasOwnProperty("required") == true) {
			catalogJSON[i]["dependencies"] = [];
			for (var key in catalogJSON[i].required) {
				catalogJSON[i].dependencies.push(key);
			}
		}
		
		if (store_id == "com.pahub.content.plugin.store.mod.client" && catalogJSON[i].context == "client") {
			pahub.api.log.addLogMessage("verb", "Found online " + store.data.content_name + ": '" + catalogJSON[i].content_id + "'");
		}
		if (store_id == "com.pahub.content.plugin.store.mod.server" && catalogJSON[i].context == "server") {
			pahub.api.log.addLogMessage("verb", "Found online " + store.data.content_name + ": '" + catalogJSON[i].content_id + "'");
		}
	}
	for (var i = 0; i < catalogJSON.length; i++) {
		if (store_id == "com.pahub.content.plugin.store.mod.client" && catalogJSON[i].context == "client") {
			pahub.api.content.addContentItem(false, store_id, catalogJSON[i].content_id, catalogJSON[i].display_name, "", catalogJSON[i]);
		}
		if (store_id == "com.pahub.content.plugin.store.mod.server" && catalogJSON[i].context == "server") {
			pahub.api.content.addContentItem(false, store_id, catalogJSON[i].content_id, catalogJSON[i].display_name, "", catalogJSON[i]);
		}
	}
	pahub.api.resource.loadResource("http://pamm-mereth.rhcloud.com/api/usage", "save", {
		saveas: "com.pahub.content.plugin.store.mod.usage.json", 
		name: "Mod download information",
		mode: "async",
		success: function(data) {
			var jsonData = readJSONfromFile(path.join(constant.PAHUB_CACHE_DIR, "com.pahub.content.plugin.store.mod.usage.json"));
			if (jsonData != false) {
				for(var i = 0; i < jsonData.length; i++) {
					var content = pahub.api.content.getContentItem(false, jsonData[i].identifier);
					if (content) {
						content.downloads(jsonData[i].total);
					} else {
						//
					}
				}
			}
			pahub.api.content.applySort(false, pahub.api.content.getSort(false));
		}
	});
}

function mod_store_find_local_content(store_id) {

	var store = pahub.api.content.getContentStore(store_id);
	var content_queue = [];
	
	var find_mods_in_folders = function(baseFolder, folders) {
		for (var i = 0; i < folders.length; i++) {
			if (fs.existsSync(path.join(baseFolder, folders[i], "modinfo.json")) == true) {
				var contentInfo = readJSONfromFile(path.join(baseFolder, folders[i], "modinfo.json"));
				contentInfo.content_id = contentInfo.identifier;
				contentInfo.store_id = store_id;
				
				if (contentInfo.hasOwnProperty("dependencies") == true && contentInfo.hasOwnProperty("required") == false) {
					contentInfo["required"] = {};
					contentInfo.dependencies.forEach(function(item) {
						contentInfo.required[item] = "*";
					});
				} else if (contentInfo.hasOwnProperty("required") == true) {
					contentInfo["dependencies"] = [];
					for (var key in contentInfo.required) {
						contentInfo.dependencies.push(key);
					}
				}
				
				if (store_id == "com.pahub.content.plugin.store.mod.client" && contentInfo.context == "client" || store_id == "com.pahub.content.plugin.store.mod.server" && contentInfo.context == "server") {
					content_queue.push({
						content_id: contentInfo.content_id,
						store_id: store_id,
						url: path.join(baseFolder, folders[i], "modinfo.json"),
						data: contentInfo
					});
				}
			}
		}
	}
	
	var folders = getSubFolders(path.join(constant.PA_DATA_DIR, store.data.local_content_path));
	find_mods_in_folders(path.join(constant.PA_DATA_DIR, store.data.local_content_path), folders);
	
	//TODO: These aren't updated when changing between PTE & Stable
	var stockmodsFolder = "client";
	if (store_id == "com.pahub.content.plugin.store.mod.server") {
		stockmodsFolder = "server";
	}
	if (model.stream() == "PTE") {
		folders = getSubFolders(path.join(constant.PA_PTE_DIR, "media", "stockmods", stockmodsFolder + "/"));
		find_mods_in_folders(path.join(constant.PA_PTE_DIR, "media", "stockmods", stockmodsFolder + "/"), folders);
	}
	if (model.stream() == "STABLE" || model.stream() == "STEAM" ) {
		folders = getSubFolders(path.join(constant.PA_STABLE_DIR, "media", "stockmods", stockmodsFolder + "/"));
		find_mods_in_folders(path.join(constant.PA_STABLE_DIR, "media", "stockmods", stockmodsFolder + "/"), folders);
	}
	
	
	return content_queue;
}