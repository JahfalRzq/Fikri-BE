import { IsOptional, IsString, IsUppercase } from "class-validator";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import bcrypt from "bcryptjs";
import { participant } from "./participant";

export enum UserRole {
  ADMIN = "ADMIN",
  PARTICIPANT = "PARTICIPANT",
}

@Entity()
export class user {
  @PrimaryGeneratedColumn("uuid")
  public id: string;

  @Column()
  @IsString()
  public userName: string;

  @Column({
    default: null,
    nullable: false,
  })
  @IsString()
  @IsOptional()
  public phone: string;

  @Column()
  @IsString()
  @IsOptional()
  public password: string;

  @Column()
  @IsString()
  public email: string;

  @Column({
    type: "enum",
    enum: UserRole,
  })
  @IsString()
  @IsUppercase()
  public role: UserRole;

  @Column({
    default: null,
    nullable: true,
  })
  @IsString()
  public image: string;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  @DeleteDateColumn()
  public deletedAt: Date;

  public hashPassword() {
    this.password = bcrypt.hashSync(this.password, 8);
  }

  public checkIfPasswordMatch(unencryptedPassword: string): boolean {
    console.log("BALALALAAA", { password: this.password, unencryptedPassword, compare: bcrypt.compareSync(unencryptedPassword, this.password), newEncrypted: bcrypt.hashSync(unencryptedPassword, 8) });

    return bcrypt.compareSync(unencryptedPassword, this.password);
  }

  @ManyToOne(() => participant, (participantId) => participantId.user)
  @JoinColumn({ name: "participant_id" })
  public participantId: participant;
}
