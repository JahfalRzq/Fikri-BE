import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { user } from "./user";
import { trainingParticipant } from "./training-participant";

@Entity()
export class participant {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  company: string;

  @Column()
  companyAddress: string;

  @Column({ nullable: true })
  phone: string;

  @Column()
  jobTitle: string;

  @Column()
  officePhone: string;

  @Column()
  message: string;

  @ManyToOne(() => user, (u) => u.participants)
  @JoinColumn()
  user: user;

  @OneToMany(() => trainingParticipant, (tp) => tp.participant)
  trainingParticipant: trainingParticipant[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
