import { handlePhotoImport, listImportPortfolios } from "@/lib/photo-import-handler"

export async function GET(request: Request): Promise<Response> {
  return listImportPortfolios(request)
}

export async function POST(request: Request): Promise<Response> {
  return handlePhotoImport(request, "lightroom")
}
