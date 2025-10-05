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

@Entity()
export class categoryTraining {
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
  @IsOptional()
  public trainingCode: string;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  @DeleteDateColumn()
  public deletedAt: Date;

  @OneToMany(() => training, (training) => training.categoryTraining)
  public training: training;


}
