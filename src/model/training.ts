import { IsDate, isDate, IsOptional, IsString,IsUppercase } from "class-validator";
import { Entity,PrimaryGeneratedColumn,Column,CreateDateColumn,UpdateDateColumn,DeleteDateColumn, OneToMany } from "typeorm";
import { participant } from "./participant";


@Entity()
export class training {

    @PrimaryGeneratedColumn('uuid')
    public id: string

    
    @Column({
    default: null,
    nullable: false
    })
    @IsString()
    public trainingName: string

    @Column({
    default: null,
    nullable: false
    })
    @IsString()
    @IsOptional()
    public category: string

    @Column({
    default: null,
    nullable: false
    })
    @IsString()
    @IsOptional()
    public trainingCode: string

    @Column({
    default: null,
    nullable: false
    })
    @IsString()
    public coach: string

    @Column({
    default: null,
    nullable: false
    })
    @IsString()
    public price: string

    @Column({
    default: null,
    nullable: false
    })
    @IsDate()
    public startDateTraining: Date

    @Column({
    default: null,
    nullable: false
    })
    @IsDate()
    public endDateTraining: Date

    
    @CreateDateColumn()
    public createdAt: Date

    @UpdateDateColumn()
    public updatedAt: Date

    @DeleteDateColumn()
    public deletedAt: Date


    
    @OneToMany (() => participant, (participant) => participant.training)
    public participant: participant[];
    

}