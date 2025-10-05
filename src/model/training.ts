
import { IsDate, IsNumber, IsOptional, IsString } from "class-validator";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { categoryTraining } from "./category-training";
import { trainingCoach } from "./training-coach";
import { trainingParticipant } from "./training-participant";

@Entity()
export class training {
  @PrimaryGeneratedColumn("uuid")
  public id: string;

  @Column({
    default: null,
    nullable: false,
  })
  @IsString()
  public trainingName: string;

  @Column({
    default: null,
    nullable: false,
  })
  @IsString()
  @IsOptional()
  public category: string;
  @Column({
    default: null,
    nullable: false,
  })
  @IsNumber()
  public price: number;

  @Column({
    default: null,
    nullable: false,
  })
  @IsDate()
  public startDateTraining: Date;

  @Column({
    default: null,
    nullable: false,
  })
  @IsDate()
  public endDateTraining: Date;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  @DeleteDateColumn()
  public deletedAt: Date;

  @ManyToOne(() => categoryTraining, (categoryTraining) => categoryTraining.training)
  @JoinColumn()
  public categoryTraining: categoryTraining;

  @ManyToOne(() => trainingCoach, (trainingCoach) => trainingCoach.training)
  @JoinColumn()
  public trainingCoach: trainingCoach;

   @OneToMany(() => trainingParticipant, (trainingParticipant) => trainingParticipant.training)
  public trainingParticipant: trainingParticipant;

}
