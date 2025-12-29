import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import BrandModuleService from "../../../../modules/brand/service";
import { BRAND_MODULE } from "../../../../modules/brand";

export async function GET(
  req: MedusaRequest<{ id: string }>,
  res: MedusaResponse
): Promise<void> {
  const brandModuleService: BrandModuleService =
    req.scope.resolve(BRAND_MODULE);

  const brand = await brandModuleService.retrieveBrand(req.params.id);

  if (!brand || !brand.is_active) {
    res.status(404).json({
      message: "Brand not found",
    });
    return;
  }

  res.json({
    brand,
  });
}
