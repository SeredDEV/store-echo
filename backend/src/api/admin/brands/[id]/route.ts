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

  res.json({
    brand,
  });
}

export async function POST(
  req: MedusaRequest<{ id: string }>,
  res: MedusaResponse
): Promise<void> {
  const brandModuleService: BrandModuleService =
    req.scope.resolve(BRAND_MODULE);

  const brand = await brandModuleService.updateBrands({
    ...req.body,
    id: req.params.id,
  } as any);

  res.json({
    brand,
  });
}

export async function DELETE(
  req: MedusaRequest<{ id: string }>,
  res: MedusaResponse
): Promise<void> {
  const brandModuleService: BrandModuleService =
    req.scope.resolve(BRAND_MODULE);

  await brandModuleService.deleteBrands(req.params.id);

  res.json({
    id: req.params.id,
    deleted: true,
  });
}
