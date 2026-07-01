import { QueryRunner, TableColumn } from 'typeorm'

export async function v19_LA1_3_9Upgrade(queryRunner: QueryRunner) {
  const table = await queryRunner.getTable('QQAccounts')
  if (table && !table.findColumnByName('password')) {
    await queryRunner.addColumn(
      table,
      new TableColumn({ name: 'password', type: 'varchar', isNullable: true })
    )
  }
  await queryRunner.query(`UPDATE Metadata SET value = json('19') WHERE key = 'version'`)
}
