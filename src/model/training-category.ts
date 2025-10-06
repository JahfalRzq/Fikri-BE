import { IsDate, IsNumber, IsOptional, IsString } from "class-validator";
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
import { training } from "./training";
import { category } from "./category";

@Entity()
export class trainingCategory {
  @PrimaryGeneratedColumn("uuid")
  public id: string;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  @DeleteDateColumn()
  public deletedAt: Date;

  @ManyToOne(() => category, (category) => category.trainingCategory)
  @JoinColumn()
  public category: category

  @ManyToOne(() => training, (training) => training.trainingCategory)
  @JoinColumn()
  public training: training

}