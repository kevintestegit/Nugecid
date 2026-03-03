import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

function buildSslConfig(): false | Record<string, unknown> {
  if (process.env.DATABASE_SSL !== "true") return false;

  const caCert = process.env.DATABASE_SSL_CA;
  if (caCert) {
    return { rejectUnauthorized: true, ca: caCert };
  }

  return { rejectUnauthorized: false };
}

const MigrationDataSource = new DataSource({
  type: "postgres",
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT || "5432", 10),
  username: process.env.DATABASE_USERNAME || "postgres",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "sgc_itep",
  ssl: buildSslConfig(),
  entities: [__dirname + "/../**/*.entity{.ts,.js}"],
  migrations: [__dirname + "/../migrations/*{.ts,.js}"],
  synchronize: false,
  logging: ["error", "warn"],
});

export default MigrationDataSource;
