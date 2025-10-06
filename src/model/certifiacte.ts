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
import { trainingParticipant } from "./training-participant";

@Entity()
export class certificate {
    @PrimaryGeneratedColumn("uuid")
    public id: string;

    @Column({
        default: null,
        nullable: true,
    })
    @IsString()
    public trainingParticipantName: string


    @Column({
        default: null,
        nullable: true,
    })
    @IsString()
    public trainingName: string

    @Column({
        default: null,
        nullable: false,
    })
    @IsString()
    public coachName: string;

    @Column({
        default: null,
        nullable: true,
    })
    @IsString()
    public imageUrl: string

    @Column({
        default: null,
        nullable: true,
    })
    @IsString()
    public noLicense: string

    @CreateDateColumn()
    public createdAt: Date;

    @UpdateDateColumn()
    public updatedAt: Date;

    @DeleteDateColumn()
    public deletedAt: Date;

    @OneToMany(() => trainingParticipant, (trainingParticipant) => trainingParticipant.certificate)
    public trainingParticipant: trainingParticipant;



}
