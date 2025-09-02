import { IsOptional, IsString,IsUppercase } from "class-validator";
import { Entity,PrimaryGeneratedColumn,Column,CreateDateColumn,UpdateDateColumn,DeleteDateColumn, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { user } from "./user";
import { training } from "./training";

export enum statusTraining{
    selesai = 'selesai',
    sedangBerlangsung = 'sedangBerlangsung',
    tidakSelesai = 'tidakSelesai',
    belumMulai = 'belumMulai',

}

@Entity()
export class participant {

    @PrimaryGeneratedColumn('uuid')
    public id: string

    
    @Column()
    @IsString()
    public userName: string

    @Column({
    default: null,
    nullable: false
    })
    @IsString()
    @IsOptional()
    public phone: string

    @Column()
    @IsString()
    @IsOptional()
    public password: string

    @Column()
    @IsString()
    public email: string

    
    @Column({
        type: 'enum',
        enum: statusTraining,
    })
    @IsString()
    @IsUppercase()
    public role: statusTraining

    
    @CreateDateColumn()
    public createdAt: Date

    @UpdateDateColumn()
    public updatedAt: Date

    @DeleteDateColumn()
    public deletedAt: Date

    @ManyToOne (() => user, (user) => user.participant)
    @JoinColumn()
    public user : user

    @ManyToOne (() => training, (training) => training.participant)
    @JoinColumn()
    public training : training

}