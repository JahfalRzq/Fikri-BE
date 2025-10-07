import { AppDataSource } from "@/data-source";
import { masterSeeder } from "@/controller/seeder/master-seeder";
import express from "express";

/**
 * Seeder runner — menjalankan semua seeder dalam urutan yang benar
 */
(async () => {
  try {
    await AppDataSource.initialize();
    console.log("🚀 Database connected. Running seeders...");

    const mockReq = {} as express.Request;
    const mockRes = {
      status: (code: number) => ({
        send: (data: any) => console.log(`✅ Seeder [${code}]:`, data?.message || data),
      }),
    } as unknown as express.Response;

    // Jalankan master seeder terlebih dahulu
    await masterSeeder(mockReq, mockRes);

    // (opsional) Jalankan training seeder tambahan jika perlu

    console.log("🌱 All seeders completed successfully!");
    await AppDataSource.destroy();
  } catch (error) {
    console.error("❌ Seeder failed:", error);
    process.exit(1);
  }
})();
