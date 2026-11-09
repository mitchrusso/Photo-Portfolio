import { initiateDirectBridgeImport } from "@/lib/photo-import-handler"

export async function POST(request: Request): Promise<Response> {
  return initiateDirectBridgeImport(request)
}
