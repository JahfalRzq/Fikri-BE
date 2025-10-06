import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { category } from "./category";
import { trainingParticipant } from "./training-participant";

@Entity()
export class trainingParticipantCategory {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @ManyToOne(() => category, (c) => c.trainingParticipantCategory)
  @JoinColumn()
  category: category;

  @OneToMany(() => trainingParticipant, (tp) => tp.trainingParticipantCategory)
  trainingParticipant: trainingParticipant[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
