import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { env } from "../config";
import { registerAuthOpenApi } from "../modules/auth/routes";
import { registerAddressOpenApi } from "../modules/address/routes";
import { registerWasteTransactionOpenApi } from "../modules/waste-transaction/routes";
import { registerUserOpenApi } from "../modules/user/route";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "cookieAuth", {
  type: "apiKey",
  in: "cookie",
  name: "session_token",
});

registerAuthOpenApi(registry);
registerUserOpenApi(registry);
registerAddressOpenApi(registry);
registerWasteTransactionOpenApi(registry);

export const openApiDocument = new OpenApiGeneratorV3(registry.definitions).generateDocument({
  openapi: "3.0.3",
  info: {
    title: "EcoStamp Backend API",
    version: "1.0.0",
    description: "Session-based authentication API using Express, Drizzle, and PostgreSQL",
  },
  servers: [{ url: `http://localhost:${env.port}` }],
});
