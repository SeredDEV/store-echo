import { defineWidgetConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Badge,
  Select,
  Button,
  toast,
  Label,
} from "@medusajs/ui";
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types";
import { useState, useEffect } from "react";

const ProductBrandWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [currentBrand, setCurrentBrand] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBrands();
    fetchProductBrand();
  }, [data.id]);

  const fetchBrands = async () => {
    try {
      const response = await fetch("/admin/brands");
      const result = await response.json();
      setBrands(result.brands || []);
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const fetchProductBrand = async () => {
    try {
      // Usar query API del admin que ya tiene autenticación
      const response = await fetch(`/admin/products/${data.id}`);
      const result = await response.json();

      // Intentar obtener la marca vinculada usando query
      const queryService = (window as any).medusa?.query;
      if (queryService) {
        const { data: productData } = await queryService.graph({
          entity: "product",
          fields: ["id", "brand.*"],
          filters: { id: data.id },
        });

        if (productData && productData[0]?.brand) {
          setCurrentBrand(productData[0].brand);
          setSelectedBrandId(productData[0].brand.id);
        }
      }
    } catch (error) {
      console.error("Error fetching product brand:", error);
    }
  };

  const handleAssignBrand = async () => {
    if (!selectedBrandId) {
      toast.error("Error", { description: "Selecciona una marca" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/admin/products/${data.id}/brand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: selectedBrandId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al asignar marca");
      }

      toast.success("Éxito", {
        description: "Marca asignada correctamente",
      });

      fetchProductBrand();
    } catch (error) {
      console.error("Error asignando marca:", error);
      toast.error("Error", {
        description:
          error instanceof Error
            ? error.message
            : "No se pudo asignar la marca",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBrand = async () => {
    if (!currentBrand) return;

    setLoading(true);
    try {
      const response = await fetch(`/admin/products/${data.id}/brand`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: currentBrand.id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al desvincular marca");
      }

      toast.success("Éxito", {
        description: "Marca desvinculada correctamente",
      });

      setCurrentBrand(null);
      setSelectedBrandId("");
    } catch (error) {
      toast.error("Error", { description: "No se pudo desvincular la marca" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Marca del Producto</Heading>
      </div>
      <div className="px-6 py-4 space-y-4">
        {currentBrand ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div>
                <Label>Marca actual:</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Badge color="green" size="large">
                    {currentBrand.name}
                  </Badge>
                  <span className="text-sm text-ui-fg-subtle">
                    ({currentBrand.handle})
                  </span>
                </div>
              </div>
            </div>
            {currentBrand.description && (
              <p className="text-sm text-ui-fg-subtle">
                {currentBrand.description}
              </p>
            )}
            <Button
              variant="danger"
              size="small"
              onClick={handleRemoveBrand}
              disabled={loading}
            >
              Desvincular Marca
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="brand-select">Seleccionar Marca</Label>
              <Select
                value={selectedBrandId}
                onValueChange={setSelectedBrandId}
              >
                <Select.Trigger id="brand-select">
                  <Select.Value placeholder="Elige una marca..." />
                </Select.Trigger>
                <Select.Content>
                  {brands.map((brand) => (
                    <Select.Item key={brand.id} value={brand.id}>
                      {brand.name} ({brand.handle})
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <Button
              onClick={handleAssignBrand}
              disabled={loading || !selectedBrandId}
            >
              {loading ? "Asignando..." : "Asignar Marca"}
            </Button>
          </div>
        )}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default ProductBrandWidget;
