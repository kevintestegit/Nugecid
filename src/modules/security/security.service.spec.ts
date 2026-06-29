import { SecurityService } from "./security.service";

type QueryBuilderMock = {
  select: jest.Mock;
  addSelect: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  groupBy: jest.Mock;
  addGroupBy: jest.Mock;
  orderBy: jest.Mock;
  limit: jest.Mock;
  innerJoin: jest.Mock;
  distinct: jest.Mock;
  getRawMany: jest.Mock;
};

const createQueryBuilderMock = (
  rows: Record<string, unknown>[],
): QueryBuilderMock => {
  const builder = {} as QueryBuilderMock;
  const chain = () => builder;

  builder.select = jest.fn(chain);
  builder.addSelect = jest.fn(chain);
  builder.where = jest.fn(chain);
  builder.andWhere = jest.fn(chain);
  builder.groupBy = jest.fn(chain);
  builder.addGroupBy = jest.fn(chain);
  builder.orderBy = jest.fn(chain);
  builder.limit = jest.fn(chain);
  builder.innerJoin = jest.fn(chain);
  builder.distinct = jest.fn(chain);
  builder.getRawMany = jest.fn().mockResolvedValue(rows);

  return builder;
};

describe("SecurityService", () => {
  it("monta a consulta de user agents distintos com DISTINCT válido", async () => {
    const aggregateQuery = createQueryBuilderMock([
      {
        ip_address: "127.0.0.1",
        total_attempts: "2",
        successful_logins: "1",
        failed_logins: "1",
        last_attempt: "2026-06-11T12:00:00.000Z",
        first_attempt: "2026-06-11T11:00:00.000Z",
      },
    ]);
    const userDetailsQuery = createQueryBuilderMock([]);
    const userAgentQuery = createQueryBuilderMock([
      {
        ip_address: "127.0.0.1",
        user_agent: "Mozilla/5.0",
      },
    ]);

    const auditoriaRepository = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(aggregateQuery)
        .mockReturnValueOnce(userDetailsQuery)
        .mockReturnValueOnce(userAgentQuery),
    };
    const blockedIpRepository = {
      find: jest.fn().mockResolvedValue([]),
    };

    const service = new SecurityService(
      blockedIpRepository as never,
      auditoriaRepository as never,
      {} as never,
    );

    await service.getIpAccessStats(7, 100);

    expect(userAgentQuery.select).toHaveBeenCalledWith(
      "a.ipAddress",
      "ip_address",
    );
    expect(userAgentQuery.addSelect).toHaveBeenCalledWith(
      "a.userAgent",
      "user_agent",
    );
    expect(userAgentQuery.distinct).toHaveBeenCalledWith(true);
  });
});
