import { expandRolesForTransition, normalizeRoleName } from "./role.utils";
import { RoleType } from "./role-type.enum";

describe("role.utils", () => {
  it("normaliza nugecid_operator para usuario", () => {
    expect(normalizeRoleName("nugecid_operator")).toBe(RoleType.USUARIO);
  });

  it("expande usuario para incluir aliases legados em transição", () => {
    expect(expandRolesForTransition([RoleType.USUARIO])).toEqual(
      expect.arrayContaining([
        RoleType.USUARIO,
        "nugecid_operator",
        "nugecid_viewer",
      ]),
    );
  });
});
