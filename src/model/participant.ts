import { IsOptional, IsString, IsUppercase } from "class-validator"
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"

import { trainingParticipant } from "./training-participant"
import { user } from "./user"

@Entity()
export class participant {
  @PrimaryGeneratedColumn("uuid")
  public id: string

  @Column({
    default: null,
    nullable: false,
  })
  @IsString()
  public email: string

  @Column({
    default: null,
    nullable: false,
  })
  @IsString()
  public firstName: string

  @Column({
    default: null,
    nullable: false,
  })
  @IsString()
  public lastName: string

  @Column({
    default: null,
    nullable: false,
  })
  @IsString()
  public company: string

  @Column({
    default: null,
    nullable: false,
  })
  @IsString()
  public companyAddress: string

  @Column({
    default: null,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  public phone: string

  @Column({
    default: null,
    nullable: false,
  })
  @IsString()
  public jobTitle: string

  @Column({
    default: null,
    nullable: false,
  })
  @IsString()
  public officePhone: string

  @Column({
    default: null,
    nullable: false,
  })
  @IsString()
  public message: string

  @CreateDateColumn()
  public createdAt: Date

  @UpdateDateColumn()
  public updatedAt: Date

  @DeleteDateColumn()
  public deletedAt: Date

  @ManyToOne(() => user, (user) => user.participantId)
  @JoinColumn()
  public user: user

  @OneToMany(
    () => trainingParticipant,
    (trainingParticipant) => trainingParticipant.participant,
  )
  public trainingParticipant: trainingParticipant
}
