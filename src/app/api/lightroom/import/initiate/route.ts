import { initiateDirectLightroomImport } from "@/lib/photo-import-handler"

export async function POST(request: Request): Promise<Response> {
  return initiateDirectLightroomImport(request)
}
