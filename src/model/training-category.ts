import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { category } from "./category";
import { training } from "./training";

@Entity()
export class trainingCategory {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @ManyToOne(() => category, (c) => c.trainingCategory)
  @JoinColumn()
  category: category;

  @ManyToOne(() => training, (t) => t.trainingCategory)
  @JoinColumn()
  training: training;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
