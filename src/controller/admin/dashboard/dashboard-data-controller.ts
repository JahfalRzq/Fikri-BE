import type { Request, Response } from "express";
import { AppDataSource } from "@/data-source";
import { trainingParticipant, statusTraining } from "@/model/training-participant";
import { certificate } from "@/model/certificate";
import { coach } from "@/model/coach";
import { training } from "@/model/training";
import { category } from "@/model/category";
import { successResponse } from "@/utils/response";
import { IsNull, Not, Equal, And } from "typeorm";


const participantTrainingRepository = AppDataSource.getRepository(trainingParticipant);
const certificateRepository = AppDataSource.getRepository(certificate);
const coachRepository = AppDataSource.getRepository(coach);
const trainingRepository = AppDataSource.getRepository(training);
const categoryRepository = AppDataSource.getRepository(category); // Untuk mendapatkan nama kategori

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    // --- Statistik Utama ---
    // 1. Total Peserta Unik
    const totalParticipantsResult = await participantTrainingRepository
      .createQueryBuilder("tp")
      .select("COUNT(DISTINCT tp.participant)", "count") // Menghitung participant unik
      .getRawOne();
    const totalParticipants = totalParticipantsResult?.count || 0;

    // 2. Peserta Sedang Berlangsung
    const participantsSedangBerlangsung = await participantTrainingRepository.countBy({
      status: statusTraining.sedangBerlangsung,
    });

    // 3. Peserta Selesai
    const participantsSelesai = await participantTrainingRepository.countBy({
      status: statusTraining.selesai,
    });

     // 4. Sertifikat Terkirim (berdasarkan noLiscense dan imageUrl tidak null dan tidak kosong)
    const totalCertificatesSent = await certificateRepository.count({
      where: {
        noLiscense: And(Not(IsNull()), Not(Equal(""))), // Tidak null dan tidak string kosong
        imageUrl: And(Not(IsNull()), Not(Equal(""))),   // Tidak null dan tidak string kosong
      }
    });
    // 5. Jumlah Pelatih
    const totalTrainers = await coachRepository.count();

    // --- Data Grafik dan Tabel ---
    // 6. Data Tipe Training (In-House vs Public)
    // Asumsi: Nama kategori digunakan untuk menentukan tipe.
    // Misal: Jika nama kategori mengandung 'Public' -> Public, selain itu -> In-House
    // Anda bisa menyesuaikan logika ini berdasarkan struktur data kategori yang sesungguhnya.
    const trainingTypeData = await participantTrainingRepository
      .createQueryBuilder("tp")
      .innerJoin("tp.training", "t")
      .innerJoin("t.trainingCategory", "tc")
      .innerJoin("tc.category", "c")
      .select("c.categoryName", "name") // Gunakan nama kategori
      .addSelect("COUNT(tp.id)", "value")
      .groupBy("c.id")
      .addGroupBy("c.categoryName")
      .getRawMany();

    // Jika ingin hanya menghitung In-House dan Public berdasarkan nama kategori tertentu:
    // const trainingTypeData = await participantTrainingRepository
    //   .createQueryBuilder("tp")
    //   .innerJoin("tp.training", "t")
    //   .innerJoin("t.trainingCategory", "tc")
    //   .innerJoin("tc.category", "c")
    //   .select("CASE WHEN c.categoryName LIKE '%Public%' THEN 'Public Training' ELSE 'In-House Training' END", "name")
    //   .addSelect("COUNT(tp.id)", "value")
    //   .groupBy("CASE WHEN c.categoryName LIKE '%Public%' THEN 'Public Training' ELSE 'In-House Training' END")
    //   .getRawMany();

    // 7. Data Grafik Tren Bulanan (Jumlah peserta baru berdasarkan startDateTraining)
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const chartData = await participantTrainingRepository
      .createQueryBuilder("tp")
      .select("DATE_FORMAT(tp.startDateTraining, '%b')", "month") // Format bulan (Jan, Feb, ...)
      .addSelect("DATE_FORMAT(tp.startDateTraining, '%Y-%m')", "yearMonth") // For ordering
      .addSelect("COUNT(tp.id)", "value")
      .where("tp.startDateTraining >= :oneYearAgo", { oneYearAgo })
      .groupBy("DATE_FORMAT(tp.startDateTraining, '%Y-%m')") // Group by bulan-tahun untuk akurasi
      .addGroupBy("DATE_FORMAT(tp.startDateTraining, '%b')") // Also group by month name
      .orderBy("yearMonth", "ASC")
      .getRawMany();

    // Isi data bulan kosong jika diperlukan
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const filledChartData = months.map(month => {
      const found = chartData.find((d: any) => d.month === month);
      return {
        month,
        value: found ? parseInt(found.value) : 0,
      };
    });

    // 8. Data Top 10 Trainings
    const topTrainings = await participantTrainingRepository
      .createQueryBuilder("tp")
      .innerJoin("tp.training", "t")
      .select("t.trainingName", "name")
      .addSelect("COUNT(tp.id)", "value") // Jumlah partisipasi
      .groupBy("t.id")
      .addGroupBy("t.trainingName")
      .orderBy("COUNT(tp.id)", "DESC")
      .limit(10) // Ambil 10 teratas
      .getRawMany<{ name: string; value: number }>();

    const dashboardData = {
      totalParticipants,
      participantsSedangBerlangsung,
      participantsSelesai,
      totalCertificatesSent, // Ditambahkan
      totalTrainers,        // Ditambahkan
      trainingTypeData,     // Ditambahkan
      trainingProgressData: filledChartData, // Ditambahkan
      topTrainings,         // Ditambahkan
    };

    return res
      .status(200)
      .send(
        successResponse(
          "Dashboard data retrieved successfully",
          { data: dashboardData }, // Struktur data diubah agar sesuai dengan permintaan frontend
          200,
        ),
      );
  } catch (error) {
    console.error("Error fetching dashboard data:", error); // Log error untuk debugging
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};