import { QueryRunner, TableColumn } from 'typeorm'

import { EncounteredGame } from '../entities/EncounteredGame'

/**
 * Version 16 - Add column `championId` to table EncounteredGames
 */
export async function v16_la1_2_3Upgrade(queryRunner: QueryRunner) {
  const encounteredGames = queryRunner.dataSource.getMetadata(EncounteredGame)

  const table = await queryRunner.getTable(encounteredGames.tablePath)

  if (table) {
    const column = table.findColumnByName('championId')

    if (!column) {
      await queryRunner.addColumn(
        table,
        new TableColumn({
          name: 'championId',
          type: 'integer',
          isNullable: true
        })
      )
    }
  }

  await queryRunner.query(`UPDATE Metadata SET value = json('16') WHERE key = 'version'`)
}
