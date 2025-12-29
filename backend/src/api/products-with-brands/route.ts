import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve("query");

  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "description", "thumbnail", "brand.*"],
  });

  res.json({
    products: data,
  });
}
