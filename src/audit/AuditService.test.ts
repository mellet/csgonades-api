import { instance, mock, verify, when } from "ts-mockito";
import { AuditService, AuditServiceDependencies } from "./AuditService";
import { AuditDto } from "./dto/AuditDto";
import { CreateAuditDto } from "./dto/CreateAuditDto";
import { AuditRepo } from "./repository/AuditRepo";

describe("AuditService", () => {
  let service: AuditService;
  let deps: AuditServiceDependencies;

  beforeEach(() => {
    deps = {
      auditRepo: mock<AuditRepo>(),
    };

    service = new AuditService({
      auditRepo: instance(deps.auditRepo),
    });
  });

  it("gets audit events", async () => {
    const mockedResponse: AuditDto[] = [
      {
        id: "",
        byUser: { avatar: "", nickname: "", role: "user", steamId: "" },
        createdAt: new Date(),
        description: "",
        name: "updateNade",
        onNadeId: "",
      },
    ];

    when(deps.auditRepo.getAuditEvents()).thenResolve(mockedResponse);

    const auditEvents = await service.getAuditEvents();

    verify(deps.auditRepo.getAuditEvents()).once();
    expect(auditEvents).toEqual(mockedResponse);
  });

  it("saved audit event", async () => {
    const newAuditEvent: CreateAuditDto = {
      name: "updateNade",
      byUser: {
        nickname: "nickname",
        avatar: "avatar",
        role: "user",
        steamId: "",
      },
      description: "",
      onNadeId: "",
    };

    const mockedResponse: AuditDto = {
      byUser: newAuditEvent.byUser,
      createdAt: new Date(),
      description: newAuditEvent.description,
      id: "",
      name: newAuditEvent.name,
      onNadeId: newAuditEvent.onNadeId,
    };

    when(deps.auditRepo.createAuditEvent(newAuditEvent)).thenResolve();

    const result = await service.createAuditEvent(newAuditEvent);

    verify(deps.auditRepo.createAuditEvent(newAuditEvent)).once();
    expect(result).toEqual(mockedResponse);
  });
});
