export interface SgpServersConfig {
  version: number

  lastUpdate: number

  servers: {
    [region: string]: {
      /**
       * 用于战绩查询的服务器地址
       */
      matchHistory: string | null

      /**
       * 其他通用查询服务器地址
       */
      common: string | null
    }
  }

  serverNames: {
    [locale: string]: {
      [server: string]: string
    }
  }

  /**
   * 腾讯服务器中，以下服务器可以使用同一个 jwt token 实现战绩查询
   */
  tencentServerMatchHistoryInteroperability: string[]

  /**
   * 腾讯服务器中，以下服务器可以使用同一个 jwt token 实现观战查询
   */
  tencentServerSpectatorInteroperability: string[]

  /**
   * 腾讯服务器中，以下服务器可以使用同一个 jwt token 实现召唤师查询
   */
  tencentServerSummonerInteroperability: string[]
}
