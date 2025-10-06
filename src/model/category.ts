import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from "typeorm";
import { trainingCategory } from "./training-category";
import { trainingParticipantCategory } from "./training-participant-category";

@Entity()
export class category {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  categoryName: string;

  @Column()
  trainingCode: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => trainingCategory, (tc) => tc.category)
  trainingCategory: trainingCategory[];

  @OneToMany(() => trainingParticipantCategory, (tpc) => tpc.category)
  trainingParticipantCategory: trainingParticipantCategory[];
}
