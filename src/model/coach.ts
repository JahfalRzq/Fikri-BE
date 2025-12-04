import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from "typeorm";
import { training } from "./training";
import { trainingParticipant } from "./training-participant";

@Entity()
export class coach {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  coachName: string;  

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => training, (t) => t.trainingCoach)
  training: training[];

  @OneToMany(() => trainingParticipant, (tp) => tp.coach)
  trainingParticipant: trainingParticipant[];
}
