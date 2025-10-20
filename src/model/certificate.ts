import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,UpdateDateColumn,DeleteDateColumn } from "typeorm";
import { trainingParticipant } from "./training-participant";

@Entity()
export class certificate {
  @PrimaryGeneratedColumn("uuid")
  id: number;

  @Column()
  imageUrl: string;

  @Column()
  noLiscense: string;

  @Column()
  expiredAt: Date;

  @ManyToOne(() => trainingParticipant, (tp) => tp.certificate)
  @JoinColumn()
  trainingParticipant: trainingParticipant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
