import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCarMakes1748408400000 implements MigrationInterface {
  name = 'CreateCarMakes1748408400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "car_makes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" character varying(100) NOT NULL,
        "slug" character varying(120) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "showOnHome" boolean NOT NULL DEFAULT true,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_car_makes_slug"
      ON "car_makes" ("slug")
    `);

    await queryRunner.query(`
      INSERT INTO "car_makes" ("name", "slug", "isActive", "showOnHome", "sortOrder")
      VALUES
        ('Toyota', 'toyota', true, true, 10),
        ('Honda', 'honda', true, true, 20),
        ('Mazda', 'mazda', true, true, 30),
        ('Hyundai', 'hyundai', true, true, 40),
        ('Kia', 'kia', true, true, 50),
        ('Ford', 'ford', true, true, 60),
        ('VinFast', 'vinfast', true, true, 70),
        ('Mercedes', 'mercedes', true, true, 80),
        ('BMW', 'bmw', true, true, 90)
      ON CONFLICT ("slug") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_car_makes_slug"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "car_makes"`);
  }
}
