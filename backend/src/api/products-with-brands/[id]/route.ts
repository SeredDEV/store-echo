import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function GET(
  req: MedusaRequest<{ id: string }>,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve("query");
  const product_id = req.params.id;

  const { data } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "description",
      "thumbnail",
      "variants.*",
      "images.*",
      "brand.*",
    ],
    filters: {
      id: product_id,
    },
  });

  if (!data || data.length === 0) {
    res.status(404).json({
      message: "Producto no encontrado",
    });
    return;
  }

  res.json({
    product: data[0],
  });
}
