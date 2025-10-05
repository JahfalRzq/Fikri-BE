import bcrypt from "bcryptjs"
import { IsOptional, IsString, IsUppercase } from "class-validator"
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"

import { participant } from "./participant"

export enum UserRole {
  ADMIN = "ADMIN",
  PARTICIPANT = "PARTICIPANT",
}

@Entity()
export class user {
  @PrimaryGeneratedColumn("uuid")
  public id: string

  @Column()
  @IsString()
  public userName: string

  @Column()
  @IsString()
  @IsOptional()
  public password: string

  @Column({
    type: "enum",
    enum: UserRole,
  })
  @IsString()
  @IsUppercase()
  public role: UserRole

  @Column({
    default: null,
    nullable: true,
  })
  @IsString()
  public image: string

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

  @OneToMany(() => participant, (participantId) => participantId.user)
  public participantId: participant
}
