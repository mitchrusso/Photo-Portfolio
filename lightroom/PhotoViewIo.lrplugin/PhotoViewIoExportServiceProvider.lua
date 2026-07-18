local LrDialogs = import "LrDialogs"
local LrFileUtils = import "LrFileUtils"
local LrHttp = import "LrHttp"
local LrJson = import "LrJson"
local LrPathUtils = import "LrPathUtils"
local LrTasks = import "LrTasks"
local LrView = import "LrView"

local bind = LrView.bind

local exportServiceProvider = {}

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

    local decodeSucceeded, decoded = LrTasks.pcall(LrJson.decode, body)
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

function exportServiceProvider.sectionsForTopOfDialog(viewFactory, propertyTable)
  propertyTable.portfolioItems = propertyTable.portfolioItems or {}
  propertyTable.portfolioStatus = propertyTable.portfolioStatus or "Paste the API URL and API key, then refresh."

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
          title = "Client",
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

local function uploadRendition(endpointUrl, apiKey, propertyTable, rendition, path)
  local photo = rendition.photo
  local fileName = LrPathUtils.leafName(path)

  local headers = {
    { field = "Accept", value = "application/json" },
  }

  if apiKey and apiKey ~= "" then
    table.insert(headers, { field = "x-photoviewpro-key", value = apiKey })
  end

  local isExisting = propertyTable.destinationMode == "existing"
  local gallerySlug = isExisting and propertyTable.existingGallerySlug or slugify(propertyTable.galleryName)
  local result, responseHeaders = LrHttp.postMultipart(endpointUrl, {
    { name = "destinationMode", value = isExisting and "existing" or "new" },
    { name = "galleryName", value = propertyTable.galleryName },
    { name = "gallerySlug", value = gallerySlug },
    { name = "clientName", value = propertyTable.clientName or "" },
    { name = "makePublic", value = tostring(propertyTable.makePublic == true) },
    { name = "photoTitle", value = photo:getFormattedMetadata("title") or "" },
    { name = "caption", value = photo:getFormattedMetadata("caption") or "" },
    { name = "captureTime", value = photo:getFormattedMetadata("dateTimeOriginal") or "" },
    { name = "originalFileName", value = fileName },
    { name = "file", filePath = path, fileName = fileName, contentType = "image/jpeg" },
  }, headers)

  if not result or not responseHeaders or responseHeaders.status < 200 or responseHeaders.status >= 300 then
    local message = result or "PhotoView.io did not accept the upload."
    return false, message
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
        rendition:uploadFailed(tostring(failureMessage or "PhotoView.io upload failed"))
      end

      LrFileUtils.delete(pathOrMessage)
    else
      failed = failed + 1
      rendition:uploadFailed(pathOrMessage)
    end

    progress:setCaption(string.format("Uploaded %d, failed %d", uploaded, failed))
  end

  LrDialogs.message("PhotoView.io", string.format("Upload complete. Uploaded %d file(s), failed %d.", uploaded, failed), "info")
end

return exportServiceProvider
