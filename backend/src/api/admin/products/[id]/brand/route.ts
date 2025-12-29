import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { BRAND_MODULE } from "../../../../../modules/brand";

type SetBrandRequest = {
  brand_id: string;
};

export async function POST(
  req: MedusaRequest<{ id: string }>,
  res: MedusaResponse
): Promise<void> {
  const { brand_id } = req.body as any;
  const product_id = req.params.id;

  // Obtener el Link API desde el container
  const link = req.scope.resolve("link");

  // Crear la relación entre producto y marca
  await link.create({
    [Modules.PRODUCT]: {
      product_id,
    },
    [BRAND_MODULE]: {
      brand_id,
    },
  });

  res.json({
    message: "Brand asociada al producto exitosamente",
    product_id,
    brand_id,
  });
}

export async function DELETE(
  req: MedusaRequest<{ id: string }>,
  res: MedusaResponse
): Promise<void> {
  const product_id = req.params.id;
  const { brand_id } = req.body as any;

  const link = req.scope.resolve("link");

  // Eliminar la relación
  await link.dismiss({
    [Modules.PRODUCT]: {
      product_id,
    },
    [BRAND_MODULE]: {
      brand_id,
    },
  });

  res.json({
    message: "Brand desvinculada del producto",
    product_id,
    brand_id,
  });
}
