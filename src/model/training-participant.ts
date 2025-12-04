import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { participant } from "./participant";
import { training } from "./training";
import { coach } from "./coach";
import { certificate } from "./certificate";
import { trainingParticipantCategory } from "./training-participant-category";

export enum statusTraining {
  selesai = "selesai",
  sedangBerlangsung = "sedangBerlangsung",
  tidakSelesai = "tidakSelesai",
  belumMulai = "belumMulai",
}

@Entity()
export class trainingParticipant {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: statusTraining })
  status: statusTraining;

  @Column()
  ttdImage: string;

  @Column()
  signatoryPosition: string;

  @Column()
  signatoryName: string;

  @Column()
  startDateTraining: Date;

  @Column()
  endDateTraining: Date;

@Column({ nullable: true, default: null })
  penanggung_jawab_peserta: string;

  @Column({ nullable: true, default: null })
  ruangan: string;

  @Column({ nullable: true, default: null })
  keterangan: string;

  @Column({ nullable: true, default: null })
  non_wt: string;

  @Column({ nullable: true, default: null })
  pic: string;

  @Column({ nullable: true, default: null })
  alamat_pengiriman: string;

  @Column({ nullable: true, default: null })
  joinan_atau_tidak: string;

  @Column({ nullable: true, default: null })
  nama_pendaftaran: boolean;

  @Column({ nullable: true, default: null })
  absensi: boolean;

  @Column({ nullable: true, default: null })
  nametag: boolean;

  @Column({ nullable: true, default: null })
  cover: boolean;

  @Column({ nullable: true, default: null })
  terima: boolean;

  @Column({ nullable: true, default: null })
  invoice: boolean;

  @Column({ nullable: true, default: null })
  pajak: boolean;

  @ManyToOne(() => participant, (p) => p.trainingParticipant)
  @JoinColumn()
  participant: participant;

  @ManyToOne(() => training, (t) => t.trainingParticipant)
  @JoinColumn()
  training: training;

  @ManyToOne(() => coach, (c) => c.trainingParticipant)
  @JoinColumn()
  coach: coach;

  @ManyToOne(() => certificate, (cert) => cert.trainingParticipant)
  @JoinColumn()
  certificate: certificate;

  @ManyToOne(() => trainingParticipantCategory, (tpc) => tpc.trainingParticipant)
  @JoinColumn()
  trainingParticipantCategory: trainingParticipantCategory;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
