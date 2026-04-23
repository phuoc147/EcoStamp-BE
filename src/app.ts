import "./config";
import express from "express";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { authRouter } from "./modules/auth/routes";
import { addressRouter } from "./modules/address/routes";
import { wasteRouter } from "./modules/waste/route";
import { userRouter } from "./modules/user/route";
import { env } from "./config";
import { errorHandler, notFoundHandler } from "./middlewares/error";
import cors from "cors";
import { openApiDocument } from "./docs/openapi";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use("/auth", authRouter);
app.use("/", userRouter);
app.use("/", addressRouter);
app.use("/", wasteRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
	console.log(`Server running at http://localhost:${env.port}`);
	console.log(`Swagger docs available at http://localhost:${env.port}/api-docs`);
});

