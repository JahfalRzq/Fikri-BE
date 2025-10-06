import { IsDate, IsNumber, IsOptional, IsString } from "class-validator";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from "typeorm";
import { training } from "./training";
import { trainingCategory } from "./training-category";
import { trainingParticipantCategory } from "./training-participant-category";

@Entity()
export class category {
  @PrimaryGeneratedColumn("uuid")
  public id: string;

  @Column({
    default: null,
    nullable: false,
  })
  @IsString()
  public categoryName: string;

    @Column({
    default: null,
    nullable: false,
  })
  @IsString()
  public trainingCode: string;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  @DeleteDateColumn()
  public deletedAt: Date;

  @OneToMany(() => trainingCategory, (trainingCategory) => trainingCategory.category)
  public trainingCategory: trainingCategory

  @OneToMany(() => trainingParticipantCategory, (trainingParticipantCategory) => trainingParticipantCategory.category)
  public trainingParticipantCategory: trainingParticipantCategory


}
