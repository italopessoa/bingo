import * as Teste from "./folder/lala";

interface SampleInput {
    Comment: string
}

export const lambdaHandler = async (
     event: SampleInput
  ): Promise<any> => {
    Teste.X();
    return {
      statusCode: 200,
      body: `Queries: ${event}`
    }
  }