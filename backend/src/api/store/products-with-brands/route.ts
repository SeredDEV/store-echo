import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import ProductBrandLink from "../../../links/product-brand";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve("query");

  // Consultar productos con sus marcas usando Query API
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "description", "brand.*"],
  });

  res.json({
    products: data,
  });
}
