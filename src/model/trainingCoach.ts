import { IsDate, IsNumber, IsOptional, IsString } from "class-validator"
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"

import { training } from "./training"

@Entity()
export class trainingCoach {
  @PrimaryGeneratedColumn("uuid")
  public id: string

  @Column({
    default: null,
    nullable: false,
  })
  @IsString()
  public coachName: string

  @CreateDateColumn()
  public createdAt: Date

  @UpdateDateColumn()
  public updatedAt: Date

  @DeleteDateColumn()
  public deletedAt: Date

  @OneToMany(() => training, (training) => training.trainingCoach)
  public training: training
}
