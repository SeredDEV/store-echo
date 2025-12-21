import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

const updateStoreCurrencies = createWorkflow(
  "update-store-currencies",
  (input: {
    supported_currencies: { currency_code: string; is_default?: boolean }[];
    store_id: string;
  }) => {
    const normalizedInput = transform({ input }, (data) => {
      return {
        selector: { id: data.input.store_id },
        update: {
          supported_currencies: data.input.supported_currencies.map(
            (currency) => {
              return {
                currency_code: currency.currency_code,
                is_default: currency.is_default ?? false,
              };
            }
          ),
        },
      };
    });

    const stores = updateStoresStep(normalizedInput);

    return new WorkflowResponse(stores);
  }
);

export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);
  const productModuleService = container.resolve(Modules.PRODUCT);
  const promotionModuleService = container.resolve(Modules.PROMOTION);
  const pricingModuleService = container.resolve(Modules.PRICING);
  const taxModuleService = container.resolve(Modules.TAX);

  // Solo Colombia
  const countries = ["co"];

  logger.info("Sembrando datos de la tienda...");
  const [store] = await storeModuleService.listStores();
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_locales: [
          {
            locale_code: "es-CO", // Español Colombia
          },
        ],
      },
    },
  });
  // Buscar o crear canales de ventas
  logger.info("Sembrando canales de ventas...");

  // Canal principal (predeterminado)
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Canal Principal",
  });

  // Si no existe, crearlo
  if (!defaultSalesChannel.length) {
    // También verificar si existe "Default Sales Channel" (nombre en inglés por defecto)
    const englishChannel = await salesChannelModuleService.listSalesChannels({
      name: "Default Sales Channel",
    });

    if (englishChannel.length) {
      // Si existe el canal en inglés, usarlo como predeterminado
      defaultSalesChannel = englishChannel;
    } else {
      // Crear nuevo canal en español
      const { result: salesChannelResult } = await createSalesChannelsWorkflow(
        container
      ).run({
        input: {
          salesChannelsData: [
            {
              name: "Canal Principal",
            },
          ],
        },
      });
      defaultSalesChannel = salesChannelResult;
    }
  }

  // Crear canales adicionales: Sitio Web y Redes Sociales
  let sitioWebChannel = await salesChannelModuleService.listSalesChannels({
    name: "Sitio Web",
  });

  if (!sitioWebChannel.length) {
    const { result: sitioWebResult } = await createSalesChannelsWorkflow(
      container
    ).run({
      input: {
        salesChannelsData: [
          {
            name: "Sitio Web",
          },
        ],
      },
    });
    sitioWebChannel = sitioWebResult;
  }

  let redesSocialesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Redes Sociales",
  });

  if (!redesSocialesChannel.length) {
    const { result: redesSocialesResult } = await createSalesChannelsWorkflow(
      container
    ).run({
      input: {
        salesChannelsData: [
          {
            name: "Redes Sociales",
          },
        ],
      },
    });
    redesSocialesChannel = redesSocialesResult;
  }

  logger.info("Canales de ventas sembrados correctamente.");

  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [
        {
          currency_code: "cop", // Peso colombiano
          is_default: true,
        },
      ],
    },
  });

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  });
  logger.info("Sembrando datos de región...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Colombia",
          currency_code: "cop",
          countries,
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  });
  const region = regionResult[0];
  logger.info("Datos de región sembrados correctamente.");

  logger.info("Configurando precios con impuestos incluidos...");
  // IMPORTANTE: En Colombia, los precios ya incluyen el IVA
  // Configurar manualmente desde Admin:
  // 1. Settings → Regions → Colombia
  // 2. En "Price Preferences":
  //    - Tax Inclusive: true (Precios con impuestos incluidos)
  //    - Automatic Taxes: false (Impuestos automáticos)
  // Según: https://docs.medusajs.com/user-guide/settings/tax-regions
  try {
    // Intentar configurar price preferences programáticamente
    await pricingModuleService.createPricePreferences([
      {
        is_tax_inclusive: true, // Precios con IVA incluido
      },
    ]);
    logger.info("Precios con impuestos incluidos configurados correctamente.");
  } catch (error: any) {
    logger.info(`IMPORTANTE: Configurar manualmente desde Admin UI:`);
    logger.info(`  1. Ve a Settings → Regions → Colombia`);
    logger.info(`  2. En "Price Preferences" configura:`);
    logger.info(`     - Tax Inclusive: true (Precios con impuestos incluidos)`);
    logger.info(`     - Automatic Taxes: false (Impuestos automáticos)`);
    logger.info(`  Error técnico: ${error?.message || String(error)}`);
  }

  logger.info("Sembrando regiones de impuestos...");
  await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code,
      provider_id: "tp_system",
    })),
  });
  logger.info("Regiones de impuestos sembradas correctamente.");

  logger.info("Sembrando datos de ubicación de inventario...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Almacén Principal Medellín",
          address: {
            address_1: "Carrera 43A # 1-50",
            city: "Medellín",
            country_code: "CO",
            province: "Antioquia",
            postal_code: "050021",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_location_id: stockLocation.id,
      },
    },
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  logger.info("Sembrando datos de envío...");
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null;

  if (!shippingProfile) {
    const { result: shippingProfileResult } =
      await createShippingProfilesWorkflow(container).run({
        input: {
          data: [
            {
              name: "Perfil de Envío Predeterminado",
              type: "default",
            },
          ],
        },
      });
    shippingProfile = shippingProfileResult[0];
  }

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Envío desde Almacén Medellín",
    type: "shipping",
    service_zones: [
      {
        name: "Colombia",
        geo_zones: [
          {
            country_code: "co",
            type: "country",
          },
        ],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Envío Estándar",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Estándar",
          description: "Envío en 3-5 días hábiles a toda Colombia.",
          code: "standard",
        },
        prices: [
          {
            region_id: region.id,
            amount: 15000, // 15.000 COP
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
      {
        name: "Envío Express",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Express",
          description: "Envío en 24-48 horas a principales ciudades.",
          code: "express",
        },
        prices: [
          {
            region_id: region.id,
            amount: 35000, // 35.000 COP
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
      {
        name: "Envío Gratis",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Gratis",
          description: "Envío gratis para compras superiores a $200.000 COP.",
          code: "free",
        },
        prices: [
          {
            region_id: region.id,
            amount: 0,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
    ],
  });
  logger.info("Datos de envío sembrados correctamente.");

  // Vincular la ubicación de stock a todos los sales channels relevantes
  // Esto asegura que el inventario esté disponible en todos los canales
  const salesChannelsForStock = [
    defaultSalesChannel[0].id,
    sitioWebChannel[0].id,
  ];

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: salesChannelsForStock,
    },
  });
  logger.info(
    `Ubicación de inventario "${stockLocation.name}" vinculada a ${salesChannelsForStock.length} canales de ventas.`
  );
  logger.info("Datos de ubicación de inventario sembrados correctamente.");

  logger.info("Sembrando datos de clave API publicable...");
  const { result: publishableApiKeyResult } = await createApiKeysWorkflow(
    container
  ).run({
    input: {
      api_keys: [
        {
          title: "Webshop",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  });
  const publishableApiKey = publishableApiKeyResult[0];

  // Vincular la API key al canal principal y también a Sitio Web
  // Esto asegura que los productos sean accesibles desde el frontend
  const salesChannelsToLink = [
    defaultSalesChannel[0].id,
    sitioWebChannel[0].id,
  ];

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: salesChannelsToLink,
    },
  });

  logger.info(
    `Publishable API Key vinculada a ${salesChannelsToLink.length} canales: ${defaultSalesChannel[0].name}, ${sitioWebChannel[0].name}`
  );
  logger.info(
    `API Key ID: ${publishableApiKey.id} - Configúrala en frontend/.env.local como NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
  );
  logger.info("Datos de clave API publicable sembrados correctamente.");

  logger.info("Sembrando datos de productos...");

  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Camisetas",
          is_active: true,
        },
        {
          name: "Sudaderas",
          is_active: true,
        },
        {
          name: "Pantalones",
          is_active: true,
        },
        {
          name: "Merchandising",
          is_active: true,
        },
      ],
    },
  });

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Medusa T-Shirt",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Camisetas")!.id,
          ],
          description:
            "Reimagine the feeling of a classic T-shirt. With our cotton T-shirts, everyday essentials no longer have to be ordinary.",
          handle: "t-shirt",
          weight: 400,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-back.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-front.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-back.png",
            },
          ],
          options: [
            {
              title: "Size",
              values: ["S", "M", "L", "XL"],
            },
            {
              title: "Color",
              values: ["Black", "White"],
            },
          ],
          variants: [
            {
              title: "S / Black",
              sku: "SHIRT-S-BLACK",
              options: {
                Size: "S",
                Color: "Black",
              },
              prices: [
                {
                  amount: 79000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "S / White",
              sku: "SHIRT-S-WHITE",
              options: {
                Size: "S",
                Color: "White",
              },
              prices: [
                {
                  amount: 85000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "M / Black",
              sku: "SHIRT-M-BLACK",
              options: {
                Size: "M",
                Color: "Black",
              },
              prices: [
                {
                  amount: 89000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "M / White",
              sku: "SHIRT-M-WHITE",
              options: {
                Size: "M",
                Color: "White",
              },
              prices: [
                {
                  amount: 95000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "L / Black",
              sku: "SHIRT-L-BLACK",
              options: {
                Size: "L",
                Color: "Black",
              },
              prices: [
                {
                  amount: 99000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "L / White",
              sku: "SHIRT-L-WHITE",
              options: {
                Size: "L",
                Color: "White",
              },
              prices: [
                {
                  amount: 105000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "XL / Black",
              sku: "SHIRT-XL-BLACK",
              options: {
                Size: "XL",
                Color: "Black",
              },
              prices: [
                {
                  amount: 109000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "XL / White",
              sku: "SHIRT-XL-WHITE",
              options: {
                Size: "XL",
                Color: "White",
              },
              prices: [
                {
                  amount: 115000,
                  currency_code: "cop",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Medusa Sweatshirt",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Sudaderas")!.id,
          ],
          description:
            "Reimagine the feeling of a classic sweatshirt. With our cotton sweatshirt, everyday essentials no longer have to be ordinary.",
          handle: "sweatshirt",
          weight: 400,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-back.png",
            },
          ],
          options: [
            {
              title: "Size",
              values: ["S", "M", "L", "XL"],
            },
          ],
          variants: [
            {
              title: "S",
              sku: "SWEATSHIRT-S",
              options: {
                Size: "S",
              },
              prices: [
                {
                  amount: 119000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "M",
              sku: "SWEATSHIRT-M",
              options: {
                Size: "M",
              },
              prices: [
                {
                  amount: 129000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "L",
              sku: "SWEATSHIRT-L",
              options: {
                Size: "L",
              },
              prices: [
                {
                  amount: 139000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "XL",
              sku: "SWEATSHIRT-XL",
              options: {
                Size: "XL",
              },
              prices: [
                {
                  amount: 149000,
                  currency_code: "cop",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Medusa Sweatpants",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Pantalones")!.id,
          ],
          description:
            "Reimagine the feeling of classic sweatpants. With our cotton sweatpants, everyday essentials no longer have to be ordinary.",
          handle: "sweatpants",
          weight: 400,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-front.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-back.png",
            },
          ],
          options: [
            {
              title: "Size",
              values: ["S", "M", "L", "XL"],
            },
          ],
          variants: [
            {
              title: "S",
              sku: "SWEATPANTS-S",
              options: {
                Size: "S",
              },
              prices: [
                {
                  amount: 109000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "M",
              sku: "SWEATPANTS-M",
              options: {
                Size: "M",
              },
              prices: [
                {
                  amount: 119000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "L",
              sku: "SWEATPANTS-L",
              options: {
                Size: "L",
              },
              prices: [
                {
                  amount: 129000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "XL",
              sku: "SWEATPANTS-XL",
              options: {
                Size: "XL",
              },
              prices: [
                {
                  amount: 139000,
                  currency_code: "cop",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Medusa Shorts",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Merchandising")!.id,
          ],
          description:
            "Reimagine the feeling of classic shorts. With our cotton shorts, everyday essentials no longer have to be ordinary.",
          handle: "shorts",
          weight: 400,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-front.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-back.png",
            },
          ],
          options: [
            {
              title: "Size",
              values: ["S", "M", "L", "XL"],
            },
          ],
          variants: [
            {
              title: "S",
              sku: "SHORTS-S",
              options: {
                Size: "S",
              },
              prices: [
                {
                  amount: 69000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "M",
              sku: "SHORTS-M",
              options: {
                Size: "M",
              },
              prices: [
                {
                  amount: 75000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "L",
              sku: "SHORTS-L",
              options: {
                Size: "L",
              },
              prices: [
                {
                  amount: 79000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "XL",
              sku: "SHORTS-XL",
              options: {
                Size: "XL",
              },
              prices: [
                {
                  amount: 85000,
                  currency_code: "cop",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Medusa Hoodie",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Sudaderas")!.id,
          ],
          description:
            "Sudadera con capucha premium. Perfecta para cualquier ocasión, con materiales de alta calidad y diseño moderno.",
          handle: "hoodie",
          weight: 600,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-back.png",
            },
          ],
          options: [
            {
              title: "Size",
              values: ["S", "M", "L", "XL", "XXL"],
            },
            {
              title: "Color",
              values: ["Negro", "Gris", "Azul Marino"],
            },
          ],
          variants: [
            {
              title: "S / Negro",
              sku: "HOODIE-S-BLACK",
              options: {
                Size: "S",
                Color: "Negro",
              },
              prices: [
                {
                  amount: 139000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "M / Negro",
              sku: "HOODIE-M-BLACK",
              options: {
                Size: "M",
                Color: "Negro",
              },
              prices: [
                {
                  amount: 149000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "L / Negro",
              sku: "HOODIE-L-BLACK",
              options: {
                Size: "L",
                Color: "Negro",
              },
              prices: [
                {
                  amount: 159000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "M / Gris",
              sku: "HOODIE-M-GRAY",
              options: {
                Size: "M",
                Color: "Gris",
              },
              prices: [
                {
                  amount: 155000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "L / Gris",
              sku: "HOODIE-L-GRAY",
              options: {
                Size: "L",
                Color: "Gris",
              },
              prices: [
                {
                  amount: 165000,
                  currency_code: "cop",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Medusa Jeans",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Pantalones")!.id,
          ],
          description:
            "Jeans clásicos de corte regular. Duraderos, cómodos y con el estilo que buscas.",
          handle: "jeans",
          weight: 500,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-front.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-back.png",
            },
          ],
          options: [
            {
              title: "Size",
              values: ["28", "30", "32", "34", "36"],
            },
            {
              title: "Color",
              values: ["Azul Claro", "Azul Oscuro"],
            },
          ],
          variants: [
            {
              title: "30 / Azul Claro",
              sku: "JEANS-30-LIGHT",
              options: {
                Size: "30",
                Color: "Azul Claro",
              },
              prices: [
                {
                  amount: 149000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "32 / Azul Claro",
              sku: "JEANS-32-LIGHT",
              options: {
                Size: "32",
                Color: "Azul Claro",
              },
              prices: [
                {
                  amount: 159000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "34 / Azul Claro",
              sku: "JEANS-34-LIGHT",
              options: {
                Size: "34",
                Color: "Azul Claro",
              },
              prices: [
                {
                  amount: 169000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "30 / Azul Oscuro",
              sku: "JEANS-30-DARK",
              options: {
                Size: "30",
                Color: "Azul Oscuro",
              },
              prices: [
                {
                  amount: 165000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "32 / Azul Oscuro",
              sku: "JEANS-32-DARK",
              options: {
                Size: "32",
                Color: "Azul Oscuro",
              },
              prices: [
                {
                  amount: 175000,
                  currency_code: "cop",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Medusa Cap",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Merchandising")!.id,
          ],
          description:
            "Gorra ajustable con diseño moderno. Perfecta para protegerte del sol con estilo.",
          handle: "cap",
          weight: 150,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png",
            },
          ],
          options: [
            {
              title: "Color",
              values: ["Negro", "Blanco", "Azul"],
            },
          ],
          variants: [
            {
              title: "Negro",
              sku: "CAP-BLACK",
              options: {
                Color: "Negro",
              },
              prices: [
                {
                  amount: 49000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "Blanco",
              sku: "CAP-WHITE",
              options: {
                Color: "Blanco",
              },
              prices: [
                {
                  amount: 45000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "Azul",
              sku: "CAP-BLUE",
              options: {
                Color: "Azul",
              },
              prices: [
                {
                  amount: 55000,
                  currency_code: "cop",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Medusa Backpack",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Merchandising")!.id,
          ],
          description:
            "Mochila resistente y espaciosa. Ideal para el día a día, con múltiples compartimentos y diseño ergonómico.",
          handle: "backpack",
          weight: 800,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png",
            },
          ],
          options: [
            {
              title: "Color",
              values: ["Negro", "Gris", "Verde"],
            },
          ],
          variants: [
            {
              title: "Negro",
              sku: "BACKPACK-BLACK",
              options: {
                Color: "Negro",
              },
              prices: [
                {
                  amount: 189000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "Gris",
              sku: "BACKPACK-GRAY",
              options: {
                Color: "Gris",
              },
              prices: [
                {
                  amount: 199000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "Verde",
              sku: "BACKPACK-GREEN",
              options: {
                Color: "Verde",
              },
              prices: [
                {
                  amount: 219000,
                  currency_code: "cop",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Medusa Sneakers",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Merchandising")!.id,
          ],
          description:
            "Zapatillas deportivas cómodas y versátiles. Perfectas para caminar, hacer ejercicio o usar en el día a día.",
          handle: "sneakers",
          weight: 700,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-front.png",
            },
          ],
          options: [
            {
              title: "Size",
              values: ["38", "39", "40", "41", "42", "43", "44"],
            },
            {
              title: "Color",
              values: ["Blanco", "Negro", "Gris"],
            },
          ],
          variants: [
            {
              title: "40 / Blanco",
              sku: "SNEAKERS-40-WHITE",
              options: {
                Size: "40",
                Color: "Blanco",
              },
              prices: [
                {
                  amount: 229000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "41 / Blanco",
              sku: "SNEAKERS-41-WHITE",
              options: {
                Size: "41",
                Color: "Blanco",
              },
              prices: [
                {
                  amount: 239000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "42 / Blanco",
              sku: "SNEAKERS-42-WHITE",
              options: {
                Size: "42",
                Color: "Blanco",
              },
              prices: [
                {
                  amount: 249000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "40 / Negro",
              sku: "SNEAKERS-40-BLACK",
              options: {
                Size: "40",
                Color: "Negro",
              },
              prices: [
                {
                  amount: 259000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "41 / Negro",
              sku: "SNEAKERS-41-BLACK",
              options: {
                Size: "41",
                Color: "Negro",
              },
              prices: [
                {
                  amount: 269000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "42 / Negro",
              sku: "SNEAKERS-42-BLACK",
              options: {
                Size: "42",
                Color: "Negro",
              },
              prices: [
                {
                  amount: 279000,
                  currency_code: "cop",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Medusa Watch",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Merchandising")!.id,
          ],
          description:
            "Reloj elegante y funcional. Diseño minimalista que combina con cualquier estilo.",
          handle: "watch",
          weight: 200,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-back.png",
            },
          ],
          options: [
            {
              title: "Color",
              values: ["Negro", "Plateado", "Dorado"],
            },
          ],
          variants: [
            {
              title: "Negro",
              sku: "WATCH-BLACK",
              options: {
                Color: "Negro",
              },
              prices: [
                {
                  amount: 169000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "Plateado",
              sku: "WATCH-SILVER",
              options: {
                Color: "Plateado",
              },
              prices: [
                {
                  amount: 189000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "Dorado",
              sku: "WATCH-GOLD",
              options: {
                Color: "Dorado",
              },
              prices: [
                {
                  amount: 199000,
                  currency_code: "cop",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Echo Dot",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Merchandising")!.id,
          ],
          description:
            "Echo Dot (5ª generación), altavoz inteligente con Alexa | Sonido nítido y graves mejorados | Control por voz para música, noticias y más",
          handle: "echo-dot",
          weight: 300,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            // Imágenes color Negro
            {
              url: "https://http2.mlstatic.com/D_NQ_NP_2X_964890-MLA96099646259_102025-F.webp",
            },
            {
              url: "https://http2.mlstatic.com/D_NQ_NP_2X_748090-MLA79401219676_092024-F.webp",
            },
            {
              url: "https://http2.mlstatic.com/D_NQ_NP_2X_785471-MLA79645484437_092024-F.webp",
            },
            {
              url: "https://http2.mlstatic.com/D_NQ_NP_2X_698430-MLA79401219682_092024-F.webp",
            },
            // Imágenes color Blanco
            {
              url: "https://http2.mlstatic.com/D_NQ_NP_2X_914167-MLA98306848676_112025-F.webp",
            },
            // Imágenes color Azul
            {
              url: "https://http2.mlstatic.com/D_NQ_NP_2X_611151-MLA95712609398_102025-F.webp",
            },
          ],
          options: [
            {
              title: "Color",
              values: ["Negro", "Blanco", "Azul"],
            },
          ],
          variants: [
            {
              title: "Negro",
              sku: "ECHO-DOT-NEGRO",
              options: {
                Color: "Negro",
              },
              prices: [
                {
                  amount: 220000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "Blanco",
              sku: "ECHO-DOT-BLANCO",
              options: {
                Color: "Blanco",
              },
              prices: [
                {
                  amount: 230000,
                  currency_code: "cop",
                },
              ],
            },
            {
              title: "Azul",
              sku: "ECHO-DOT-AZUL",
              options: {
                Color: "Azul",
              },
              prices: [
                {
                  amount: 240000,
                  currency_code: "cop",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  });
  logger.info("Datos de productos sembrados correctamente.");

  // Obtener productos creados para usar en collections
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle"],
  });

  // Asociar imágenes específicas a las variantes del Echo Dot
  try {
    const { data: echoDotProducts } = await query.graph({
      entity: "product",
      fields: ["id", "handle"],
      filters: {
        handle: "echo-dot",
      },
    });

    if (echoDotProducts && echoDotProducts.length > 0) {
      const product = echoDotProducts[0];
      const productWithVariants = await productModuleService.retrieveProduct(
        product.id,
        {
          relations: ["variants", "variants.images", "images"],
        }
      );

      // URLs de imágenes por color
      const negroImageUrls = [
        "https://http2.mlstatic.com/D_NQ_NP_2X_964890-MLA96099646259_102025-F.webp",
        "https://http2.mlstatic.com/D_NQ_NP_2X_748090-MLA79401219676_092024-F.webp",
        "https://http2.mlstatic.com/D_NQ_NP_2X_785471-MLA79645484437_092024-F.webp",
        "https://http2.mlstatic.com/D_NQ_NP_2X_698430-MLA79401219682_092024-F.webp",
      ];
      const blancoImageUrls = [
        "https://http2.mlstatic.com/D_NQ_NP_2X_914167-MLA98306848676_112025-F.webp",
      ];
      const azulImageUrls = [
        "https://http2.mlstatic.com/D_NQ_NP_2X_611151-MLA95712609398_102025-F.webp",
      ];

      // Encontrar las imágenes del producto por URL
      const productImages = productWithVariants.images || [];
      const getImageIdsByUrls = (urls: string[]) => {
        return productImages
          .filter((img: any) => urls.includes(img.url))
          .map((img: any) => img.id);
      };

      // Asociar imágenes a cada variante
      if (productWithVariants.variants) {
        for (const variant of productWithVariants.variants) {
          let imageIds: string[] = [];

          if (variant.title === "Negro") {
            imageIds = getImageIdsByUrls(negroImageUrls);
          } else if (variant.title === "Blanco") {
            imageIds = getImageIdsByUrls(blancoImageUrls);
          } else if (variant.title === "Azul") {
            imageIds = getImageIdsByUrls(azulImageUrls);
          }

          if (imageIds.length > 0) {
            // Nota: En Medusa v2, las imágenes de variantes se pueden asociar de esta manera
            await (productModuleService as any).updateProductVariants(
              variant.id,
              {
                images: imageIds,
              }
            );
          }
        }
      }
      logger.info("Imágenes asociadas a variantes del Echo Dot correctamente.");
    }
  } catch (error: any) {
    logger.info(
      `No se pudieron asociar imágenes a variantes del Echo Dot: ${
        error?.message || String(error)
      }`
    );
  }

  logger.info("Sembrando tipos de producto...");
  try {
    const productTypes = await productModuleService.createProductTypes([
      { value: "ropa" },
      { value: "accesorios" },
      { value: "calzado" },
    ]);
    logger.info("Tipos de producto sembrados correctamente.");
  } catch (error: any) {
    // Silencioso - no mostrar warning
  }

  logger.info("Sembrando etiquetas de producto...");
  try {
    const tags = await productModuleService.createProductTags([
      { value: "nuevo" },
      { value: "popular" },
      { value: "oferta" },
      { value: "temporada" },
      { value: "premium" },
    ]);
    logger.info("Etiquetas de producto sembradas correctamente.");
  } catch (error: any) {
    // Silencioso - no mostrar warning
  }

  logger.info("Sembrando colecciones...");
  try {
    // Verificar si las colecciones ya existen
    const existingCollections = await query.graph({
      entity: "product_collection",
      fields: ["id", "handle"],
    });

    const existingHandles = new Set(
      (existingCollections.data || []).map((c: any) => c.handle)
    );

    const collectionsToCreate = [
      { title: "Nuevos Lanzamientos", handle: "nuevos-lanzamientos" },
      { title: "Más Vendidos", handle: "mas-vendidos" },
      { title: "Ofertas Especiales", handle: "ofertas-especiales" },
      { title: "Ropa Premium", handle: "ropa-premium" },
    ].filter((c) => !existingHandles.has(c.handle));

    // Crear colecciones usando el método correcto del módulo de productos
    // Según la documentación: https://docs.medusajs.com/user-guide/products/collections
    if (collectionsToCreate.length > 0) {
      let createdCount = 0;
      for (const collectionData of collectionsToCreate) {
        try {
          // En Medusa v2, usar el método createCollections del módulo de productos
          const result = await (productModuleService as any).createCollections(
            collectionsToCreate.map((c) => ({
              title: c.title,
              handle: c.handle,
            }))
          );
          createdCount = result?.length || collectionsToCreate.length;
          break; // Si funciona, crear todas de una vez
        } catch (err: any) {
          // Si createCollections no funciona, intentar crear una por una
          try {
            await (productModuleService as any).createCollections([
              {
                title: collectionData.title,
                handle: collectionData.handle,
              },
            ]);
            createdCount++;
          } catch (err2: any) {
            logger.info(
              `No se pudo crear colección "${collectionData.title}": ${
                err2?.message || String(err2)
              }`
            );
          }
        }
      }

      if (createdCount > 0) {
        logger.info(
          `${createdCount} colecciones creadas: ${collectionsToCreate
            .slice(0, createdCount)
            .map((c) => c.title)
            .join(", ")}`
        );
      } else {
        logger.info(
          `No se pudieron crear colecciones programáticamente. Crear manualmente desde Medusa Admin (Products → Collections): ${collectionsToCreate
            .map((c) => `${c.title} (handle: ${c.handle})`)
            .join(", ")}`
        );
      }
    } else {
      logger.info("Todas las colecciones ya existen.");
    }

    // Obtener todas las colecciones después de crearlas
    const allCollections = await query.graph({
      entity: "product_collection",
      fields: ["id", "handle", "title"],
    });

    logger.info(`Total de colecciones: ${(allCollections.data || []).length}`);
    logger.info("Colecciones sembradas correctamente.");
  } catch (error: any) {
    logger.info(
      `No se pudieron crear colecciones: ${
        error?.message || String(error)
      }. Crear manualmente desde Medusa Admin.`
    );
  }

  logger.info("Sembrando campañas...");
  let campaign: any = null;
  try {
    campaign = await promotionModuleService.createCampaigns({
      campaign_identifier: "lanzamiento-colombia-2024",
      name: "Campaña de Lanzamiento Colombia",
      description: "Campaña especial para el lanzamiento en Colombia",
      starts_at: new Date(),
      ends_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      budget: {
        type: "usage",
        limit: 10000000,
      },
    });
    logger.info("Campaña creada correctamente.");
  } catch (error: any) {
    // Silencioso - no mostrar warning
  }

  logger.info("Sembrando promociones...");
  if (campaign) {
    try {
      // Crear promociones - la estructura es compleja, intentamos crear una básica
      const promotion1 = await promotionModuleService.createPromotions({
        code: "DESCUENTO10",
        type: "standard",
        is_automatic: false,
        status: "active",
        campaign_id: campaign.id,
        application_method: {
          type: "fixed",
          target_type: "items",
          allocation: "across",
          value: 10000,
          currency_code: "cop",
        },
        rules: [],
      });
      logger.info("Promoción DESCUENTO10 creada.");

      const promotion2 = await promotionModuleService.createPromotions({
        code: "ENVIOGRATIS",
        type: "standard",
        is_automatic: false,
        status: "active",
        campaign_id: campaign.id,
        application_method: {
          type: "fixed",
          target_type: "shipping_methods",
          allocation: "across",
          value: 0,
          currency_code: "cop",
        },
        rules: [],
      });
      logger.info("Promoción ENVIOGRATIS creada.");

      const promotion3 = await promotionModuleService.createPromotions({
        code: "20PORCIENTO",
        type: "standard",
        is_automatic: false,
        status: "active",
        campaign_id: campaign.id,
        application_method: {
          type: "percentage",
          target_type: "items",
          allocation: "across",
          value: 20,
        },
        rules: [],
      });
      logger.info("Promoción 20PORCIENTO creada.");

      logger.info("Promociones creadas correctamente.");
    } catch (error: any) {
      // Silencioso - no mostrar warning
    }
  }

  logger.info("Sembrando lista de precios...");
  try {
    await pricingModuleService.createPriceLists([
      {
        title: "Lista de Precios Mayorista",
        description: "Precios especiales para clientes mayoristas",
        type: "sale",
        status: "active",
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        rules: {
          customer_group_id: [],
          region_id: [region.id],
        },
      },
    ]);
    logger.info("Lista de precios creada correctamente.");
  } catch (error: any) {
    // Silencioso - no mostrar warning
  }

  logger.info("Ubicaciones y envío configurados correctamente.");

  logger.info("Sembrando niveles de inventario...");

  // Obtener todos los inventory items (se crean automáticamente cuando se crean productos)
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  if (!inventoryItems || inventoryItems.length === 0) {
    logger.info(
      "No se encontraron inventory items. Los productos pueden no tener inventario."
    );
  } else {
    const inventoryLevels: CreateInventoryLevelInput[] = [];
    for (const inventoryItem of inventoryItems) {
      const inventoryLevel = {
        location_id: stockLocation.id,
        stocked_quantity: 1000000, // Stock disponible
        reserved_quantity: 0, // Cantidad reservada (inicialmente 0)
        inventory_item_id: inventoryItem.id,
      };
      inventoryLevels.push(inventoryLevel);
    }

    if (inventoryLevels.length > 0) {
      await createInventoryLevelsWorkflow(container).run({
        input: {
          inventory_levels: inventoryLevels,
        },
      });
      logger.info(
        `Niveles de inventario sembrados correctamente para ${inventoryLevels.length} items en ubicación: ${stockLocation.name}`
      );
    } else {
      logger.info("No hay niveles de inventario para crear.");
    }
  }
}
