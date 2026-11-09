#target bridge

/* PhotoView.io Publish Extension for Adobe Bridge (ExtendScript). */
(function () {
  var VERSION = "1.0.0";
  var DEFAULT_URL = "https://photoview.io";
  var MAX_BYTES = 50 * 1024 * 1024;
  var settingsFile = new File(Folder.userData.fsName + "/PhotoViewIoBridge/settings.txt");

  function trim(value) { return String(value || "").replace(/^\s+|\s+$/g, ""); }
  function quote(value) {
    var text = String(value || "");
    if ($.os.toLowerCase().indexOf("windows") >= 0) return '"' + text.replace(/"/g, '\\"') + '"';
    return "'" + text.replace(/'/g, "'\\''") + "'";
  }
  function jsonString(value) {
    return '"' + String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r/g, "\\r").replace(/\n/g, "\\n") + '"';
  }
  function slugify(value) {
    return trim(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "bridge-portfolio";
  }
  function parseJson(value) {
    try { return eval("(" + value + ")"); } catch (error) { throw new Error("PhotoView.io returned an unreadable response."); }
  }
  function readSettings() {
    var result = { apiUrl: DEFAULT_URL, apiKey: "", galleryName: "Bridge Portfolio", makePublic: false };
    if (!settingsFile.exists || !settingsFile.open("r")) return result;
    var lines = settingsFile.read().split("\n"); settingsFile.close();
    for (var i = 0; i < lines.length; i += 1) {
      var split = lines[i].indexOf("="); if (split < 1) continue;
      var key = lines[i].substring(0, split); var value = lines[i].substring(split + 1);
      if (key === "apiUrl") result.apiUrl = value;
      if (key === "apiKey") result.apiKey = value;
      if (key === "galleryName") result.galleryName = value;
      if (key === "makePublic") result.makePublic = value === "true";
    }
    return result;
  }
  function saveSettings(settings) {
    if (!settingsFile.parent.exists) settingsFile.parent.create();
    if (!settingsFile.open("w")) return;
    settingsFile.write("apiUrl=" + settings.apiUrl + "\napiKey=" + settings.apiKey + "\ngalleryName=" + settings.galleryName + "\nmakePublic=" + (settings.makePublic ? "true" : "false"));
    settingsFile.close();
  }
  function tempJson(body) {
    var file = new File(Folder.temp.fsName + "/photoview-bridge-" + new Date().getTime() + "-" + Math.floor(Math.random() * 100000) + ".json");
    if (!file.open("w")) throw new Error("Adobe Bridge could not create a temporary request file.");
    file.encoding = "UTF-8"; file.write(body); file.close(); return file;
  }
  function request(method, url, apiKey, bodyFile, uploadFile, contentType) {
    var command = "curl --silent --show-error --fail-with-body --max-time 240 -X " + method;
    if (apiKey) command += " -H " + quote("x-photoviewpro-key: " + apiKey);
    command += " -H " + quote("Accept: application/json");
    if (contentType) command += " -H " + quote("Content-Type: " + contentType);
    if (bodyFile) command += " --data-binary @" + quote(bodyFile.fsName);
    if (uploadFile) command += " --upload-file " + quote(uploadFile.fsName);
    command += " " + quote(url);
    var output = app.system(command);
    if (bodyFile && bodyFile.exists) bodyFile.remove();
    return String(output || "");
  }
  function supportedFile(thumb) {
    if (!thumb || !(thumb.spec instanceof File)) return null;
    var file = thumb.spec; var extension = file.name.toLowerCase().split(".").pop();
    var types = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", heif: "image/heif", tif: "image/tiff", tiff: "image/tiff" };
    return types[extension] ? { file: file, type: types[extension] } : null;
  }
  function selectedFiles() {
    var result = []; var selections = app.document ? app.document.selections : [];
    for (var i = 0; i < selections.length; i += 1) { var candidate = supportedFile(selections[i]); if (candidate) result.push(candidate); }
    return result;
  }
  function loadPortfolios(apiUrl, apiKey) {
    if (!apiKey) return [];
    try { return parseJson(request("GET", apiUrl + "/api/bridge/import", apiKey, null, null, null)).portfolios || []; }
    catch (error) { return []; }
  }
  function publish() {
    var files = selectedFiles();
    if (!files.length) { alert("Select one or more finished JPEG, PNG, WebP, HEIC, HEIF, or TIFF photographs in Adobe Bridge, then try again.", "PhotoView.io"); return; }
    var settings = readSettings(); var portfolios = loadPortfolios(settings.apiUrl, settings.apiKey);
    var dialog = new Window("dialog", "Publish to PhotoView.io"); dialog.orientation = "column"; dialog.alignChildren = ["fill", "top"];
    dialog.add("statictext", undefined, files.length + " supported photograph(s) selected. Each file may be up to 50 MB.");
    var urlGroup = dialog.add("group"); urlGroup.add("statictext", undefined, "API URL"); var apiUrl = urlGroup.add("edittext", undefined, settings.apiUrl); apiUrl.characters = 42;
    var keyGroup = dialog.add("group"); keyGroup.add("statictext", undefined, "Private key"); var apiKey = keyGroup.add("edittext", undefined, settings.apiKey, { noecho: true }); apiKey.characters = 42;
    var destination = dialog.add("dropdownlist", undefined, ["Create a new portfolio", "Add to an existing portfolio"]); destination.selection = portfolios.length ? 1 : 0;
    var nameGroup = dialog.add("group"); nameGroup.add("statictext", undefined, "New portfolio"); var galleryName = nameGroup.add("edittext", undefined, settings.galleryName); galleryName.characters = 34;
    var existingGroup = dialog.add("group"); existingGroup.add("statictext", undefined, "Existing portfolio"); var existing = existingGroup.add("dropdownlist", undefined, []); existing.preferredSize.width = 250;
    for (var p = 0; p < portfolios.length; p += 1) existing.add("item", portfolios[p].name); if (existing.items.length) existing.selection = 0;
    var makePublic = dialog.add("checkbox", undefined, "Make a newly created portfolio public"); makePublic.value = settings.makePublic;
    var note = dialog.add("statictext", undefined, "Generate the private key in PhotoView: Settings > Imports > Adobe Bridge.", { multiline: true }); note.preferredSize.width = 470;
    var buttons = dialog.add("group"); buttons.alignment = "right"; buttons.add("button", undefined, "Cancel", { name: "cancel" }); buttons.add("button", undefined, "Publish", { name: "ok" });
    if (dialog.show() !== 1) return;
    var base = trim(apiUrl.text).replace(/\/+$/, ""); var key = trim(apiKey.text);
    if (base !== "https://photoview.io" && base !== "https://www.photoview.io" && !/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(base)) { alert("For security, use https://photoview.io as the API URL.", "PhotoView.io"); return; }
    if (!key) { alert("Paste the private import key from PhotoView.io before publishing.", "PhotoView.io"); return; }
    var useExisting = destination.selection && destination.selection.index === 1;
    if (useExisting && (!existing.selection || !portfolios[existing.selection.index])) { alert("Choose an existing portfolio.", "PhotoView.io"); return; }
    if (!useExisting && !trim(galleryName.text)) { alert("Enter a name for the new portfolio.", "PhotoView.io"); return; }
    saveSettings({ apiUrl: base, apiKey: key, galleryName: galleryName.text, makePublic: makePublic.value });
    var chosen = useExisting ? portfolios[existing.selection.index] : { name: trim(galleryName.text), slug: slugify(galleryName.text) };
    var completed = 0; var failures = [];
    for (var i = 0; i < files.length; i += 1) {
      var current = files[i];
      if (current.file.length <= 0 || current.file.length > MAX_BYTES) { failures.push(current.file.name + ": file must be between 1 byte and 50 MB."); continue; }
      var common = '"destinationMode":' + jsonString(useExisting ? "existing" : "new") + ',"galleryName":' + jsonString(chosen.name) + ',"gallerySlug":' + jsonString(chosen.slug) + ',"makePublic":' + (makePublic.value ? "true" : "false") + ',"fileName":' + jsonString(current.file.name) + ',"photoTitle":' + jsonString(current.file.displayName.replace(/\.[^.]+$/, ""));
      try {
        var startBody = tempJson("{" + common + ',"fileSize":' + current.file.length + ',"fileType":' + jsonString(current.type) + "}");
        var upload = parseJson(request("POST", base + "/api/bridge/import/initiate", key, startBody, null, "application/json"));
        if (!upload.uploadUrl || !upload.reference) throw new Error(upload.error || "Upload authorization was missing.");
        request("PUT", upload.uploadUrl, "", null, current.file, current.type);
        var finishBody = tempJson("{" + common + ',"reference":' + jsonString(upload.reference) + "}");
        var saved = parseJson(request("POST", base + "/api/bridge/import/finalize", key, finishBody, null, "application/json"));
        if (!saved.ok) throw new Error(saved.error || "PhotoView.io could not save the photograph.");
        completed += 1;
      } catch (error) { failures.push(current.file.name + ": " + error.message); }
    }
    var message = completed + " of " + files.length + " photograph(s) published to " + chosen.name + ".";
    if (failures.length) message += "\n\nNot published:\n" + failures.slice(0, 5).join("\n");
    alert(message, "PhotoView.io");
  }

  if (BridgeTalk.appName === "bridge") {
    var menu = MenuElement.find("photoviewIoMenu") || MenuElement.create("menu", "PhotoView.io", "at the end of Tools", "photoviewIoMenu");
    var command = MenuElement.find("photoviewIoPublish") || MenuElement.create("command", "Publish selected photos…", "at the end of photoviewIoMenu", "photoviewIoPublish");
    command.onSelect = publish;
    command.help = "Publish selected finished photographs directly to a PhotoView.io portfolio. Extension v" + VERSION;
  }
}());
