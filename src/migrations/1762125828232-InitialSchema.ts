import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1762125828232 implements MigrationInterface {
    name = 'InitialSchema1762125828232'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` varchar(36) NOT NULL, \`userName\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`role\` enum ('ADMIN', 'PARTICIPANT') NOT NULL, \`imageAvatar\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`participant\` (\`id\` varchar(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`firstName\` varchar(255) NOT NULL, \`lastName\` varchar(255) NOT NULL, \`company\` varchar(255) NOT NULL, \`companyAddress\` varchar(255) NOT NULL, \`phone\` varchar(255) NULL, \`jobTitle\` varchar(255) NOT NULL, \`officePhone\` varchar(255) NOT NULL, \`message\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`userId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`coach\` (\`id\` varchar(36) NOT NULL, \`coachName\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`training\` (\`id\` varchar(36) NOT NULL, \`trainingName\` varchar(255) NOT NULL, \`category\` varchar(255) NOT NULL, \`price\` int NOT NULL, \`startDateTraining\` datetime NOT NULL, \`endDateTraining\` datetime NOT NULL, \`ttdImage\` varchar(255) NOT NULL, \`signatoryPosition\` varchar(255) NOT NULL, \`signatoryName\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`trainingCoachId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`certificate\` (\`id\` varchar(36) NOT NULL, \`imageUrl\` varchar(255) NOT NULL, \`noLiscense\` varchar(255) NOT NULL, \`expiredAt\` datetime NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`trainingParticipantId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`training_participant\` (\`id\` varchar(36) NOT NULL, \`status\` enum ('selesai', 'sedangBerlangsung', 'tidakSelesai', 'belumMulai') NOT NULL, \`ttdImage\` varchar(255) NOT NULL, \`signatoryPosition\` varchar(255) NOT NULL, \`signatoryName\` varchar(255) NOT NULL, \`startDateTraining\` datetime NOT NULL, \`endDateTraining\` datetime NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`participantId\` varchar(36) NULL, \`trainingId\` varchar(36) NULL, \`coachId\` varchar(36) NULL, \`certificateId\` varchar(36) NULL, \`trainingParticipantCategoryId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`training_participant_category\` (\`id\` varchar(36) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`categoryId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`category\` (\`id\` varchar(36) NOT NULL, \`categoryName\` varchar(255) NOT NULL, \`trainingCode\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`training_category\` (\`id\` varchar(36) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`categoryId\` varchar(36) NULL, \`trainingId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`settings\` (\`id\` varchar(36) NOT NULL, \`expiredTime\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`participant\` ADD CONSTRAINT \`FK_b915e97dea27ffd1e40c8003b3b\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training\` ADD CONSTRAINT \`FK_d8a8d0d38b80b555db80645c081\` FOREIGN KEY (\`trainingCoachId\`) REFERENCES \`coach\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`certificate\` ADD CONSTRAINT \`FK_5f12725ed5ff2260869e2ce647a\` FOREIGN KEY (\`trainingParticipantId\`) REFERENCES \`training_participant\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` ADD CONSTRAINT \`FK_8cc3fa76c27243cd6511e1f48dc\` FOREIGN KEY (\`participantId\`) REFERENCES \`participant\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` ADD CONSTRAINT \`FK_82d9d70a356389bfe495ba90e4a\` FOREIGN KEY (\`trainingId\`) REFERENCES \`training\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` ADD CONSTRAINT \`FK_94fb95b864228ff45bdb3b90d07\` FOREIGN KEY (\`coachId\`) REFERENCES \`coach\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` ADD CONSTRAINT \`FK_88c8ef2b7370828a396362e5cce\` FOREIGN KEY (\`certificateId\`) REFERENCES \`certificate\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training_participant\` ADD CONSTRAINT \`FK_150f6a67bc99deb25322dc4eebd\` FOREIGN KEY (\`trainingParticipantCategoryId\`) REFERENCES \`training_participant_category\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training_participant_category\` ADD CONSTRAINT \`FK_2aaf52cf931474f3e396fc20a05\` FOREIGN KEY (\`categoryId\`) REFERENCES \`category\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training_category\` ADD CONSTRAINT \`FK_927b6c1094f25ff37a54f77a4e5\` FOREIGN KEY (\`categoryId\`) REFERENCES \`category\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training_category\` ADD CONSTRAINT \`FK_46ad7fff718b601d4f2958108b6\` FOREIGN KEY (\`trainingId\`) REFERENCES \`training\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`training_category\` DROP FOREIGN KEY \`FK_46ad7fff718b601d4f2958108b6\``);
        await queryRunner.query(`ALTER TABLE \`training_category\` DROP FOREIGN KEY \`FK_927b6c1094f25ff37a54f77a4e5\``);
        await queryRunner.query(`ALTER TABLE \`training_participant_category\` DROP FOREIGN KEY \`FK_2aaf52cf931474f3e396fc20a05\``);
        await queryRunner.query(`ALTER TABLE \`training_participant\` DROP FOREIGN KEY \`FK_150f6a67bc99deb25322dc4eebd\``);
        await queryRunner.query(`ALTER TABLE \`training_participant\` DROP FOREIGN KEY \`FK_88c8ef2b7370828a396362e5cce\``);
        await queryRunner.query(`ALTER TABLE \`training_participant\` DROP FOREIGN KEY \`FK_94fb95b864228ff45bdb3b90d07\``);
        await queryRunner.query(`ALTER TABLE \`training_participant\` DROP FOREIGN KEY \`FK_82d9d70a356389bfe495ba90e4a\``);
        await queryRunner.query(`ALTER TABLE \`training_participant\` DROP FOREIGN KEY \`FK_8cc3fa76c27243cd6511e1f48dc\``);
        await queryRunner.query(`ALTER TABLE \`certificate\` DROP FOREIGN KEY \`FK_5f12725ed5ff2260869e2ce647a\``);
        await queryRunner.query(`ALTER TABLE \`training\` DROP FOREIGN KEY \`FK_d8a8d0d38b80b555db80645c081\``);
        await queryRunner.query(`ALTER TABLE \`participant\` DROP FOREIGN KEY \`FK_b915e97dea27ffd1e40c8003b3b\``);
        await queryRunner.query(`DROP TABLE \`settings\``);
        await queryRunner.query(`DROP TABLE \`training_category\``);
        await queryRunner.query(`DROP TABLE \`category\``);
        await queryRunner.query(`DROP TABLE \`training_participant_category\``);
        await queryRunner.query(`DROP TABLE \`training_participant\``);
        await queryRunner.query(`DROP TABLE \`certificate\``);
        await queryRunner.query(`DROP TABLE \`training\``);
        await queryRunner.query(`DROP TABLE \`coach\``);
        await queryRunner.query(`DROP TABLE \`participant\``);
        await queryRunner.query(`DROP TABLE \`user\``);
    }

}
