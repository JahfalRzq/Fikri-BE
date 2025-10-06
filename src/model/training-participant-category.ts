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
export class trainingParticipantCategory {
    @PrimaryGeneratedColumn("uuid")
    public id: string;

    @CreateDateColumn()
    public createdAt: Date;

    @UpdateDateColumn()
    public updatedAt: Date;

    @DeleteDateColumn()
    public deletedAt: Date;

    @ManyToOne(() => category, (category) => category.trainingParticipantCategory)
    @JoinColumn()
    public category: category

    @ManyToOne(() => training, (training) => training.trainingParticipantCategory)
    @JoinColumn()
    public training: training

}