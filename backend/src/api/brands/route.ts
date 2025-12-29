import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import BrandModuleService from "../../modules/brand/service";
import { BRAND_MODULE } from "../../modules/brand";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const brandModuleService: BrandModuleService =
    req.scope.resolve(BRAND_MODULE);

  const brands = await brandModuleService.listBrands();

  res.json({
    brands,
  });
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const brandModuleService: BrandModuleService =
    req.scope.resolve(BRAND_MODULE);

  const brand = await brandModuleService.createBrands(req.body as any);

  res.json({
    brand,
  });
}
