import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTrainingSystemSchema1759787087981 implements MigrationInterface {
    name = 'CreateTrainingSystemSchema1759787087981'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`coach\` CHANGE \`coachName\` \`expiredTime\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`coach\` DROP COLUMN \`expiredTime\``);
        await queryRunner.query(`ALTER TABLE \`coach\` ADD \`coachName\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`coach\` ADD \`expiredTime\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`training_participant_category\` DROP FOREIGN KEY \`FK_2aaf52cf931474f3e396fc20a05\``);
        await queryRunner.query(`ALTER TABLE \`training_participant_category\` CHANGE \`categoryId\` \`categoryId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`category\` CHANGE \`deletedAt\` \`deletedAt\` datetime(6) NULL`);
        await queryRunner.query(`ALTER TABLE \`training_category\` DROP FOREIGN KEY \`FK_927b6c1094f25ff37a54f77a4e5\``);
        await queryRunner.query(`ALTER TABLE \`training_category\` DROP FOREIGN KEY \`FK_46ad7fff718b601d4f2958108b6\``);
        await queryRunner.query(`ALTER TABLE \`training_category\` CHANGE \`categoryId\` \`categoryId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`training_category\` CHANGE \`trainingId\` \`trainingId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`coach\` CHANGE \`deletedAt\` \`deletedAt\` datetime(6) NULL`);
        await queryRunner.query(`ALTER TABLE \`training\` DROP FOREIGN KEY \`FK_d8a8d0d38b80b555db80645c081\``);
        await queryRunner.query(`ALTER TABLE \`training\` CHANGE \`deletedAt\` \`deletedAt\` datetime(6) NULL`);
        await queryRunner.query(`ALTER TABLE \`training\` CHANGE \`trainingCoachId\` \`trainingCoachId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`certificate\` DROP FOREIGN KEY \`FK_5f12725ed5ff2260869e2ce647a\``);
        await queryRunner.query(`ALTER TABLE \`certificate\` CHANGE \`trainingParticipantId\` \`trainingParticipantId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` DROP FOREIGN KEY \`FK_8cc3fa76c27243cd6511e1f48dc\``);
        await queryRunner.query(`ALTER TABLE \`training_participant\` DROP FOREIGN KEY \`FK_82d9d70a356389bfe495ba90e4a\``);
        await queryRunner.query(`ALTER TABLE \`training_participant\` DROP FOREIGN KEY \`FK_94fb95b864228ff45bdb3b90d07\``);
        await queryRunner.query(`ALTER TABLE \`training_participant\` DROP FOREIGN KEY \`FK_88c8ef2b7370828a396362e5cce\``);
        await queryRunner.query(`ALTER TABLE \`training_participant\` DROP FOREIGN KEY \`FK_150f6a67bc99deb25322dc4eebd\``);
        await queryRunner.query(`ALTER TABLE \`training_participant\` CHANGE \`deletedAt\` \`deletedAt\` datetime(6) NULL`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` CHANGE \`participantId\` \`participantId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` CHANGE \`trainingId\` \`trainingId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` CHANGE \`coachId\` \`coachId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` CHANGE \`certificateId\` \`certificateId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` CHANGE \`trainingParticipantCategoryId\` \`trainingParticipantCategoryId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`participant\` DROP FOREIGN KEY \`FK_b915e97dea27ffd1e40c8003b3b\``);
        await queryRunner.query(`ALTER TABLE \`participant\` CHANGE \`phone\` \`phone\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`participant\` CHANGE \`deletedAt\` \`deletedAt\` datetime(6) NULL`);
        await queryRunner.query(`ALTER TABLE \`participant\` CHANGE \`userId\` \`userId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`imageAvatar\` \`imageAvatar\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`deletedAt\` \`deletedAt\` datetime(6) NULL`);
        await queryRunner.query(`ALTER TABLE \`coach\` CHANGE \`deletedAt\` \`deletedAt\` datetime(6) NULL`);
        await queryRunner.query(`ALTER TABLE \`training_participant_category\` ADD CONSTRAINT \`FK_2aaf52cf931474f3e396fc20a05\` FOREIGN KEY (\`categoryId\`) REFERENCES \`category\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training_category\` ADD CONSTRAINT \`FK_927b6c1094f25ff37a54f77a4e5\` FOREIGN KEY (\`categoryId\`) REFERENCES \`category\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training_category\` ADD CONSTRAINT \`FK_46ad7fff718b601d4f2958108b6\` FOREIGN KEY (\`trainingId\`) REFERENCES \`training\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training\` ADD CONSTRAINT \`FK_d8a8d0d38b80b555db80645c081\` FOREIGN KEY (\`trainingCoachId\`) REFERENCES \`coach\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`certificate\` ADD CONSTRAINT \`FK_5f12725ed5ff2260869e2ce647a\` FOREIGN KEY (\`trainingParticipantId\`) REFERENCES \`training_participant\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` ADD CONSTRAINT \`FK_8cc3fa76c27243cd6511e1f48dc\` FOREIGN KEY (\`participantId\`) REFERENCES \`participant\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` ADD CONSTRAINT \`FK_82d9d70a356389bfe495ba90e4a\` FOREIGN KEY (\`trainingId\`) REFERENCES \`training\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` ADD CONSTRAINT \`FK_94fb95b864228ff45bdb3b90d07\` FOREIGN KEY (\`coachId\`) REFERENCES \`coach\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` ADD CONSTRAINT \`FK_88c8ef2b7370828a396362e5cce\` FOREIGN KEY (\`certificateId\`) REFERENCES \`certificate\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` ADD CONSTRAINT \`FK_150f6a67bc99deb25322dc4eebd\` FOREIGN KEY (\`trainingParticipantCategoryId\`) REFERENCES \`training_participant_category\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`participant\` ADD CONSTRAINT \`FK_b915e97dea27ffd1e40c8003b3b\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`participant\` DROP FOREIGN KEY \`FK_b915e97dea27ffd1e40c8003b3b\``);
        await queryRunner.query(`ALTER TABLE \`training_participant\` DROP FOREIGN KEY \`FK_150f6a67bc99deb25322dc4eebd\``);
        await queryRunner.query(`ALTER TABLE \`training_participant\` DROP FOREIGN KEY \`FK_88c8ef2b7370828a396362e5cce\``);
        await queryRunner.query(`ALTER TABLE \`training_participant\` DROP FOREIGN KEY \`FK_94fb95b864228ff45bdb3b90d07\``);
        await queryRunner.query(`ALTER TABLE \`training_participant\` DROP FOREIGN KEY \`FK_82d9d70a356389bfe495ba90e4a\``);
        await queryRunner.query(`ALTER TABLE \`training_participant\` DROP FOREIGN KEY \`FK_8cc3fa76c27243cd6511e1f48dc\``);
        await queryRunner.query(`ALTER TABLE \`certificate\` DROP FOREIGN KEY \`FK_5f12725ed5ff2260869e2ce647a\``);
        await queryRunner.query(`ALTER TABLE \`training\` DROP FOREIGN KEY \`FK_d8a8d0d38b80b555db80645c081\``);
        await queryRunner.query(`ALTER TABLE \`training_category\` DROP FOREIGN KEY \`FK_46ad7fff718b601d4f2958108b6\``);
        await queryRunner.query(`ALTER TABLE \`training_category\` DROP FOREIGN KEY \`FK_927b6c1094f25ff37a54f77a4e5\``);
        await queryRunner.query(`ALTER TABLE \`training_participant_category\` DROP FOREIGN KEY \`FK_2aaf52cf931474f3e396fc20a05\``);
        await queryRunner.query(`ALTER TABLE \`coach\` CHANGE \`deletedAt\` \`deletedAt\` datetime(6) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`deletedAt\` \`deletedAt\` datetime(6) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`imageAvatar\` \`imageAvatar\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`participant\` CHANGE \`userId\` \`userId\` varchar(36) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`participant\` CHANGE \`deletedAt\` \`deletedAt\` datetime(6) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`participant\` CHANGE \`phone\` \`phone\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`participant\` ADD CONSTRAINT \`FK_b915e97dea27ffd1e40c8003b3b\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` CHANGE \`trainingParticipantCategoryId\` \`trainingParticipantCategoryId\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` CHANGE \`certificateId\` \`certificateId\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` CHANGE \`coachId\` \`coachId\` varchar(36) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` CHANGE \`trainingId\` \`trainingId\` varchar(36) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` CHANGE \`participantId\` \`participantId\` varchar(36) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` CHANGE \`deletedAt\` \`deletedAt\` datetime(6) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` ADD CONSTRAINT \`FK_150f6a67bc99deb25322dc4eebd\` FOREIGN KEY (\`trainingParticipantCategoryId\`) REFERENCES \`training_participant_category\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` ADD CONSTRAINT \`FK_88c8ef2b7370828a396362e5cce\` FOREIGN KEY (\`certificateId\`) REFERENCES \`certificate\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` ADD CONSTRAINT \`FK_94fb95b864228ff45bdb3b90d07\` FOREIGN KEY (\`coachId\`) REFERENCES \`coach\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` ADD CONSTRAINT \`FK_82d9d70a356389bfe495ba90e4a\` FOREIGN KEY (\`trainingId\`) REFERENCES \`training\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` ADD CONSTRAINT \`FK_8cc3fa76c27243cd6511e1f48dc\` FOREIGN KEY (\`participantId\`) REFERENCES \`participant\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`certificate\` CHANGE \`trainingParticipantId\` \`trainingParticipantId\` varchar(36) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`certificate\` ADD CONSTRAINT \`FK_5f12725ed5ff2260869e2ce647a\` FOREIGN KEY (\`trainingParticipantId\`) REFERENCES \`training_participant\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training\` CHANGE \`trainingCoachId\` \`trainingCoachId\` varchar(36) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`training\` CHANGE \`deletedAt\` \`deletedAt\` datetime(6) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`training\` ADD CONSTRAINT \`FK_d8a8d0d38b80b555db80645c081\` FOREIGN KEY (\`trainingCoachId\`) REFERENCES \`coach\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`coach\` CHANGE \`deletedAt\` \`deletedAt\` datetime(6) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`training_category\` CHANGE \`trainingId\` \`trainingId\` varchar(36) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`training_category\` CHANGE \`categoryId\` \`categoryId\` varchar(36) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`training_category\` ADD CONSTRAINT \`FK_46ad7fff718b601d4f2958108b6\` FOREIGN KEY (\`trainingId\`) REFERENCES \`training\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training_category\` ADD CONSTRAINT \`FK_927b6c1094f25ff37a54f77a4e5\` FOREIGN KEY (\`categoryId\`) REFERENCES \`category\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`category\` CHANGE \`deletedAt\` \`deletedAt\` datetime(6) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`training_participant_category\` CHANGE \`categoryId\` \`categoryId\` varchar(36) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`training_participant_category\` ADD CONSTRAINT \`FK_2aaf52cf931474f3e396fc20a05\` FOREIGN KEY (\`categoryId\`) REFERENCES \`category\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`coach\` DROP COLUMN \`expiredTime\``);
        await queryRunner.query(`ALTER TABLE \`coach\` DROP COLUMN \`coachName\``);
        await queryRunner.query(`ALTER TABLE \`coach\` ADD \`expiredTime\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`coach\` CHANGE \`expiredTime\` \`coachName\` varchar(255) NOT NULL`);
    }

}
