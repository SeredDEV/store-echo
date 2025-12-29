import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import BrandModuleService from "../../../modules/brand/service";
import { BRAND_MODULE } from "../../../modules/brand";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const brandModuleService: BrandModuleService =
    req.scope.resolve(BRAND_MODULE);

  const brands = await brandModuleService.listBrands({
    is_active: true,
  });

  res.json({
    brands,
  });
}
