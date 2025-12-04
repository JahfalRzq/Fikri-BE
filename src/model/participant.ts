import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { user } from "./user";
import { trainingParticipant } from "./training-participant";

@Entity()
export class participant {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    nullable: true,
    default: null
  })
  email: string;

  @Column({
    nullable: true,
    default: null
  })
  firstName: string;

  @Column({
    nullable: true,
    default: null
  })
  lastName: string;

  @Column({
    nullable: true,
    default: null
  })
  company: string;

  @Column({
    nullable: true,
    default: null
  })
  companyAddress: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    nullable: true,
    default: null
  })
  jobTitle: string;

  @Column({
    nullable: true,
    default: null
  })
  officePhone: string;

  @Column({
    nullable: true,
    default: null
  })
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
