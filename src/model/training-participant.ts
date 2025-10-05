import { IsDate, IsNumber, IsOptional, IsString, IsUppercase } from "class-validator";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    JoinColumn,
    ManyToOne,
} from "typeorm";
import { participant } from "./participant";
import { training } from "./training";
export enum statusTraining {
  selesai = "selesai",
  sedangBerlangsung = "sedangBerlangsung",
  tidakSelesai = "tidakSelesai",
  belumMulai = "belumMulai",
}




@Entity()
export class trainingParticipant {
    @PrimaryGeneratedColumn("uuid")
    public id: string;

  @Column({
    type: "enum",
    enum: statusTraining,
  })
  @IsString()
  @IsUppercase()
  public status: statusTraining;


    @ManyToOne(() => training, (training) => training.trainingParticipant)
    @JoinColumn()
    public training: training;

    @ManyToOne(() => participant, (participantList) => participantList.trainingParticipant)
    @JoinColumn()
    public participant: participant;


    @CreateDateColumn()
    public createdAt: Date;

    @UpdateDateColumn()
    public updatedAt: Date;

    @DeleteDateColumn()
    public deletedAt: Date;



}