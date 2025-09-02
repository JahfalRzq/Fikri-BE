import { IsOptional, IsString,IsUppercase } from "class-validator";
import { Entity,PrimaryGeneratedColumn,Column,CreateDateColumn,UpdateDateColumn,DeleteDateColumn, OneToMany } from "typeorm";
import bcrypt from 'bcryptjs';



export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER',
}

@Entity()
export class user {

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
        enum: UserRole,
    })
    @IsString()
    @IsUppercase()
    public role: UserRole

    
    @CreateDateColumn()
    public createdAt: Date

    @UpdateDateColumn()
    public updatedAt: Date

    @DeleteDateColumn()
    public deletedAt: Date
    

    public hashPassword() {
    this.password = bcrypt.hashSync(this.password, 8)
    }

    public checkIfPasswordMatch(unencryptedPassword: string): boolean {
        return bcrypt.compareSync(unencryptedPassword, this.password)
    }



}