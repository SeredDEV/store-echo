import { model } from "@medusajs/framework/utils";

const Brand = model.define("brand", {
  id: model.id().primaryKey(),
  name: model.text(),
  handle: model.text(),
  description: model.text().nullable(),
  logo_url: model.text().nullable(),
  is_active: model.boolean().default(true),
});

export default Brand;
