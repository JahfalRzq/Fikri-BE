import { AppDataSource } from "@/data-source";
import { DataSource } from "typeorm";

(async () => {
  try {
    const dataSource = new DataSource({
      ...AppDataSource.options,
      synchronize: false,
    });

    await dataSource.initialize();

    const dbName = (AppDataSource.options as any).database;
    console.log(`🗑  Dropping database: ${dbName}...`);

    await dataSource.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);
    await dataSource.query(`CREATE DATABASE \`${dbName}\`;`);

    console.log("✅ Database dropped and recreated successfully!");
    await dataSource.destroy();
  } catch (error) {
    console.error("❌ Error while dropping database:", error);
    process.exit(1);
  }
})();
