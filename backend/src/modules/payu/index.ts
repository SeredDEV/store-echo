import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import PayUProviderService from "./service";

export default ModuleProvider(Modules.PAYMENT, {
  services: [PayUProviderService],
});
