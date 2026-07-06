local LrBinding = import "LrBinding"
local LrDialogs = import "LrDialogs"
local LrFileUtils = import "LrFileUtils"
local LrHttp = import "LrHttp"
local LrPathUtils = import "LrPathUtils"
local LrTasks = import "LrTasks"
local LrView = import "LrView"

local bind = LrView.bind

local exportServiceProvider = {}

exportServiceProvider.exportPresetFields = {
  { key = "apiBaseUrl", default = "http://localhost:3000" },
  { key = "apiKey", default = "" },
  { key = "galleryName", default = "Lightroom Portfolio" },
  { key = "clientName", default = "" },
  { key = "makePublic", default = false },
}

function exportServiceProvider.sectionsForTopOfDialog(viewFactory, propertyTable)
  return {
    {
      title = "PhotoViewPro Gallery",
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
          title = "Gallery name",
          width = 120,
        },
        viewFactory:edit_field {
          value = bind "galleryName",
          width_in_chars = 42,
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
          title = "Make gallery public after upload",
          value = bind "makePublic",
        },
      },
    },
  }
end

local function normalizeBaseUrl(value)
  local baseUrl = value or ""
  baseUrl = baseUrl:gsub("%s+", "")
  baseUrl = baseUrl:gsub("/+$", "")
  return baseUrl
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

  local result, responseHeaders = LrHttp.postMultipart(endpointUrl, {
    { name = "galleryName", value = propertyTable.galleryName },
    { name = "gallerySlug", value = slugify(propertyTable.galleryName) },
    { name = "clientName", value = propertyTable.clientName or "" },
    { name = "makePublic", value = tostring(propertyTable.makePublic == true) },
    { name = "photoTitle", value = photo:getFormattedMetadata("title") or "" },
    { name = "caption", value = photo:getFormattedMetadata("caption") or "" },
    { name = "captureTime", value = photo:getFormattedMetadata("dateTimeOriginal") or "" },
    { name = "originalFileName", value = fileName },
    { name = "file", filePath = path, fileName = fileName, contentType = "image/jpeg" },
  }, headers)

  return result, responseHeaders
end

function exportServiceProvider.processRenderedPhotos(functionContext, exportContext)
  local propertyTable = exportContext.propertyTable
  local baseUrl = normalizeBaseUrl(propertyTable.apiBaseUrl)

  if baseUrl == "" then
    LrDialogs.message("PhotoViewPro", "Enter your PhotoViewPro API URL before exporting.", "critical")
    return
  end

  if not propertyTable.galleryName or propertyTable.galleryName == "" then
    LrDialogs.message("PhotoViewPro", "Enter a gallery name before exporting.", "critical")
    return
  end

  local endpointUrl = baseUrl .. "/api/lightroom/import"
  local progress = exportContext:configureProgress {
    title = "Uploading to PhotoViewPro",
  }
  local uploaded = 0
  local failed = 0

  for _, rendition in exportContext:renditions { stopIfCanceled = true } do
    if progress:isCanceled() then
      break
    end

    local success, pathOrMessage = rendition:waitForRender()

    if success then
      local uploadSuccess, result = LrTasks.pcall(uploadRendition, endpointUrl, propertyTable.apiKey, propertyTable, rendition, pathOrMessage)

      if uploadSuccess and result then
        uploaded = uploaded + 1
      else
        failed = failed + 1
        rendition:uploadFailed(tostring(result or "PhotoViewPro upload failed"))
      end

      LrFileUtils.delete(pathOrMessage)
    else
      failed = failed + 1
      rendition:uploadFailed(pathOrMessage)
    end

    progress:setCaption(string.format("Uploaded %d, failed %d", uploaded, failed))
  end

  LrDialogs.message("PhotoViewPro", string.format("Upload complete. Uploaded %d file(s), failed %d.", uploaded, failed), "info")
end

return exportServiceProvider
