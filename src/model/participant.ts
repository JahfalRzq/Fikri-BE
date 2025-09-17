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

export enum statusTraining {
  selesai = "selesai",
  sedangBerlangsung = "sedangBerlangsung",
  tidakSelesai = "tidakSelesai",
  belumMulai = "belumMulai",
}

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

  @Column({
    type: "enum",
    enum: statusTraining,
  })
  @IsString()
  @IsUppercase()
  public status: statusTraining;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  @DeleteDateColumn()
  public deletedAt: Date;

  @OneToMany(() => user, (user) => user.participantId)
  public user: user[];

  @ManyToOne(() => training, (training) => training.participant)
  @JoinColumn()
  public training: training;
}
