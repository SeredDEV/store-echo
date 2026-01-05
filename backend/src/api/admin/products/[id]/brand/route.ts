import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { BRAND_MODULE } from "../../../../../modules/brand";

type SetBrandRequest = {
  brand_id: string;
};

export async function GET(
  req: MedusaRequest<{ id: string }>,
  res: MedusaResponse
): Promise<void> {
  try {
    const product_id = req.params.id;

    // Obtener Query desde el container
    const query = req.scope.resolve("query");

    // Consultar la marca del producto
    const productsWithBrand = await query.graph({
      entity: "product",
      fields: ["id", "brand.*"],
      filters: { id: product_id },
    });

    // Acceder correctamente a los datos (viene en .data)
    const productData = productsWithBrand?.data?.[0];

    if (productData?.brand) {
      res.json({
        brand: productData.brand,
      });
    } else {
      res.status(404).json({
        message: "Producto sin marca asignada",
      });
    }
  } catch (error) {
    console.error("Error al obtener marca:", error);
    res.status(500).json({
      message: "Error al obtener marca",
      error: error.message,
    });
  }
}

export async function POST(
  req: MedusaRequest<{ id: string }>,
  res: MedusaResponse
): Promise<void> {
  try {
    const { brand_id } = req.body as any;
    const product_id = req.params.id;

    if (!brand_id) {
      res.status(400).json({
        message: "brand_id es requerido",
      });
      return;
    }

    // Obtener Link y Query desde el container
    const link = req.scope.resolve(ContainerRegistrationKeys.LINK);
    const query = req.scope.resolve("query");

    // Consultar si el producto ya tiene una marca
    const productsWithBrand = await query.graph({
      entity: "product",
      fields: ["id", "brand.*"],
      filters: { id: product_id },
    });

    // Acceder correctamente a los datos (viene en .data)
    const productData = productsWithBrand?.data?.[0];

    // Si el producto ya tiene una marca, eliminarla primero
    if (productData?.brand) {
      const currentBrandId = productData.brand.id;
      await link.dismiss({
        [Modules.PRODUCT]: {
          product_id: product_id,
        },
        [BRAND_MODULE]: {
          brand_id: currentBrandId,
        },
      });
    }

    // Crear el nuevo link
    await link.create({
      [Modules.PRODUCT]: {
        product_id: product_id,
      },
      [BRAND_MODULE]: {
        brand_id: brand_id,
      },
    });

    res.json({
      message: "Brand asociada al producto exitosamente",
      product_id,
      brand_id,
    });
  } catch (error) {
    console.error("Error al asignar marca:", error);
    res.status(500).json({
      message: "Error al asignar marca",
      error: error.message,
    });
  }
}

export async function DELETE(
  req: MedusaRequest<{ id: string }>,
  res: MedusaResponse
): Promise<void> {
  const product_id = req.params.id;
  const { brand_id } = req.body as any;

  // Obtener Link desde el container
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK);

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
