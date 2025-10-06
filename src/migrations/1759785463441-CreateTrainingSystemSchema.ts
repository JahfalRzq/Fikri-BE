import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTrainingSystemSchema1759785463441 implements MigrationInterface {
    name = 'CreateTrainingSystemSchema1759785463441'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`training\` DROP FOREIGN KEY \`FK_878b986771ec1dddc9c7f76c8c5\``);
        await queryRunner.query(`ALTER TABLE \`training\` DROP FOREIGN KEY \`FK_d8a8d0d38b80b555db80645c081\``);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`image\` \`imageAvatar\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`CREATE TABLE \`training_participant_category\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`categoryId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`category\` (\`id\` varchar(36) NOT NULL, \`categoryName\` varchar(255) NOT NULL, \`trainingCode\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`training_category\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`categoryId\` varchar(36) NULL, \`trainingId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`coach\` (\`id\` varchar(36) NOT NULL, \`coachName\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`certificate\` (\`id\` int NOT NULL AUTO_INCREMENT, \`imageUrl\` varchar(255) NOT NULL, \`noLiscense\` varchar(255) NOT NULL, \`expiredAt\` datetime NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`trainingParticipantId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`training_participant\` (\`id\` varchar(36) NOT NULL, \`status\` enum ('selesai', 'sedangBerlangsung', 'tidakSelesai', 'belumMulai') NOT NULL, \`ttdImage\` varchar(255) NOT NULL, \`signatoryPosition\` varchar(255) NOT NULL, \`signatoryName\` varchar(255) NOT NULL, \`startDateTraining\` datetime NOT NULL, \`endDateTraining\` datetime NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`participantId\` varchar(36) NULL, \`trainingId\` varchar(36) NULL, \`coachId\` varchar(36) NULL, \`certificateId\` int NULL, \`trainingParticipantCategoryId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`training\` DROP COLUMN \`categoryTrainingId\``);
        await queryRunner.query(`ALTER TABLE \`training\` ADD \`ttdImage\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`training\` ADD \`signatoryPosition\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`training\` ADD \`signatoryName\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`training\` CHANGE \`deletedAt\` \`deletedAt\` datetime(6) NULL`);
        await queryRunner.query(`ALTER TABLE \`training\` CHANGE \`trainingCoachId\` \`trainingCoachId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`participant\` DROP FOREIGN KEY \`FK_b915e97dea27ffd1e40c8003b3b\``);
        await queryRunner.query(`ALTER TABLE \`participant\` CHANGE \`phone\` \`phone\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`participant\` CHANGE \`deletedAt\` \`deletedAt\` datetime(6) NULL`);
        await queryRunner.query(`ALTER TABLE \`participant\` CHANGE \`userId\` \`userId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`imageAvatar\``);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`imageAvatar\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`deletedAt\` \`deletedAt\` datetime(6) NULL`);
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
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`deletedAt\` \`deletedAt\` datetime(6) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`imageAvatar\``);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`imageAvatar\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`participant\` CHANGE \`userId\` \`userId\` varchar(36) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`participant\` CHANGE \`deletedAt\` \`deletedAt\` datetime(6) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`participant\` CHANGE \`phone\` \`phone\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`participant\` ADD CONSTRAINT \`FK_b915e97dea27ffd1e40c8003b3b\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training\` CHANGE \`trainingCoachId\` \`trainingCoachId\` varchar(36) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`training\` CHANGE \`deletedAt\` \`deletedAt\` datetime(6) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`training\` DROP COLUMN \`signatoryName\``);
        await queryRunner.query(`ALTER TABLE \`training\` DROP COLUMN \`signatoryPosition\``);
        await queryRunner.query(`ALTER TABLE \`training\` DROP COLUMN \`ttdImage\``);
        await queryRunner.query(`ALTER TABLE \`training\` ADD \`categoryTrainingId\` varchar(36) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`DROP TABLE \`training_participant\``);
        await queryRunner.query(`DROP TABLE \`certificate\``);
        await queryRunner.query(`DROP TABLE \`coach\``);
        await queryRunner.query(`DROP TABLE \`training_category\``);
        await queryRunner.query(`DROP TABLE \`category\``);
        await queryRunner.query(`DROP TABLE \`training_participant_category\``);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`imageAvatar\` \`image\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`training\` ADD CONSTRAINT \`FK_d8a8d0d38b80b555db80645c081\` FOREIGN KEY (\`trainingCoachId\`) REFERENCES \`training_coach\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`training\` ADD CONSTRAINT \`FK_878b986771ec1dddc9c7f76c8c5\` FOREIGN KEY (\`categoryTrainingId\`) REFERENCES \`category_training\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
