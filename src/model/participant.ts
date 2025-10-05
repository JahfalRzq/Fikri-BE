import { IsOptional, IsString, IsUppercase } from "class-validator";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { user } from "./user";
import { training } from "./training";
import { trainingParticipant } from "./training-participant";


@Entity()
export class participant {
  @PrimaryGeneratedColumn("uuid")
  public id: string;

  @Column({
    default: null,
    nullable: false,
  })
  @IsString()
  public email: string;

  @Column({
    default: null,
    nullable: false,
  })
  @IsString()
  public firstName: string;

  @Column({
    default: null,
    nullable: false,
  })
  @IsString()
  public lastName: string;

  @Column({
    default: null,
    nullable: false,
  })
  @IsString()
  public company: string;

  @Column({
    default: null,
    nullable: false,
  })
  @IsString()
  public companyAddress: string;

  @Column({
    default: null,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  public phone: string;

  @Column({
    default: null,
    nullable: false,
  })
  @IsString()
  public jobTitle: string;

  @Column({
    default: null,
    nullable: false,
  })
  @IsString()
  public officePhone: string;

  @Column({
    default: null,
    nullable: false,
  })
  @IsString()
  public message: string;



  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  @DeleteDateColumn()
  public deletedAt: Date;

  @ManyToOne(() => user, (user) => user.participantId)
  @JoinColumn()
  public user: user;

  @OneToMany(() => trainingParticipant, (trainingParticipant) => trainingParticipant.participant)
  public trainingParticipant: trainingParticipant;
}
