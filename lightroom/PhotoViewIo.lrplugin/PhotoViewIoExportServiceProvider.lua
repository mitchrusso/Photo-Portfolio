local LrDialogs = import "LrDialogs"
local LrFileUtils = import "LrFileUtils"
local LrHttp = import "LrHttp"
local LrPathUtils = import "LrPathUtils"
local LrTasks = import "LrTasks"
local LrView = import "LrView"

local bind = LrView.bind

local exportServiceProvider = {}

local function decodeJson(text)
  local position = 1

  local function skipWhitespace()
    while text:sub(position, position):match("%s") do
      position = position + 1
    end
  end

  local function decodeCodePoint(hex)
    local code = tonumber(hex, 16)
    if not code then error("Invalid Unicode escape") end
    if code <= 0x7f then
      return string.char(code)
    elseif code <= 0x7ff then
      return string.char(
        0xc0 + math.floor(code / 0x40),
        0x80 + (code % 0x40)
      )
    end
    return string.char(
      0xe0 + math.floor(code / 0x1000),
      0x80 + (math.floor(code / 0x40) % 0x40),
      0x80 + (code % 0x40)
    )
  end

  local function parseString()
    if text:sub(position, position) ~= '"' then error("Expected string") end
    position = position + 1
    local parts = {}
    while position <= #text do
      local character = text:sub(position, position)
      if character == '"' then
        position = position + 1
        return table.concat(parts)
      elseif character == "\\" then
        local escaped = text:sub(position + 1, position + 1)
        local replacements = {
          ['"'] = '"',
          ["\\"] = "\\",
          ["/"] = "/",
          ["b"] = "\b",
          ["f"] = "\f",
          ["n"] = "\n",
          ["r"] = "\r",
          ["t"] = "\t",
        }
        if escaped == "u" then
          table.insert(parts, decodeCodePoint(text:sub(position + 2, position + 5)))
          position = position + 6
        elseif replacements[escaped] then
          table.insert(parts, replacements[escaped])
          position = position + 2
        else
          error("Invalid string escape")
        end
      else
        table.insert(parts, character)
        position = position + 1
      end
    end
    error("Unterminated string")
  end

  local parseValue

  local function parseArray()
    local result = {}
    position = position + 1
    skipWhitespace()
    if text:sub(position, position) == "]" then
      position = position + 1
      return result
    end
    while true do
      table.insert(result, parseValue())
      skipWhitespace()
      local separator = text:sub(position, position)
      if separator == "]" then
        position = position + 1
        return result
      elseif separator ~= "," then
        error("Expected array separator")
      end
      position = position + 1
    end
  end

  local function parseObject()
    local result = {}
    position = position + 1
    skipWhitespace()
    if text:sub(position, position) == "}" then
      position = position + 1
      return result
    end
    while true do
      skipWhitespace()
      local key = parseString()
      skipWhitespace()
      if text:sub(position, position) ~= ":" then error("Expected object separator") end
      position = position + 1
      result[key] = parseValue()
      skipWhitespace()
      local separator = text:sub(position, position)
      if separator == "}" then
        position = position + 1
        return result
      elseif separator ~= "," then
        error("Expected object separator")
      end
      position = position + 1
    end
  end

  parseValue = function()
    skipWhitespace()
    local character = text:sub(position, position)
    if character == '"' then return parseString() end
    if character == "{" then return parseObject() end
    if character == "[" then return parseArray() end
    if text:sub(position, position + 3) == "true" then
      position = position + 4
      return true
    end
    if text:sub(position, position + 4) == "false" then
      position = position + 5
      return false
    end
    if text:sub(position, position + 3) == "null" then
      position = position + 4
      return nil
    end
    local numberText = text:sub(position):match("^-?%d+%.?%d*[eE]?[+-]?%d*")
    if numberText and numberText ~= "" then
      position = position + #numberText
      return tonumber(numberText)
    end
    error("Invalid JSON value")
  end

  local result = parseValue()
  skipWhitespace()
  if position <= #text then error("Unexpected JSON content") end
  return result
end

local function encodeJsonString(value)
  local text = tostring(value or "")
  text = text:gsub("\\", "\\\\")
  text = text:gsub('"', '\\"')
  text = text:gsub("\b", "\\b")
  text = text:gsub("\f", "\\f")
  text = text:gsub("\n", "\\n")
  text = text:gsub("\r", "\\r")
  text = text:gsub("\t", "\\t")
  return '"' .. text .. '"'
end

local function encodeJsonObject(values)
  local parts = {}
  for key, value in pairs(values) do
    local encodedValue
    if type(value) == "boolean" then
      encodedValue = value and "true" or "false"
    elseif type(value) == "number" then
      encodedValue = tostring(value)
    else
      encodedValue = encodeJsonString(value)
    end
    table.insert(parts, encodeJsonString(key) .. ":" .. encodedValue)
  end
  return "{" .. table.concat(parts, ",") .. "}"
end

local function responseError(body, fallback)
  if body and body ~= "" then
    local succeeded, decoded = LrTasks.pcall(decodeJson, body)
    if succeeded and type(decoded) == "table" and decoded.error then
      if type(decoded.error) == "table" and decoded.error.message then return tostring(decoded.error.message) end
      return tostring(decoded.error)
    end
  end
  return fallback
end

local CURRENT_PLUGIN_VERSION = "0.3.1.5"
local PLUGIN_DOWNLOAD_URL = "https://photoview.io/downloads/PhotoViewIo-Lightroom-Plugin.zip"

local function versionParts(value)
  local parts = {}
  for numberText in tostring(value or ""):gmatch("%d+") do
    table.insert(parts, tonumber(numberText) or 0)
  end
  return parts
end

local function isNewerVersion(candidate, installed)
  local candidateParts = versionParts(candidate)
  local installedParts = versionParts(installed)
  local length = math.max(#candidateParts, #installedParts)
  for index = 1, length do
    local candidatePart = candidateParts[index] or 0
    local installedPart = installedParts[index] or 0
    if candidatePart > installedPart then return true end
    if candidatePart < installedPart then return false end
  end
  return false
end

exportServiceProvider.exportPresetFields = {
  { key = "apiBaseUrl", default = "https://photoview.io" },
  { key = "apiKey", default = "" },
  { key = "destinationMode", default = "new" },
  { key = "existingGallerySlug", default = "" },
  { key = "galleryName", default = "Lightroom Portfolio" },
  { key = "clientName", default = "" },
  { key = "makePublic", default = false },
}

local function normalizeBaseUrl(value)
  local baseUrl = value or ""
  baseUrl = baseUrl:gsub("%s+", "")
  baseUrl = baseUrl:gsub("/+$", "")
  return baseUrl
end

local function isAllowedBaseUrl(value)
  return value == "https://photoview.io"
    or value == "https://www.photoview.io"
    or value:match("^http://localhost:%d+$") ~= nil
    or value:match("^http://127%.0%.0%.1:%d+$") ~= nil
end

local function refreshPortfolios(propertyTable)
  local baseUrl = normalizeBaseUrl(propertyTable.apiBaseUrl)
  local apiKey = propertyTable.apiKey or ""

  if baseUrl == "" or apiKey == "" then
    propertyTable.portfolioStatus = "Paste the API URL and API key, then refresh."
    return
  end
  if not isAllowedBaseUrl(baseUrl) then
    propertyTable.portfolioStatus = "For security, use https://photoview.io as the API URL."
    return
  end

  propertyTable.portfolioStatus = "Refreshing PhotoView.io portfolios..."
  LrTasks.startAsyncTask(function()
    local body, responseHeaders = LrHttp.get(baseUrl .. "/api/lightroom/import", {
      { field = "Accept", value = "application/json" },
      { field = "x-photoviewpro-key", value = apiKey },
    }, 20)

    if not body or not responseHeaders or responseHeaders.status ~= 200 then
      propertyTable.portfolioItems = {}
      propertyTable.portfolioStatus = "Could not load portfolios. Check the URL and key, then try again."
      return
    end

    local decodeSucceeded, decoded = LrTasks.pcall(decodeJson, body)
    if not decodeSucceeded or type(decoded) ~= "table" then
      propertyTable.portfolioStatus = "PhotoView.io returned an unreadable portfolio list. Please try again."
      return
    end
    local items = {}
    for _, portfolio in ipairs(decoded.portfolios or {}) do
      table.insert(items, { title = portfolio.name, value = portfolio.slug })
    end

    propertyTable.portfolioItems = items
    if #items > 0 then
      local selectedStillExists = false
      for _, item in ipairs(items) do
        if item.value == propertyTable.existingGallerySlug then selectedStillExists = true end
      end
      if not selectedStillExists then propertyTable.existingGallerySlug = items[1].value end
      propertyTable.portfolioStatus = string.format("%d portfolio(s) available.", #items)
    else
      propertyTable.existingGallerySlug = ""
      propertyTable.portfolioStatus = "No portfolios yet. Choose Create a new portfolio."
    end
  end, "Refresh PhotoView.io portfolios")
end

local function checkForPluginUpdate(propertyTable)
  if propertyTable.pluginVersionCheckStarted then return end
  propertyTable.pluginVersionCheckStarted = true
  propertyTable.pluginDownloadUrl = PLUGIN_DOWNLOAD_URL
  propertyTable.pluginDownloadLabel = "Download current version"
  propertyTable.pluginVersionStatus = "Installed v" .. CURRENT_PLUGIN_VERSION .. ". Checking for updates..."

  local baseUrl = normalizeBaseUrl(propertyTable.apiBaseUrl)
  if not isAllowedBaseUrl(baseUrl) then
    propertyTable.pluginVersionStatus = "Installed v" .. CURRENT_PLUGIN_VERSION .. ". Update check requires the PhotoView.io API URL."
    return
  end

  LrTasks.startAsyncTask(function()
    local body, responseHeaders = LrHttp.get(baseUrl .. "/api/lightroom/plugin-version", {
      { field = "Accept", value = "application/json" },
    }, 20)
    if not body or not responseHeaders or responseHeaders.status ~= 200 then
      propertyTable.pluginVersionStatus = "Installed v" .. CURRENT_PLUGIN_VERSION .. ". Automatic update check is temporarily unavailable."
      return
    end
    local decodeSucceeded, decoded = LrTasks.pcall(decodeJson, body)
    if not decodeSucceeded or type(decoded) ~= "table" or not decoded.version then
      propertyTable.pluginVersionStatus = "Installed v" .. CURRENT_PLUGIN_VERSION .. ". PhotoView.io returned unreadable update information."
      return
    end
    propertyTable.pluginDownloadUrl = decoded.downloadUrl or PLUGIN_DOWNLOAD_URL
    if isNewerVersion(decoded.version, CURRENT_PLUGIN_VERSION) then
      propertyTable.pluginDownloadLabel = "Download update"
      propertyTable.pluginVersionStatus = "Update available: v" .. tostring(decoded.version) .. " (installed v" .. CURRENT_PLUGIN_VERSION .. ")."
    else
      propertyTable.pluginDownloadLabel = "Download current version"
      propertyTable.pluginVersionStatus = "Installed v" .. CURRENT_PLUGIN_VERSION .. " is current."
    end
  end, "Check for PhotoView.io plug-in updates")
end

function exportServiceProvider.sectionsForTopOfDialog(viewFactory, propertyTable)
  propertyTable.portfolioItems = propertyTable.portfolioItems or {}
  propertyTable.portfolioStatus = propertyTable.portfolioStatus or "Paste the API URL and API key, then refresh."
  checkForPluginUpdate(propertyTable)

  return {
    {
      title = "PhotoView.io Portfolio",
      viewFactory:row {
        spacing = viewFactory:control_spacing(),
        viewFactory:static_text {
          title = "API URL",
          width = 120,
        },
        viewFactory:edit_field {
          value = bind "apiBaseUrl",
          width_in_chars = 42,
        },
      },
      viewFactory:row {
        spacing = viewFactory:control_spacing(),
        viewFactory:static_text {
          title = "API Key",
          width = 120,
        },
        viewFactory:password_field {
          value = bind "apiKey",
          width_in_chars = 42,
        },
      },
      viewFactory:row {
        spacing = viewFactory:control_spacing(),
        viewFactory:static_text {
          title = "Destination",
          width = 120,
        },
        viewFactory:popup_menu {
          value = bind "destinationMode",
          items = {
            { title = "Create a new portfolio", value = "new" },
            { title = "Add to an existing portfolio", value = "existing" },
          },
          width_in_chars = 42,
        },
      },
      viewFactory:row {
        spacing = viewFactory:control_spacing(),
        viewFactory:static_text { title = "New portfolio name", width = 120 },
        viewFactory:edit_field {
          enabled = bind { key = "destinationMode", transform = function(value) return value == "new" end },
          value = bind "galleryName",
          width_in_chars = 42,
        },
      },
      viewFactory:row {
        spacing = viewFactory:control_spacing(),
        viewFactory:static_text { title = "Existing portfolio", width = 120 },
        viewFactory:popup_menu {
          enabled = bind { key = "destinationMode", transform = function(value) return value == "existing" end },
          items = bind "portfolioItems",
          value = bind "existingGallerySlug",
          width_in_chars = 32,
        },
        viewFactory:push_button {
          enabled = bind { key = "destinationMode", transform = function(value) return value == "existing" end },
          title = "Refresh portfolios",
          action = function() refreshPortfolios(propertyTable) end,
        },
      },
      viewFactory:row {
        spacing = viewFactory:control_spacing(),
        viewFactory:static_text { title = "", width = 120 },
        viewFactory:static_text {
          title = bind "portfolioStatus",
          width_in_chars = 48,
          height_in_lines = 2,
        },
      },
      viewFactory:row {
        spacing = viewFactory:control_spacing(),
        viewFactory:static_text {
          title = "Client name (optional)",
          width = 120,
        },
        viewFactory:edit_field {
          value = bind "clientName",
          width_in_chars = 42,
        },
      },
      viewFactory:row {
        spacing = viewFactory:control_spacing(),
        viewFactory:static_text {
          title = "",
          width = 120,
        },
        viewFactory:checkbox {
          title = "Make new portfolio public after upload",
          value = bind "makePublic",
        },
      },
      viewFactory:row {
        spacing = viewFactory:control_spacing(),
        viewFactory:static_text {
          title = "Plug-in version",
          width = 120,
        },
        viewFactory:static_text {
          title = bind "pluginVersionStatus",
          width_in_chars = 42,
          height_in_lines = 2,
        },
        viewFactory:push_button {
          title = bind "pluginDownloadLabel",
          action = function()
            LrHttp.openUrlInBrowser(propertyTable.pluginDownloadUrl or PLUGIN_DOWNLOAD_URL)
          end,
        },
      },
      viewFactory:row {
        spacing = viewFactory:control_spacing(),
        viewFactory:static_text { title = "", width = 120 },
        viewFactory:static_text {
          title = "Updating keeps the saved API URL, private key, destination, and Lightroom export settings.",
          width_in_chars = 62,
          height_in_lines = 2,
        },
      },
    },
  }
end

local function slugify(value)
  local slug = string.lower(value or "lightroom-portfolio")
  slug = slug:gsub("[^%w]+", "-")
  slug = slug:gsub("^-+", "")
  slug = slug:gsub("-+$", "")
  if slug == "" then
    return "lightroom-portfolio"
  end
  return slug
end

local MAX_LIGHTROOM_IMAGE_BYTES = 50 * 1024 * 1024

local function contentTypeForPath(path)
  local extension = string.lower(LrPathUtils.extension(path) or "")
  if extension == "jpg" or extension == "jpeg" then return "image/jpeg" end
  if extension == "png" then return "image/png" end
  if extension == "tif" or extension == "tiff" then return "image/tiff" end
  if extension == "webp" then return "image/webp" end
  if extension == "heic" then return "image/heic" end
  if extension == "heif" then return "image/heif" end
  return nil
end

local function uploadRendition(endpointUrl, apiKey, propertyTable, rendition, path)
  local photo = rendition.photo
  local fileName = LrPathUtils.leafName(path)
  local attributes = LrFileUtils.fileAttributes(path)
  local fileSize = attributes and tonumber(attributes.fileSize) or 0
  local contentType = contentTypeForPath(path)
  if not contentType then
    return false, "PhotoView.io supports JPEG, PNG, WebP, HEIC, HEIF, and TIFF images."
  end
  if not fileSize or fileSize <= 0 then
    return false, "Lightroom produced an empty image file."
  end
  if fileSize > MAX_LIGHTROOM_IMAGE_BYTES then
    return false, string.format("%s is %.1f MB. PhotoView.io accepts images up to 50 MB.", fileName, fileSize / 1024 / 1024)
  end

  local apiHeaders = {
    { field = "Accept", value = "application/json" },
    { field = "Content-Type", value = "application/json" },
  }

  if apiKey and apiKey ~= "" then
    table.insert(apiHeaders, { field = "x-photoviewpro-key", value = apiKey })
  end

  local isExisting = propertyTable.destinationMode == "existing"
  local gallerySlug = isExisting and propertyTable.existingGallerySlug or slugify(propertyTable.galleryName)
  local commonValues = {
    destinationMode = isExisting and "existing" or "new",
    galleryName = propertyTable.galleryName,
    gallerySlug = gallerySlug,
    clientName = propertyTable.clientName or "",
    makePublic = propertyTable.makePublic == true,
    photoTitle = photo:getFormattedMetadata("title") or "",
    caption = photo:getFormattedMetadata("caption") or "",
    captureTime = photo:getFormattedMetadata("dateTimeOriginal") or "",
    fileName = fileName,
  }
  local initiateValues = {}
  for key, value in pairs(commonValues) do initiateValues[key] = value end
  initiateValues.fileSize = fileSize
  initiateValues.fileType = contentType

  local initiateBody, initiateHeaders = LrHttp.post(
    endpointUrl .. "/initiate",
    encodeJsonObject(initiateValues),
    apiHeaders,
    "POST",
    30
  )
  if not initiateBody or not initiateHeaders or initiateHeaders.status < 200 or initiateHeaders.status >= 300 then
    return false, responseError(initiateBody, "PhotoView.io could not start the image upload.")
  end
  local decodedSucceeded, upload = LrTasks.pcall(decodeJson, initiateBody)
  if not decodedSucceeded or type(upload) ~= "table" or not upload.uploadUrl or not upload.reference then
    return false, "PhotoView.io returned an unreadable upload authorization."
  end

  local fileBody = LrFileUtils.readFile(path)
  if not fileBody or #fileBody ~= fileSize then
    return false, "Lightroom could not read the complete rendered image."
  end
  local putBody, putHeaders = LrHttp.post(
    upload.uploadUrl,
    fileBody,
    {
      { field = "Content-Type", value = contentType },
    },
    "PUT",
    180,
    fileSize
  )
  if not putHeaders or putHeaders.status < 200 or putHeaders.status >= 300 then
    return false, responseError(putBody, "The image could not be transferred to PhotoView.io storage.")
  end

  local finalizeValues = {}
  for key, value in pairs(commonValues) do finalizeValues[key] = value end
  finalizeValues.reference = upload.reference
  local result, responseHeaders = LrHttp.post(
    endpointUrl .. "/finalize",
    encodeJsonObject(finalizeValues),
    apiHeaders,
    "POST",
    180
  )
  if not result or not responseHeaders or responseHeaders.status < 200 or responseHeaders.status >= 300 then
    return false, responseError(result, "PhotoView.io received the image but could not add it to the portfolio.")
  end

  return true, result
end

function exportServiceProvider.processRenderedPhotos(functionContext, exportContext)
  local propertyTable = exportContext.propertyTable
  local baseUrl = normalizeBaseUrl(propertyTable.apiBaseUrl)

  if baseUrl == "" then
    LrDialogs.message("PhotoView.io", "Enter your PhotoView.io API URL before exporting.", "critical")
    return
  end
  if not isAllowedBaseUrl(baseUrl) then
    LrDialogs.message("PhotoView.io", "For security, the API URL must be https://photoview.io.", "critical")
    return
  end

  if propertyTable.destinationMode == "existing" and (not propertyTable.existingGallerySlug or propertyTable.existingGallerySlug == "") then
    LrDialogs.message("PhotoView.io", "Refresh portfolios and choose an existing destination before exporting.", "critical")
    return
  end

  if propertyTable.destinationMode ~= "existing" and (not propertyTable.galleryName or propertyTable.galleryName == "") then
    LrDialogs.message("PhotoView.io", "Enter a name for the new portfolio before exporting.", "critical")
    return
  end

  local endpointUrl = baseUrl .. "/api/lightroom/import"
  local progress = exportContext:configureProgress {
    title = "Uploading to PhotoView.io",
  }
  local uploaded = 0
  local failed = 0
  local failureMessages = {}

  local function recordFailure(message)
    local normalized = tostring(message or "Lightroom could not render this file.")
    for _, existingMessage in ipairs(failureMessages) do
      if existingMessage == normalized then return end
    end
    if #failureMessages < 3 then table.insert(failureMessages, normalized) end
  end

  for _, rendition in exportContext:renditions { stopIfCanceled = true } do
    if progress:isCanceled() then
      break
    end

    local success, pathOrMessage = rendition:waitForRender()

    if success then
      local callSuccess, uploadSuccess, result = LrTasks.pcall(uploadRendition, endpointUrl, propertyTable.apiKey, propertyTable, rendition, pathOrMessage)

      if callSuccess and uploadSuccess then
        uploaded = uploaded + 1
      else
        failed = failed + 1
        local failureMessage = callSuccess and result or uploadSuccess
        local renderedFailureMessage = tostring(failureMessage or "PhotoView.io upload failed")
        recordFailure(renderedFailureMessage)
        rendition:uploadFailed(renderedFailureMessage)
      end

      LrFileUtils.delete(pathOrMessage)
    else
      failed = failed + 1
      recordFailure(pathOrMessage)
      rendition:uploadFailed(pathOrMessage)
    end

    progress:setCaption(string.format("Uploaded %d, failed %d", uploaded, failed))
  end

  local completionMessage = string.format("Upload complete. Uploaded %d file(s), failed %d.", uploaded, failed)
  if #failureMessages > 0 then
    completionMessage = completionMessage .. "\n\nWhy files failed:\n- " .. table.concat(failureMessages, "\n- ")
  end
  LrDialogs.message("PhotoView.io", completionMessage, failed > 0 and "warning" or "info")
end

return exportServiceProvider
