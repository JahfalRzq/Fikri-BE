import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from "typeorm";
import { participant } from "./participant";
import bcrypt from 'bcryptjs';


export enum UserRole {
  ADMIN = "ADMIN",
  PARTICIPANT = "PARTICIPANT",
}

@Entity()
export class user {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userName: string;

  @Column()
  password: string;

  @Column({ type: "enum", enum: UserRole })
  role: UserRole;

  @Column({ nullable: true })
  imageAvatar: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => participant, (p) => p.user)
  participants: participant[];


  public hashPassword() {
    this.password = bcrypt.hashSync(this.password, 8)
  }

  public checkIfPasswordMatch(unencryptedPassword: string): boolean {
    return bcrypt.compareSync(unencryptedPassword, this.password)
  }
}
