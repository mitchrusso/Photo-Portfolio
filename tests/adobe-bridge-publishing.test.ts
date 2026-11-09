import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { runInNewContext } from "node:vm"
import { TextWriter, Uint8ArrayReader, ZipReader } from "@zip.js/zip.js"
import { LATEST_ADOBE_BRIDGE_EXTENSION_VERSION } from "../src/lib/adobe-bridge-extension-version.ts"

const extensionPath = "extensions/adobe-bridge/PhotoViewIoBridge.jsx"
const extensionSource = readFileSync(extensionPath, "utf8")

function bridgeHarness(responses: { body: string; exitCode?: number; throws?: boolean }[], os = "Macintosh") {
  const files = new Map<string, string>()
  class BridgeFile {
    fsName: string
    encoding = ""
    constructor(path: string) { this.fsName = path }
    get exists() { return files.has(this.fsName) }
    open(mode: string) {
      if (mode === "w") files.set(this.fsName, "")
      return this.exists
    }
    write(value: string) { files.set(this.fsName, value) }
    read() { return files.get(this.fsName) ?? "" }
    close() {}
    remove() { return files.delete(this.fsName) }
  }
  let api!: {
    request: (method: string, url: string, key: string, body: BridgeFile | null, upload: BridgeFile | null, type: string | null) => string
    tempJson: (body: string) => BridgeFile
    parseJson: (body: string) => { portfolios?: { name: string }[]; uploadUrl?: string; reference?: string; ok?: boolean; error?: string }
  }
  const commands: string[] = []
  runInNewContext(extensionSource.replace(/^#target[^\n]*\n/, "").replace(
    '  if (BridgeTalk.appName === "bridge") {',
    '  capture({ request: request, tempJson: tempJson, parseJson: parseJson });\n  if (BridgeTalk.appName === "bridge") {',
  ), {
    File: BridgeFile,
    Folder: { userData: { fsName: "/user-data" }, temp: { fsName: "/temp/Bridge requests" } },
    $: { os },
    BridgeTalk: { appName: "test" },
    capture: (value: typeof api) => { api = value },
    app: {
      system(command: string) {
        commands.push(command)
        const response = responses.shift()
        assert.ok(response, "Unexpected request")
        if (response.throws) throw new Error("Command could not start")
        const output = command.match(/--output\s+(?:'([^']+)'|"([^"]+)")/)
        if (output) files.set(output[1] ?? output[2], response.body)
        // Bridge reports the command's exit status, not curl's response body.
        return response.exitCode ?? 0
      },
    },
  })
  return { api, files, commands, BridgeFile }
}

for (const os of ["Macintosh", "Windows"]) {
  test(`Bridge reads server replies through the complete publishing sequence on ${os}`, () => {
    const { api, files, BridgeFile } = bridgeHarness([
      { body: '{"portfolios":[{"name":"Mountains"}]}' },
      { body: '{"uploadUrl":"https://storage.example/upload","reference":"photo-reference"}' },
      { body: "" },
      { body: '{"ok":true}' },
    ], os)
    const portfolios = api.parseJson(api.request("GET", "https://photoview.io/api/bridge/import", "test-key", null, null, null))
    assert.equal(portfolios.portfolios?.[0].name, "Mountains")
    const body = api.tempJson('{"fileName":"Mountain.jpg"}')
    const upload = api.parseJson(api.request("POST", "https://photoview.io/api/bridge/import/initiate", "test-key", body, null, "application/json"))
    assert.equal(upload.reference, "photo-reference")
    const photo = new BridgeFile("/photos/Mountain.jpg")
    files.set(photo.fsName, "original photograph")
    assert.equal(api.request("PUT", upload.uploadUrl!, "", null, photo, "image/jpeg"), "")
    const saved = api.parseJson(api.request("POST", "https://photoview.io/api/bridge/import/finalize", "test-key", api.tempJson('{"reference":"photo-reference"}'), null, "application/json"))
    assert.equal(saved.ok, true)
    assert.deepEqual([...files], [[photo.fsName, "original photograph"]])
  })
}

test("Bridge preserves PhotoView's specific JSON error when the HTTP request fails", () => {
  const { api, files, commands } = bridgeHarness([{ body: '{"error":"Invalid or expired PhotoView.io import key."}' }])
  const result = api.parseJson(api.request("POST", "https://photoview.io/api/bridge/import/initiate", "test-key", api.tempJson("{}"), null, "application/json"))
  assert.equal(result.error, "Invalid or expired PhotoView.io import key.")
  assert.doesNotMatch(commands[0], /--fail(?:\s|$|-with-body)/)
  assert.equal(files.size, 0)
})

test("Bridge reports a curl connection failure and removes temporary request and response files", () => {
  const { api, files } = bridgeHarness([{ body: "", exitCode: 7 }])
  assert.throws(() => api.request("POST", "https://photoview.io/api/bridge/import/initiate", "test-key", api.tempJson("{}"), null, "application/json"), /request.*exit code 7/i)
  assert.equal(files.size, 0)
})

test("Bridge removes temporary files when the system command cannot start", () => {
  const { api, files } = bridgeHarness([{ body: "", throws: true }])
  assert.throws(() => api.request("POST", "https://photoview.io/api/bridge/import/initiate", "test-key", api.tempJson("{}"), null, "application/json"), /Command could not start/)
  assert.equal(files.size, 0)
})

test("The downloadable Bridge extension contains the current repair and version", async () => {
  const reader = new ZipReader(new Uint8ArrayReader(readFileSync("public/downloads/PhotoViewIo-Adobe-Bridge-Extension.zip")))
  try {
    const entries = await reader.getEntries()
    for (const name of ["PhotoViewIoBridge.jsx", "README.txt"]) {
      const entry = entries.find((item) => item.filename === name)
      assert.ok(entry && !entry.directory)
      assert.equal(await entry.getData!(new TextWriter()), readFileSync(`extensions/adobe-bridge/${name}`, "utf8"))
    }
    assert.ok(extensionSource.includes(`var VERSION = "${LATEST_ADOBE_BRIDGE_EXTENSION_VERSION}"`))
    assert.ok(readFileSync("extensions/adobe-bridge/README.txt", "utf8").includes(`Version ${LATEST_ADOBE_BRIDGE_EXTENSION_VERSION}`))
  } finally {
    await reader.close()
  }
})
