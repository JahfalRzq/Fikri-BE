import type { Request, Response } from "express";
import { AppDataSource } from "@/data-source";
import { user, UserRole } from "@/model/user";
import Joi from "joi";
import { training } from "@/model/training";
import { participant } from "@/model/participant";
import { trainingParticipantCategory } from "@/model/training-participant-category";
import {
  successResponse,
  validationResponse,
  errorResponse
} from "@/utils/response";
import { trainingParticipant, statusTraining } from "@/model/training-participant";
import { certificate } from "@/model/certificate";
import * as xlsx from "xlsx";
import { In } from "typeorm";
import { coach } from "@/model/coach";



const trainingRepository = AppDataSource.getRepository(training);
const userRepository = AppDataSource.getRepository(user);
const participantRepository = AppDataSource.getRepository(participant);
const trainingParticipantRepository = AppDataSource.getRepository(trainingParticipant)
const trainingParticipantCategoryRepository = AppDataSource.getRepository(trainingParticipantCategory);
const certificateRepository = AppDataSource.getRepository(certificate)


export const bulkUploadParticipants = async (req: Request, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    if (!req.file) {
      return res.status(400).send(errorResponse("No Excel file uploaded.", 400));
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const excelRows: any[] = xlsx.utils.sheet_to_json(worksheet);

    if (excelRows.length === 0) {
      return res.status(400).send(errorResponse("Excel file is empty.", 400));
    }

    // helper parse boolean (returns boolean | undefined)
    const parseBoolOrUndef = (val: any): boolean | undefined => {
      if (typeof val === "boolean") return val;
      if (typeof val === "string") {
        const v = val.trim().toLowerCase();
        if (["true", "1", "yes", "y"].includes(v)) return true;
        if (["false", "0", "no", "n"].includes(v)) return false;
      }
      if (typeof val === "number") return val === 1;
      return undefined;
    };

    // Collect all unique training names from Excel
    const trainingNamesInFile = Array.from(
      new Set(
        excelRows
          .filter(r => r['judul training'])
          .map(r => String(r['judul training']).trim())
      )
    );

    if (trainingNamesInFile.length === 0) {
      return res.status(422).send(
        errorResponse("No 'judul training' found in Excel file.", 422)
      );
    }

    // Fetch all trainings by name (case-insensitive)
    const trainingsFromDB = await queryRunner.manager
      .createQueryBuilder(training, "t")
      .where("LOWER(t.trainingName) IN (:...names)", {
        names: trainingNamesInFile.map(n => n.toLowerCase())
      })
      .leftJoinAndSelect("t.trainingCategory", "trainingCategory")
      .leftJoinAndSelect("trainingCategory.category", "category")
      .leftJoinAndSelect("t.trainingCoach", "trainingCoach")
      .getMany();

    // Create a map: trainingName.toLowerCase() -> training object
    const trainingMap = new Map<string, training>();
    trainingsFromDB.forEach(t => {
      trainingMap.set(t.trainingName.toLowerCase(), t);
    });

    // Prefetch participants
    const emailsInFile = Array.from(
      new Set(
        excelRows.filter(r => r.email).map(r => String(r.email).trim())
      )
    );
    const namesInFile = Array.from(
      new Set(
        excelRows.filter(r => r['nama peserta']).map(r => String(r['nama peserta']).trim())
      )
    );
    const instrukturNames = Array.from(
      new Set(
        excelRows.filter(r => r.instruktur).map(r => String(r.instruktur).trim())
      )
    );

    const participantsByEmail = emailsInFile.length > 0
      ? await queryRunner.manager.findBy(participant, { email: In(emailsInFile) })
      : [];
    const participantsByFirstName = namesInFile.length > 0
      ? await queryRunner.manager.createQueryBuilder(participant, "p")
        .where("p.firstName IN (:...names)", { names: namesInFile })
        .getMany()
      : [];

    const participantEmailMap = new Map(participantsByEmail.map(p => [p.email, p]));
    const participantFirstNameMap = new Map(participantsByFirstName.map(p => [p.firstName, p]));

    // Prefetch coaches by name
    let coachMap = new Map<string, coach>();
    if (instrukturNames.length > 0) {
      const coaches = await queryRunner.manager
        .createQueryBuilder(coach, "c")
        .where("c.coachName IN (:...names)", { names: instrukturNames })
        .getMany();
      coachMap = new Map(coaches.map(c => [c.coachName, c]));
    }

    // Loose schema validation
    const schema = Joi.object({
      no: Joi.any().optional(),
      tanggal: Joi.any().optional(),
      'judul training': Joi.string().required(), // NOW REQUIRED
      'nama peserta': Joi.string().optional(),
      instansi: Joi.string().optional(),
      jabatan: Joi.string().optional(),
      'no hp': Joi.any().optional(),  // ✅ Sekarang terima number atau string
      'penanggung jawab peserta': Joi.string().optional(),
      instruktur: Joi.string().optional(),
      ruangan: Joi.string().optional(),
      email: Joi.string().email().optional(),
      keterangan: Joi.string().optional(),
      'non WT': Joi.any().optional(),
      pic: Joi.string().optional(),
      'alamat pengiriman': Joi.string().optional(),
      'joinan apa bila tidak': Joi.string().optional(),
      notes: Joi.string().optional(),
      'nama pendaftaran (bool)': Joi.any().optional(),
      'absensi (bool)': Joi.any().optional(),
      'nametag (bool)': Joi.any().optional(),
      cover: Joi.any().optional(),
      terima: Joi.any().optional(),
      invoice: Joi.any().optional(),
      'pajak (bool)': Joi.any().optional(),
    });

    const successfulCreations: any[] = [];
    const failedCreations: any[] = [];

    for (let i = 0; i < excelRows.length; i++) {
      const row = excelRows[i];
      const rowIndex = i + 2;

      const { error: validationError } = schema.validate(row);
      if (validationError) {
        failedCreations.push({
          rowIndex,
          reason: `Schema Validation Error: ${validationError.message}`
        });
        continue;
      }

      // Find training by name
      const trainingNameFromRow = row['judul training']
        ? String(row['judul training']).trim()
        : '';

      if (!trainingNameFromRow) {
        failedCreations.push({
          rowIndex,
          reason: "Missing 'judul training' column."
        });
        continue;
      }

      const trainingRec = trainingMap.get(trainingNameFromRow.toLowerCase());
      if (!trainingRec) {
        failedCreations.push({
          rowIndex,
          reason: `Training '${trainingNameFromRow}' not found in database.`
        });
        continue;
      }

      // 1) Find participant by email then firstName
      let matchedParticipant: participant | undefined;
      if (row.email && participantEmailMap.has(String(row.email).trim())) {
        matchedParticipant = participantEmailMap.get(String(row.email).trim());
      } else if (row['nama peserta'] && participantFirstNameMap.has(String(row['nama peserta']).trim())) {
        matchedParticipant = participantFirstNameMap.get(String(row['nama peserta']).trim());
      }

      // 2) If not found -> create participant
      if (!matchedParticipant) {
        if (!row['nama peserta'] && !row.email) {
          failedCreations.push({
            rowIndex,
            reason: "Missing 'nama peserta' and 'email' — cannot create participant."
          });
          continue;
        }

        const newP = new participant();
        const [firstName, ...lastParts] = (row['nama peserta'] || "").split(" ");
        newP.firstName = firstName || (row.email ? row.email.split("@")[0] : "Unknown");
        newP.lastName = lastParts.join(" ").trim() || "";
        newP.email = row.email ? String(row.email).trim() : "";
        newP.company = row.instansi ? String(row.instansi) : "";
        newP.phone = row['no hp'] ? String(row['no hp']) : "";
        newP.jobTitle = row.jabatan ? String(row.jabatan) : "";
        newP.companyAddress = row['alamat pengiriman'] ? String(row['alamat pengiriman']) : "";
        newP.officePhone = "";
        newP.message = "";

        try {
          matchedParticipant = await queryRunner.manager.save(participant, newP);
          if (matchedParticipant.email) participantEmailMap.set(matchedParticipant.email, matchedParticipant);
          if (matchedParticipant.firstName) participantFirstNameMap.set(matchedParticipant.firstName, matchedParticipant);
        } catch (err) {
          failedCreations.push({
            rowIndex,
            reason: `Failed to create participant: ${(err as Error).message}`
          });
          continue;
        }
      }

      // 3) Create trainingParticipant
      try {
        const newTP = new trainingParticipant();
        newTP.training = trainingRec;
        newTP.participant = matchedParticipant;
        newTP.status = statusTraining.belumMulai;

        // Coach: prefer instruktur name match, else training coach
        if (row.instruktur && coachMap.has(String(row.instruktur).trim())) {
          newTP.coach = coachMap.get(String(row.instruktur).trim()) as any;
        } else {
          newTP.coach = trainingRec.trainingCoach;
        }

        // Map fields
        newTP.penanggung_jawab_peserta = row['penanggung jawab peserta']
          ? String(row['penanggung jawab peserta'])
          : "";
        newTP.ruangan = row.ruangan ? String(row.ruangan) : "";
        newTP.keterangan = row.keterangan ? String(row.keterangan) : "";
        newTP.non_wt = row['non WT'] ? String(row['non WT']) : "";
        newTP.pic = row.pic ? String(row.pic) : "";
        newTP.alamat_pengiriman = row['alamat pengiriman']
          ? String(row['alamat pengiriman'])
          : "";
        newTP.joinan_atau_tidak = row['joinan apa bila tidak']
          ? String(row['joinan apa bila tidak'])
          : "";

        // Boolean fields
        newTP.nama_pendaftaran = parseBoolOrUndef(row['nama pendaftaran (bool)']) ?? null as any;
        newTP.absensi = parseBoolOrUndef(row['absensi (bool)']) ?? null as any;
        newTP.nametag = parseBoolOrUndef(row['nametag (bool)']) ?? null as any;
        newTP.cover = parseBoolOrUndef(row.cover) ?? null as any;
        newTP.terima = parseBoolOrUndef(row.terima) ?? null as any;
        newTP.invoice = parseBoolOrUndef(row.invoice) ?? null as any;
        newTP.pajak = parseBoolOrUndef(row['pajak (bool)']) ?? null as any;

        // Signatory/ttd and dates from training master
        newTP.signatoryName = trainingRec.signatoryName || "";
        newTP.signatoryPosition = trainingRec.signatoryPosition || "";
        newTP.ttdImage = trainingRec.ttdImage || "";
        newTP.startDateTraining = trainingRec.startDateTraining;
        newTP.endDateTraining = trainingRec.endDateTraining;

        const savedTP = await queryRunner.manager.save(trainingParticipant, newTP);

        // 4) Create trainingParticipantCategory
        let firstSavedTPC: any = null;
        if (Array.isArray(trainingRec.trainingCategory) && trainingRec.trainingCategory.length > 0) {
          for (const tc of trainingRec.trainingCategory) {
            const newTPC = new trainingParticipantCategory();
            (newTPC as any).category = tc.category;
            const savedTPC = await queryRunner.manager.save(trainingParticipantCategory, newTPC);
            if (!firstSavedTPC) firstSavedTPC = savedTPC;
          }

          if (firstSavedTPC) {
            savedTP.trainingParticipantCategory = firstSavedTPC;
            await queryRunner.manager.save(trainingParticipant, savedTP);
          }
        }

        // 5) Create certificate
        const cert = new certificate();
        cert.trainingParticipant = savedTP;
        cert.imageUrl = "";
        cert.noLiscense = "";
        const tanggalVal = row.tanggal ? new Date(row.tanggal) : null;
        cert.expiredAt = (tanggalVal && !isNaN(tanggalVal.getTime()))
          ? tanggalVal
          : trainingRec.endDateTraining;
        const savedCert = await queryRunner.manager.save(certificate, cert);

        // Link certificate -> trainingParticipant
        savedTP.certificate = savedCert;
        await queryRunner.manager.save(trainingParticipant, savedTP);

        successfulCreations.push({
          rowIndex,
          trainingName: trainingRec.trainingName,
          participantId: matchedParticipant.id,
          participantName: `${matchedParticipant.firstName} ${matchedParticipant.lastName}`.trim(),
          trainingParticipantId: savedTP.id,
          certificateId: savedCert.id,
        });

      } catch (err) {
        failedCreations.push({
          rowIndex,
          reason: `Failed to create trainingParticipant/certificate: ${(err as Error).message}`
        });
        continue;
      }
    } // end rows

    if (failedCreations.length > 0) {
      await queryRunner.rollbackTransaction();
      return res.status(422).send({
        message: `Process completed with errors. Success: ${successfulCreations.length}, Failed: ${failedCreations.length}`,
        code: 422,
        error: true,
        data: {
          successfulCreations,
          failedCreations
        }
      });
    }

    await queryRunner.commitTransaction();
    return res.status(201).send(
      successResponse(
        `${successfulCreations.length} trainingParticipants (with participants & certificates) created.`,
        { total: successfulCreations.length, data: successfulCreations },
        201
      )
    );

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error("Bulk participant upload error:", error);
    return res.status(500).send(
      errorResponse(
        error instanceof Error ? error.message : "Unknown Error",
        500
      )
    );
  } finally {
    await queryRunner.release();
  }
};

export const getParticipantsByTrainingId = async (req: Request, res: Response) => {
  try {
    const trainingId = req.params.id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "";
    const skip = (page - 1) * limit;

    // ✅ SELECT kolom penting saja
    const queryBuilder = participantRepository
      .createQueryBuilder("participant")
      .leftJoinAndSelect("participant.user", "user")
      .leftJoinAndSelect("participant.trainingParticipant", "tp")
      .leftJoinAndSelect("tp.certificate", "certificate")
      .leftJoinAndSelect("tp.training", "training")
      .leftJoinAndSelect("training.trainingCategory", "trainingCategory")
      .leftJoinAndSelect("trainingCategory.category", "category").orderBy("participant.createdAt", "DESC");

    // ✅ Filter trainingId
    if (trainingId) {
      queryBuilder.andWhere("training.id = :trainingId", { trainingId });
    }

    // ✅ Filter status (optional)
    if (status && Object.values(statusTraining).includes(status as statusTraining)) {
      queryBuilder.andWhere("tp.status = :status", { status });
    }

    // ✅ Search ringan
    if (search) {
      queryBuilder.andWhere(
        `(participant.firstName LIKE :search
          OR participant.lastName LIKE :search
          OR participant.email LIKE :search
          OR user.userName LIKE :search
          OR user.email LIKE :search)`,
        { search: `%${search}%` }
      );
    }

    // ✅ Pagination
    queryBuilder.skip(skip).take(limit);

    // Jalankan query & count terpisah
    const [participants, totalCount] = await Promise.all([
      queryBuilder.getMany(),
      participantRepository
        .createQueryBuilder("participant")
        .leftJoin("participant.trainingParticipant", "tp")
        .leftJoin("tp.training", "training")
        .where("training.id = :trainingId", { trainingId })
        .andWhere("participant.deletedAt IS NULL")
        .getCount(),
    ]);

    // ✅ Transform hasil untuk FE
    const safeData = participants.map((p) => {
      const trainingParticipant = p.trainingParticipant.find((tp: any) => tp.training?.id === trainingId);

      return {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        company: p.company,
        jobTitle: p.jobTitle,
        phone: p.phone,
        user: p.user
          ? {
            id: p.user.id,
            userName: p.user.userName,
          }
          : null,
        status: trainingParticipant?.status ?? "unknown",
        certificate: trainingParticipant?.certificate ?? null,
      };
    });

    return res.status(200).send(
      successResponse(
        "Get Participants by Training ID Success (Optimized & Fixed)",
        {
          data: safeData,
          totalCount,
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
        },
        200
      )
    );
  } catch (error: any) {
    console.error(error);
    return res.status(500).send(errorResponse(error.message, 500));
  }
};


export const getArchivedParticipantsByTrainingId = async (req: Request, res: Response) => {
  try {
    // Ambil 'id' training dari params, sama seperti di fungsi referensi Anda
    const trainingId = req.params.id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const search = (req.query.search as string) || "";
    // Filter status mungkin tidak relevan untuk yang diarsip, tapi bisa ditambahkan jika perlu
    const skip = (page - 1) * limit;

    // ✅ DIUBAH: Query Builder dimulai dari 'trainingParticipant' (tp)
    // Ini adalah perubahan KUNCI karena 'tp' yang di-soft delete
    const queryBuilder = trainingParticipantRepository
      .createQueryBuilder("tp")
      .withDeleted() // PENTING: Untuk bisa menemukan data yang di-soft delete
      .leftJoinAndSelect("tp.participant", "participant")
      .leftJoinAndSelect("participant.user", "user")
      .leftJoinAndSelect("tp.training", "training")
      .leftJoinAndSelect("training.trainingCategory", "trainingCategory")
      .leftJoinAndSelect("trainingCategory.category", "category")
      .orderBy("tp.deletedAt", "DESC"); // Urutkan berdasarkan data yang baru diarsip

    // ✅ Filter hanya peserta dalam training tertentu
    if (trainingId) {
      queryBuilder.andWhere("training.id = :trainingId", { trainingId });
    }

    // ✅ KUNCI UTAMA: Filter HANYA yang sudah di-soft delete (diarsip)
    queryBuilder.andWhere("tp.deletedAt IS NOT NULL");

    // ✅ Search multi-field (logika sama persis)
    if (search) {
      queryBuilder.andWhere(
        `(participant.firstName LIKE :search
          OR participant.lastName LIKE :search
          OR participant.email LIKE :search
          OR user.userName LIKE :search
          OR user.email LIKE :search)`,
        { search: `%${search}%` }
      );
    }

    // ✅ Pagination
    queryBuilder.skip(skip).take(limit);

    // Hasilnya adalah array dari 'trainingParticipant'
    const [trainingParticipants, totalCount] = await queryBuilder.getManyAndCount();

    // ✅ Transform hasil (format sama persis dengan 'safeData' Anda)
    const safeData = trainingParticipants.map((tp) => {
      // 'tp' adalah 'trainingInfo' dari fungsi referensi Anda
      const p = tp.participant; // 'p' adalah partisipannya
      if (!p) return null; // Keamanan jika ada data yatim

      // Ekstrak kategori (logika sama persis)
      const categoriesArray = tp.training?.trainingCategory?.map((tc: any) => tc.category) || [];
      const firstCategory = categoriesArray.length > 0 ? categoriesArray[0] : null;

      return {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        company: p.company,
        jobTitle: p.jobTitle,
        phone: p.phone,
        message: p.message,
        createdAt: p.createdAt,
        user: p.user
          ? {
            id: p.user.id,
            userName: p.user.userName,
            role: p.user.role,
            image: p.user.imageAvatar,
          }
          : null,
        status: tp.status ?? "Archived", // Tampilkan status dari 'tp' atau "Archived"
        deletedAt: tp.deletedAt, // Sertakan info kapan dihapus
        training: tp.training
          ? {
            id: tp.training.id,
            trainingName: tp.training.trainingName,
            startDateTraining: tp.training.startDateTraining,
            endDateTraining: tp.training.endDateTraining,
            category: firstCategory,
          }
          : null,
      };
    }).filter(Boolean); // Hapus data null jika ada

    return res.status(200).send(
      successResponse(
        "Get Archived Participants by Training ID Success", // Pesan diubah
        {
          data: safeData,
          totalCount,
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
        },
        200
      )
    );
  } catch (error: any) {
    return res.status(500).send(errorResponse(error.message, 500));
  }
};


export const getAllParticipant = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      company,
      trainingCode,
      startDateTraining,
      endDateTraining,
      search,
      status, // filter status trainingParticipant
      limit: queryLimit,
      page,
    } = req.query;

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (startDateTraining) {
      startDate = new Date(startDateTraining as string);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({
          msg: "Invalid startDateTraining format. Expected YYYY-MM-DD.",
        });
      }
    }

    if (endDateTraining) {
      endDate = new Date(endDateTraining as string);
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({
          msg: "Invalid endDateTraining format. Expected YYYY-MM-DD.",
        });
      }
    }

    const queryBuilder = participantRepository
      .createQueryBuilder("participant")
      .leftJoinAndSelect("participant.user", "user")
      .leftJoinAndSelect("participant.trainingParticipant", "tp")
      .leftJoinAndSelect("tp.training", "training")
      .leftJoinAndSelect("training.trainingCategory", "trainingCategory")
      .leftJoinAndSelect("trainingCategory.category", "category")
      .orderBy("participant.createdAt", "DESC");

    // 🔍 Filter nama depan
    if (firstName) {
      queryBuilder.andWhere("participant.firstName LIKE :firstName", {
        firstName: `%${firstName}%`,
      });
    }

    // 🔍 Filter perusahaan
    if (company) {
      queryBuilder.andWhere("participant.company LIKE :company", {
        company: `%${company}%`,
      });
    }

    // 🔍 Filter kode pelatihan
    if (trainingCode) {
      queryBuilder.andWhere("category.trainingCode LIKE :trainingCode", {
        trainingCode: `%${trainingCode}%`,
      });
    }

    // 🔍 Search multi-field
    if (search) {
      queryBuilder.andWhere(
        `(participant.firstName LIKE :search 
          OR participant.lastName LIKE :search 
          OR participant.email LIKE :search 
          OR user.userName LIKE :search 
          OR user.email LIKE :search)`,
        { search: `%${search}%` }
      );
    }

    // 🔍 Filter status pelatihan
    if (status) {
      queryBuilder.andWhere("tp.status = :status", { status });
    }

    // 🔍 Filter rentang tanggal
    if (startDate && endDate) {
      queryBuilder.andWhere(
        "training.startDateTraining >= :startDate AND training.endDateTraining <= :endDate",
        { startDate, endDate }
      );
    }

    // 🔢 Pagination
    const dynamicLimit = queryLimit ? parseInt(queryLimit as string, 10) : 10;
    const currentPage = page ? parseInt(page as string, 10) : 1;
    const skip = (currentPage - 1) * dynamicLimit;

    const [participants, totalCount] = await queryBuilder
      .skip(skip)
      .take(dynamicLimit)
      .getManyAndCount();

    // 🧠 Transformasi data
    const safeData = participants.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      company: p.company,
      companyAddress: p.companyAddress,
      jobTitle: p.jobTitle,
      phone: p.phone,
      officePhone: p.officePhone,
      message: p.message,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,

      user: p.user
        ? {
          id: p.user.id,
          userName: p.user.userName,
          role: p.user.role,
          image: p.user.imageAvatar,
        }
        : null,

      trainingParticipant: Array.isArray(p.trainingParticipant)
        ? p.trainingParticipant.map((tp) => ({
          id: tp.id,
          status: tp.status,
          training: tp.training
            ? {
              id: tp.training.id,
              trainingName: tp.training.trainingName,
              price: tp.training.price,
              startDateTraining: tp.training.startDateTraining,
              endDateTraining: tp.training.endDateTraining,
              category:
                tp.training.trainingCategory &&
                  tp.training.trainingCategory.length > 0
                  ? tp.training.trainingCategory.map((tc) => ({
                    id: tc.id,
                    name: tc.category?.categoryName,
                    code: tc.category?.trainingCode,
                  }))
                  : [],
            }
            : null,
        }))
        : [],
    }));

    return res.status(200).send(
      successResponse(
        "Get Participant Success",
        {
          data: safeData,
          totalCount,
          currentPage,
          totalPages: Math.ceil(totalCount / dynamicLimit),
        },
        200
      )
    );
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};



export const getParticipantById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const participantRecord = await participantRepository
      .createQueryBuilder("participant")
      .leftJoinAndSelect("participant.user", "user")
      .leftJoinAndSelect("participant.trainingParticipant", "tp")
      .leftJoinAndSelect("tp.training", "training")
      .leftJoinAndSelect("training.trainingCategory", "trainingCategory")
      .leftJoinAndSelect("trainingCategory.category", "category")
      .where("participant.id = :id", { id })
      .getOne();

    if (!participantRecord) {
      return res.status(404).json({ msg: "Participant not found" });
    }

    // 🧠 Transformasi hasil agar rapi & siap pakai di FE
    const participantDetail = {
      id: participantRecord.id,
      firstName: participantRecord.firstName,
      lastName: participantRecord.lastName,
      email: participantRecord.email,
      company: participantRecord.company,
      companyAddress: participantRecord.companyAddress,
      phone: participantRecord.phone,
      officePhone: participantRecord.officePhone,
      jobTitle: participantRecord.jobTitle,
      message: participantRecord.message,
      createdAt: participantRecord.createdAt,
      updatedAt: participantRecord.updatedAt,

      user: participantRecord.user
        ? {
          id: participantRecord.user.id,
          userName: participantRecord.user.userName,
          role: participantRecord.user.role,
          image: participantRecord.user.imageAvatar,
        }
        : null,

      trainings:
        Array.isArray(participantRecord.trainingParticipant) &&
          participantRecord.trainingParticipant.length > 0
          ? participantRecord.trainingParticipant.map((tp) => ({
            trainingParticipantId: tp.id,
            status: tp.status,
            training: tp.training
              ? {
                id: tp.training.id,
                trainingName: tp.training.trainingName,
                price: tp.training.price,
                startDateTraining: tp.training.startDateTraining,
                endDateTraining: tp.training.endDateTraining,
                createdAt: tp.training.createdAt,
                updatedAt: tp.training.updatedAt,
                category:
                  tp.training.trainingCategory &&
                    tp.training.trainingCategory.length > 0
                    ? tp.training.trainingCategory.map((tc) => ({
                      id: tc.id,
                      name: tc.category?.categoryName,
                      code: tc.category?.trainingCode,
                    }))
                    : [],
              }
              : null,
          }))
          : [],
    };

    return res.status(200).send(
      successResponse(
        "Get Participant by ID Success",
        { data: participantDetail },
        200
      )
    );
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};



export const createParticipant = async (req: Request, res: Response) => {
  // Skema validasi yang fleksibel untuk menangani kedua kasus
  const createParticipantSchema = (input: any) =>
    Joi.object({
      training: Joi.string().required(),
      participants: Joi.array().items(
        Joi.object({
          // Flag wajib untuk membedakan alur
          isExisting: Joi.boolean().required(),

          // Wajib jika isExisting: true
          participantId: Joi.string().when('isExisting', { is: true, then: Joi.required() }),

          // Wajib jika isExisting: false
          email: Joi.string().email().when('isExisting', { is: false, then: Joi.required() }),
          firstName: Joi.string().when('isExisting', { is: false, then: Joi.required() }),
          lastName: Joi.string().when('isExisting', { is: false, then: Joi.required() }),
          user: Joi.string().when('isExisting', { is: false, then: Joi.required() }),
          signatoryName: Joi.string().when('isExisting', { is: false, then: Joi.required() }),
          signatoryPosition: Joi.string().when('isExisting', { is: false, then: Joi.required() }),
          ttdImage: Joi.string().allow("").when('isExisting', { is: false, then: Joi.required() }),

          // Field opsional untuk isExisting: false
          company: Joi.string().optional(),
          companyAddress: Joi.string().optional(),
          phone: Joi.string().optional(),
          jobTitle: Joi.string().optional(),
          officePhone: Joi.string().optional(),
          message: Joi.string().optional(),
        })
      ).min(1).required(),
    }).validate(input);

  try {
    const body = req.body;
    const { error } = createParticipantSchema(body);
    if (error) {
      return res.status(422).send(validationResponse({ error }));
    }

    // Ambil data training satu kali di luar loop
    const trainingRec = await trainingRepository.findOne({
      where: { id: body.training },
      relations: ["trainingCategory", "trainingCategory.category", "trainingCoach"],
    });

    if (!trainingRec) {
      return res.status(404).json({ msg: "Training Not Found" });
    }

    if (!trainingRec.trainingCoach) {
      return res.status(400).json({
        msg: "Training coach is missing — please assign a coach before adding participants.",
      });
    }

    const successfulCreations: any[] = [];
    const failedCreations: any[] = [];

    // Lakukan loop untuk setiap peserta dalam array
    for (const participantData of body.participants) {
      try {
        // --- CASE 1: EXISTING PARTICIPANT ---
        if (participantData.isExisting) {
          const selectedParticipant = await participantRepository.findOne({
            where: { id: participantData.participantId },
            relations: ["user"],
          });

          if (!selectedParticipant) {
            failedCreations.push({ participantId: participantData.participantId, reason: "Participant Not Found" });
            continue;
          }

          if (!selectedParticipant.user) {
            failedCreations.push({ participantId: participantData.participantId, reason: "Associated user not found for this participant" });
            continue;
          }

          const existingRel = await trainingParticipantRepository.findOne({
            where: {
              training: { id: trainingRec.id },
              participant: { id: selectedParticipant.id },
            },
          });

          if (existingRel) {
            failedCreations.push({ participantId: participantData.participantId, reason: "Participant already registered in this training" });
            continue;
          }

          // Proses pembuatan relasi baru
          const newTP = new trainingParticipant();
          newTP.training = trainingRec;
          newTP.participant = selectedParticipant;
          newTP.status = statusTraining.belumMulai;
          newTP.coach = trainingRec.trainingCoach;
          newTP.startDateTraining = trainingRec.startDateTraining;
          newTP.endDateTraining = trainingRec.endDateTraining;

          // Berikan nilai default untuk signatory
          newTP.signatoryName = `${selectedParticipant.firstName} ${selectedParticipant.lastName}`;
          newTP.signatoryPosition = "Peserta";
          newTP.ttdImage = ""; // Kosongkan atau isi dengan URL placeholder
          await trainingParticipantRepository.save(newTP);

          // Buat trainingParticipantCategory
          for (const tc of trainingRec.trainingCategory) {
            const newTPC = new trainingParticipantCategory();
            (newTPC as any).trainingParticipant = [newTP];
            (newTPC as any).category = tc.category;
            await trainingParticipantCategoryRepository.save(newTPC);
          }

          // Buat certificate
          const cert = new certificate();
          cert.trainingParticipant = newTP;
          cert.imageUrl = "";
          cert.noLiscense = "";
          cert.expiredAt = new Date();
          await certificateRepository.save(cert);

          // Kaitkan certificate ke trainingParticipant
          newTP.certificate = cert;
          await trainingParticipantRepository.save(newTP);

          successfulCreations.push({
            participantId: selectedParticipant.id,
            name: `${selectedParticipant.firstName} ${selectedParticipant.lastName}`,
            status: "Added as Existing"
          });

        } else {
          // --- CASE 2: NEW PARTICIPANT ---
          const userRecord = await userRepository.findOneBy({ id: participantData.user });
          if (!userRecord) {
            failedCreations.push({ name: participantData.firstName, reason: "User Not Found" });
            continue;
          }

          const newParticipant = new participant();
          newParticipant.email = participantData.email;
          newParticipant.firstName = participantData.firstName;
          newParticipant.lastName = participantData.lastName;
          newParticipant.company = participantData.company;
          newParticipant.companyAddress = participantData.companyAddress;
          newParticipant.phone = participantData.phone;
          newParticipant.jobTitle = participantData.jobTitle;
          newParticipant.officePhone = participantData.officePhone;
          newParticipant.message = participantData.message;
          newParticipant.user = userRecord;
          await participantRepository.save(newParticipant);

          const newTP = new trainingParticipant();
          newTP.training = trainingRec;
          newTP.participant = newParticipant;
          newTP.status = statusTraining.belumMulai;
          newTP.coach = trainingRec.trainingCoach;
          newTP.signatoryName = participantData.signatoryName;
          newTP.signatoryPosition = participantData.signatoryPosition;
          newTP.ttdImage = participantData.ttdImage;
          newTP.startDateTraining = trainingRec.startDateTraining;
          newTP.endDateTraining = trainingRec.endDateTraining;
          await trainingParticipantRepository.save(newTP);

          // Buat trainingParticipantCategory
          for (const tc of trainingRec.trainingCategory) {
            const newTPC = new trainingParticipantCategory();
            (newTPC as any).trainingParticipant = [newTP];
            (newTPC as any).category = tc.category;
            await trainingParticipantCategoryRepository.save(newTPC);
          }

          // Buat certificate
          const cert = new certificate();
          cert.trainingParticipant = newTP;
          cert.imageUrl = "";
          cert.noLiscense = "";
          cert.expiredAt = new Date();
          await certificateRepository.save(cert);

          // Kaitkan certificate ke trainingParticipant
          newTP.certificate = cert;
          await trainingParticipantRepository.save(newTP);

          successfulCreations.push({
            participantId: newParticipant.id,
            name: `${newParticipant.firstName} ${newParticipant.lastName}`,
            status: "Created as New"
          });
        }
      } catch (loopError: any) {
        failedCreations.push({
          participantId: participantData.participantId || 'N/A',
          name: participantData.firstName || 'N/A',
          reason: loopError.message || 'Unknown error during processing'
        });
      }
    }

    // Kirim response berupa rangkuman hasil
    return res.status(201).send(
      successResponse(
        `Process complete. Success: ${successfulCreations.length}, Failed: ${failedCreations.length}`,
        {
          success: successfulCreations,
          failures: failedCreations,
        },
        201
      )
    );

  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Unknown error occurred",
    });
  }
};



export const updateParticipant = async (req: Request, res: Response) => {
  // ✅ Disesuaikan: Skema validasi diperbarui untuk menerima field baru
  const updateParticipantSchema = (input: any) =>
    Joi.object({
      id: Joi.string().required(), // participant id
      training: Joi.string().required(), // training id
      email: Joi.string().email().optional(),
      firstName: Joi.string().optional(),
      lastName: Joi.string().optional(),
      company: Joi.string().optional(),
      companyAddress: Joi.string().optional(),
      phone: Joi.string().optional(),
      jobTitle: Joi.string().optional(),
      officePhone: Joi.string().optional(),
      message: Joi.string().optional(),
      status: Joi.string().valid("belumMulai", "sedangBerlangsung", "selesai", "tidakSelesai").optional(),
      // Field baru ditambahkan sebagai opsional
      signatoryName: Joi.string().optional(),
      signatoryPosition: Joi.string().optional(),
      ttdImage: Joi.string().allow("").optional(),
    }).validate(input);

  try {
    const body = req.body;
    const schema = updateParticipantSchema(body);
    if ("error" in schema) {
      return res.status(422).send(validationResponse(schema));
    }

    // 🔹 Ambil participant (tidak ada perubahan)
    const participantRec = await participantRepository.findOne({
      where: { id: body.id },
      relations: ["user"],
    });

    if (!participantRec) {
      return res.status(404).json({ msg: "Participant Not Found" });
    }

    // 🔹 Ambil training (tidak ada perubahan)
    const trainingRec = await trainingRepository.findOne({
      where: { id: body.training },
    });

    if (!trainingRec) {
      return res.status(404).json({ msg: "Training Not Found" });
    }

    // 🔹 Update info participant (tidak ada perubahan)
    participantRec.email = body.email ?? participantRec.email;
    participantRec.firstName = body.firstName ?? participantRec.firstName;
    participantRec.lastName = body.lastName ?? participantRec.lastName;
    participantRec.company = body.company ?? participantRec.company;
    participantRec.companyAddress = body.companyAddress ?? participantRec.companyAddress;
    participantRec.phone = body.phone ?? participantRec.phone;
    participantRec.jobTitle = body.jobTitle ?? participantRec.jobTitle;
    participantRec.officePhone = body.officePhone ?? participantRec.officePhone;
    participantRec.message = body.message ?? participantRec.message;

    await participantRepository.save(participantRec);

    // 🔹 Ambil relasi trainingParticipant (tidak ada perubahan)
    const participantTraining = await trainingParticipantRepository.findOne({
      where: {
        training: { id: trainingRec.id },
        participant: { id: participantRec.id },
      },
    });

    // Jika relasi tidak ditemukan, berarti ada data yang tidak konsisten
    if (!participantTraining) {
      return res.status(404).json({ msg: "Participant is not registered in this specific training." });
    }

    // ✅ Disesuaikan: Update status dan informasi penanda tangan di relasi trainingParticipant
    participantTraining.status = body.status ?? participantTraining.status;
    participantTraining.signatoryName = body.signatoryName ?? participantTraining.signatoryName;
    participantTraining.signatoryPosition = body.signatoryPosition ?? participantTraining.signatoryPosition;
    participantTraining.ttdImage = body.ttdImage ?? participantTraining.ttdImage;

    await trainingParticipantRepository.save(participantTraining);


    return res.status(200).send(
      successResponse(
        "Participant updated successfully",
        {
          participant: participantRec,
          participantTraining,
        },
        200
      )
    );
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};


export const deleteParticipant = async (req: Request, res: Response) => {
  try {
    const { trainingId, participantId } = req.params;

    if (!trainingId || !participantId) {
      return res.status(400).json({ msg: "trainingId and participantId are required" });
    }

    // Cek apakah relasi trainingParticipant-nya ada
    const trainingParticipantRec = await trainingParticipantRepository.findOne({
      where: {
        training: { id: trainingId },
        participant: { id: participantId },
      },
      relations: [
        "certificate",
        "trainingParticipantCategory",
        "participant",
        "training",
      ],
      withDeleted: false, // hanya ambil yang belum dihapus
    });

    if (!trainingParticipantRec) {
      return res.status(404).json({ msg: "Participant is not registered in this training" });
    }

    // Soft delete certificate jika ada
    if (trainingParticipantRec.certificate) {
      await certificateRepository.softRemove(trainingParticipantRec.certificate);
    }

    // Soft delete kategori jika ada
    if (trainingParticipantRec.trainingParticipantCategory) {
      await trainingParticipantCategoryRepository.softRemove(
        trainingParticipantRec.trainingParticipantCategory
      );
    }

    // Soft delete relasi utama trainingParticipant
    await trainingParticipantRepository.softRemove(trainingParticipantRec);

    return res.status(200).send(
      successResponse(
        "Participant soft-deleted from this training successfully",
        {
          trainingId,
          participantId,
          deletedAt: new Date().toISOString(),
        },
        200
      )
    );
  } catch (error: any) {
    console.error("Error soft deleting participant:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};




export const changeStatusParticipant = async (req: Request, res: Response) => {
  const changeStatusSchema = (input: any) =>
    Joi.object({
      status: Joi.string()
        .valid(...Object.values(statusTraining))
        .required(),
      trainingId: Joi.string().required(), // training wajib supaya tahu status mana yang diubah
    }).validate(input);

  try {
    const { id } = req.params; // participantId
    const body = req.body;
    const schema = changeStatusSchema(body);

    if ("error" in schema) {
      return res.status(422).send(validationResponse(schema));
    }

    // 🔍 Cek apakah training ada
    const trainingRecord = await trainingRepository.findOneBy({ id: body.trainingId });
    if (!trainingRecord) {
      return res.status(404).json({ msg: "Training Not Found" });
    }

    // 🔍 Cek apakah participant terdaftar di training ini
    const participantTraining = await trainingParticipantRepository.findOne({
      where: {
        participant: { id },
        training: { id: body.trainingId },
      },
      relations: ["participant", "training"],
    });

    if (!participantTraining) {
      return res.status(404).json({
        msg: "Participant not registered for this training",
      });
    }

    // ✅ Update status peserta
    participantTraining.status = body.status as statusTraining;
    await trainingParticipantRepository.save(participantTraining);

    return res.status(200).send(
      successResponse(
        "Participant training status updated successfully",
        {
          participantId: id,
          trainingId: body.trainingId,
          newStatus: participantTraining.status,
        },
        200
      )
    );
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};


export const restoreParticipant = async (req: Request, res: Response) => {
  // 1. Gunakan transaksi untuk keamanan data
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 2. Ambil kedua ID dari parameter
    const { trainingId, participantId } = req.params;

    if (!trainingId || !participantId) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ msg: "trainingId and participantId are required" });
    }

    // 3. Cari relasi 'trainingParticipant' yang spesifik, TERMASUK yang sudah di-soft delete
    const trainingParticipantRec = await queryRunner.manager.findOne(trainingParticipant, {
      where: {
        training: { id: trainingId },
        participant: { id: participantId },
      },
      relations: [
        "certificate",
        "trainingParticipantCategory",
      ],
      withDeleted: true, // SANGAT PENTING: untuk menemukan data yang sudah di-soft delete
    });

    if (!trainingParticipantRec) {
      await queryRunner.rollbackTransaction();
      return res.status(404).json({ msg: "Archived participant record not found for this training." });
    }

    if (trainingParticipantRec.deletedAt === null) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ msg: "Participant is already active in this training." });
    }

    // 4. Pulihkan (restore) relasi anak terlebih dahulu
    if (trainingParticipantRec.certificate) {
      await queryRunner.manager.restore(certificate, { id: trainingParticipantRec.certificate.id });
    }

    // ✅ DIUBAH: Perlakukan sebagai objek tunggal
    if (trainingParticipantRec.trainingParticipantCategory) {
      // Ambil ID dari objek tunggal tersebut
      const categoryId = trainingParticipantRec.trainingParticipantCategory.id;

      // Restore entri tunggal tersebut
      await queryRunner.manager.restore(trainingParticipantCategory, { id: categoryId });
    }

    // 5. Pulihkan (restore) relasi induk 'trainingParticipant'
    await queryRunner.manager.restore(trainingParticipant, { id: trainingParticipantRec.id });

    // 6. Commit transaksi
    await queryRunner.commitTransaction();

    return res.status(200).send(
      successResponse(
        "Participant restored to this training successfully",
        { restoredRelationId: trainingParticipantRec.id },
        200
      )
    );

  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    console.error("Error restoring participant:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  } finally {
    await queryRunner.release();
  }
};


