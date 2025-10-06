import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { trainingCategory } from "./training-category";
import { coach } from "./coach";
import { trainingParticipant } from "./training-participant";

@Entity()
export class training {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  trainingName: string;

  @Column()
  category: string;

  @Column()
  price: number;

  @Column()
  startDateTraining: Date;

  @Column()
  endDateTraining: Date;

  @Column()
  ttdImage: string;

  @Column()
  signatoryPosition: string;

  @Column()
  signatoryName: string;

  @ManyToOne(() => coach, (c) => c.training)
  @JoinColumn()
  trainingCoach: coach;

  @OneToMany(() => trainingParticipant, (tp) => tp.training)
  trainingParticipant: trainingParticipant[];

  @OneToMany(() => trainingCategory, (ct) => ct.training)
  trainingCategory: trainingCategory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
