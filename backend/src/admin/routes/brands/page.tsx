import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Tag,
  PlusMini,
  Trash,
  PencilSquare,
  EllipsisHorizontal,
} from "@medusajs/icons";
import {
  Container,
  Heading,
  Button,
  Table,
  Badge,
  Input,
  Label,
  Textarea,
  Switch,
  toast,
  Prompt,
  DropdownMenu,
  IconButton,
} from "@medusajs/ui";
import { useState, useEffect } from "react";

const BrandsPage = () => {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    handle: "",
    description: "",
    logo_url: "",
    is_active: true,
  });

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await fetch("/admin/brands");
      const data = await response.json();
      setBrands(data.brands || []);
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast.error("Error", { description: "No se pudieron cargar las marcas" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingBrand
        ? `/admin/brands/${editingBrand.id}`
        : "/admin/brands";

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Error al guardar");

      toast.success("Éxito", {
        description: editingBrand
          ? "Marca actualizada correctamente"
          : "Marca creada correctamente",
      });

      setShowModal(false);
      setEditingBrand(null);
      setFormData({
        name: "",
        handle: "",
        description: "",
        logo_url: "",
        is_active: true,
      });
      fetchBrands();
    } catch (error) {
      toast.error("Error", { description: "No se pudo guardar la marca" });
    }
  };

  const handleEdit = (brand: any) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      handle: brand.handle,
      description: brand.description || "",
      logo_url: brand.logo_url || "",
      is_active: brand.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (brandId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta marca?")) return;

    try {
      const response = await fetch(`/admin/brands/${brandId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar");

      toast.success("Éxito", { description: "Marca eliminada correctamente" });
      fetchBrands();
    } catch (error) {
      toast.error("Error", { description: "No se pudo eliminar la marca" });
    }
  };

  const handleNewBrand = () => {
    setEditingBrand(null);
    setFormData({
      name: "",
      handle: "",
      description: "",
      logo_url: "",
      is_active: true,
    });
    setShowModal(true);
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Marcas</Heading>
        <Button variant="secondary" size="small" onClick={handleNewBrand}>
          <PlusMini />
          Nueva Marca
        </Button>
      </div>

      <div className="px-6 py-4">
        {loading ? (
          <p>Cargando marcas...</p>
        ) : brands.length === 0 ? (
          <p className="text-ui-fg-subtle">No hay marcas registradas</p>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Nombre</Table.HeaderCell>
                <Table.HeaderCell>Handle</Table.HeaderCell>
                <Table.HeaderCell>Descripción</Table.HeaderCell>
                <Table.HeaderCell>Estado</Table.HeaderCell>
                <Table.HeaderCell>Acciones</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {brands.map((brand) => (
                <Table.Row key={brand.id}>
                  <Table.Cell>{brand.name}</Table.Cell>
                  <Table.Cell>
                    <code className="text-xs">{brand.handle}</code>
                  </Table.Cell>
                  <Table.Cell>{brand.description || "-"}</Table.Cell>
                  <Table.Cell>
                    {brand.is_active ? (
                      <Badge color="green">Activa</Badge>
                    ) : (
                      <Badge color="red">Inactiva</Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <DropdownMenu>
                      <DropdownMenu.Trigger asChild>
                        <IconButton variant="transparent">
                          <EllipsisHorizontal />
                        </IconButton>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content>
                        <DropdownMenu.Item onClick={() => handleEdit(brand)}>
                          <PencilSquare className="mr-2" />
                          Editar
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onClick={() => handleDelete(brand.id)}
                        >
                          <Trash className="mr-2" />
                          Eliminar
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>

      {showModal && (
        <Prompt open={showModal} onOpenChange={setShowModal}>
          <Prompt.Content>
            <Prompt.Header>
              <Prompt.Title>
                {editingBrand ? "Editar Marca" : "Nueva Marca"}
              </Prompt.Title>
              <Prompt.Description>
                {editingBrand
                  ? "Actualiza la información de la marca"
                  : "Completa los datos de la nueva marca"}
              </Prompt.Description>
            </Prompt.Header>

            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-4 p-6">
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="handle">Handle *</Label>
                  <Input
                    id="handle"
                    value={formData.handle}
                    onChange={(e) =>
                      setFormData({ ...formData, handle: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="logo_url">URL del Logo</Label>
                  <Input
                    id="logo_url"
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) =>
                      setFormData({ ...formData, logo_url: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Marca activa</Label>
                </div>
              </div>

              <Prompt.Footer>
                <Prompt.Cancel asChild>
                  <Button variant="secondary">Cancelar</Button>
                </Prompt.Cancel>
                <Button type="submit">
                  {editingBrand ? "Actualizar" : "Crear"}
                </Button>
              </Prompt.Footer>
            </form>
          </Prompt.Content>
        </Prompt>
      )}
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Marcas",
  icon: Tag,
});

export default BrandsPage;
