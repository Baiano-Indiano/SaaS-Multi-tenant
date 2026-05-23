import { describe, it, expect } from "vitest";
import { evaluateWorkflowFilters, FilterGroup } from "@/lib/workflows/evaluator";

describe("Workflow Filters Evaluator Engine", () => {
  const samplePayload = {
    event: "project.created",
    payload: {
      id: "proj_123",
      name: "Critical Enterprise Migration",
      description: "A database migration project",
      status: "active",
      priority: "high",
      tags: ["migration", "enterprise"],
    },
    actor: {
      userId: "usr_999",
      email: "admin@company.com",
      role: "administrator",
    },
  };

  describe("Basic Operator Evaluation", () => {
    it("should evaluate null, undefined, or empty filters as true (always trigger)", () => {
      expect(evaluateWorkflowFilters(null, samplePayload)).toBe(true);
      expect(evaluateWorkflowFilters(undefined, samplePayload)).toBe(true);
      expect(evaluateWorkflowFilters("", samplePayload)).toBe(true);
      
      const emptyGroup: FilterGroup = { combinator: "and", rules: [] };
      expect(evaluateWorkflowFilters(JSON.stringify(emptyGroup), samplePayload)).toBe(true);
    });

    it("should evaluate equals operator", () => {
      const matchFilter: FilterGroup = {
        combinator: "and",
        rules: [{ field: "payload.status", operator: "equals", value: "active" }]
      };
      const mismatchFilter: FilterGroup = {
        combinator: "and",
        rules: [{ field: "payload.status", operator: "equals", value: "archived" }]
      };

      expect(evaluateWorkflowFilters(JSON.stringify(matchFilter), samplePayload)).toBe(true);
      expect(evaluateWorkflowFilters(JSON.stringify(mismatchFilter), samplePayload)).toBe(false);
    });

    it("should evaluate not_equals operator", () => {
      const matchFilter: FilterGroup = {
        combinator: "and",
        rules: [{ field: "payload.status", operator: "not_equals", value: "archived" }]
      };
      const mismatchFilter: FilterGroup = {
        combinator: "and",
        rules: [{ field: "payload.status", operator: "not_equals", value: "active" }]
      };

      expect(evaluateWorkflowFilters(JSON.stringify(matchFilter), samplePayload)).toBe(true);
      expect(evaluateWorkflowFilters(JSON.stringify(mismatchFilter), samplePayload)).toBe(false);
    });

    it("should evaluate contains operator case-insensitively", () => {
      const matchFilter: FilterGroup = {
        combinator: "and",
        rules: [{ field: "payload.name", operator: "contains", value: "enterprise" }]
      };
      const mismatchFilter: FilterGroup = {
        combinator: "and",
        rules: [{ field: "payload.name", operator: "contains", value: "blockchain" }]
      };

      expect(evaluateWorkflowFilters(JSON.stringify(matchFilter), samplePayload)).toBe(true);
      expect(evaluateWorkflowFilters(JSON.stringify(mismatchFilter), samplePayload)).toBe(false);
    });

    it("should evaluate not_contains operator", () => {
      const matchFilter: FilterGroup = {
        combinator: "and",
        rules: [{ field: "payload.name", operator: "not_contains", value: "blockchain" }]
      };
      const mismatchFilter: FilterGroup = {
        combinator: "and",
        rules: [{ field: "payload.name", operator: "not_contains", value: "migration" }]
      };

      expect(evaluateWorkflowFilters(JSON.stringify(matchFilter), samplePayload)).toBe(true);
      expect(evaluateWorkflowFilters(JSON.stringify(mismatchFilter), samplePayload)).toBe(false);
    });

    it("should evaluate exists and not_exists operators", () => {
      const existsFilter: FilterGroup = {
        combinator: "and",
        rules: [{ field: "payload.description", operator: "exists", value: "" }]
      };
      const notExistsFilter: FilterGroup = {
        combinator: "and",
        rules: [{ field: "payload.nonexistent_field", operator: "not_exists", value: "" }]
      };

      expect(evaluateWorkflowFilters(JSON.stringify(existsFilter), samplePayload)).toBe(true);
      expect(evaluateWorkflowFilters(JSON.stringify(notExistsFilter), samplePayload)).toBe(true);
    });
  });

  describe("Fail-Closed Rules for Missing/Undefined Fields", () => {
    it("should fail closed (return false) for standard comparisons on missing fields", () => {
      // equals on missing field should be false
      const equalsFilter: FilterGroup = {
        combinator: "and",
        rules: [{ field: "payload.nonexistent_field", operator: "equals", value: "anything" }]
      };
      // not_equals on missing field should be false (strict fail-closed)
      const notEqualsFilter: FilterGroup = {
        combinator: "and",
        rules: [{ field: "payload.nonexistent_field", operator: "not_equals", value: "anything" }]
      };
      // contains on missing field should be false
      const containsFilter: FilterGroup = {
        combinator: "and",
        rules: [{ field: "payload.nonexistent_field", operator: "contains", value: "anything" }]
      };
      // not_contains on missing field should be false
      const notContainsFilter: FilterGroup = {
        combinator: "and",
        rules: [{ field: "payload.nonexistent_field", operator: "not_contains", value: "anything" }]
      };
      // exists on missing field should be false
      const existsFilter: FilterGroup = {
        combinator: "and",
        rules: [{ field: "payload.nonexistent_field", operator: "exists", value: "" }]
      };

      expect(evaluateWorkflowFilters(JSON.stringify(equalsFilter), samplePayload)).toBe(false);
      expect(evaluateWorkflowFilters(JSON.stringify(notEqualsFilter), samplePayload)).toBe(false);
      expect(evaluateWorkflowFilters(JSON.stringify(containsFilter), samplePayload)).toBe(false);
      expect(evaluateWorkflowFilters(JSON.stringify(notContainsFilter), samplePayload)).toBe(false);
      expect(evaluateWorkflowFilters(JSON.stringify(existsFilter), samplePayload)).toBe(false);
    });

    it("should return true for not_exists operator when field is missing, null, or empty string", () => {
      const missingFieldGroup: FilterGroup = {
        combinator: "and",
        rules: [{ field: "payload.missing", operator: "not_exists", value: "" }]
      };
      const nullFieldPayload = { payload: { nullField: null } };
      const nullFieldGroup: FilterGroup = {
        combinator: "and",
        rules: [{ field: "payload.nullField", operator: "not_exists", value: "" }]
      };
      const emptyStringPayload = { payload: { emptyField: "" } };
      const emptyFieldGroup: FilterGroup = {
        combinator: "and",
        rules: [{ field: "payload.emptyField", operator: "not_exists", value: "" }]
      };

      expect(evaluateWorkflowFilters(JSON.stringify(missingFieldGroup), samplePayload)).toBe(true);
      expect(evaluateWorkflowFilters(JSON.stringify(nullFieldGroup), nullFieldPayload)).toBe(true);
      expect(evaluateWorkflowFilters(JSON.stringify(emptyFieldGroup), emptyStringPayload)).toBe(true);
    });

    it("should return false (fail-closed) when filters JSON is malformed or invalid", () => {
      const malformedJson = "{ combinator: 'and', rules: [ { field: 'name', operator: 'equals', ";
      expect(evaluateWorkflowFilters(malformedJson, samplePayload)).toBe(false);
    });
  });

  describe("Complex Nested Branching (AND/OR Combinators)", () => {
    it("should evaluate OR combinator", () => {
      const orFilter: FilterGroup = {
        combinator: "or",
        rules: [
          { field: "payload.status", operator: "equals", value: "archived" }, // false
          { field: "actor.role", operator: "equals", value: "administrator" }  // true
        ]
      };
      expect(evaluateWorkflowFilters(JSON.stringify(orFilter), samplePayload)).toBe(true);
    });

    it("should evaluate nested rules (AND containing OR)", () => {
      const nestedFilter: FilterGroup = {
        combinator: "and",
        rules: [
          { field: "payload.name", operator: "contains", value: "Critical" }, // true
          {
            combinator: "or",
            rules: [
              { field: "payload.priority", operator: "equals", value: "low" },      // false
              { field: "actor.email", operator: "equals", value: "admin@company.com" } // true
            ]
          }
        ]
      };
      expect(evaluateWorkflowFilters(JSON.stringify(nestedFilter), samplePayload)).toBe(true);
    });

    it("should evaluate nested rules up to depth 3", () => {
      // Depth 1 (AND)
      //   - Rule 1: payload.name contains "Enterprise" (true)
      //   - Depth 2 (OR)
      //       - Rule 2: payload.status equals "archived" (false)
      //       - Depth 3 (AND)
      //           - Rule 3: payload.priority equals "high" (true)
      //           - Rule 4: actor.role equals "administrator" (true)
      const depth3Filter: FilterGroup = {
        combinator: "and",
        rules: [
          { field: "payload.name", operator: "contains", value: "Enterprise" },
          {
            combinator: "or",
            rules: [
              { field: "payload.status", operator: "equals", value: "archived" },
              {
                combinator: "and",
                rules: [
                  { field: "payload.priority", operator: "equals", value: "high" },
                  { field: "actor.role", operator: "equals", value: "administrator" }
                ]
              }
            ]
          }
        ]
      };
      expect(evaluateWorkflowFilters(JSON.stringify(depth3Filter), samplePayload)).toBe(true);
    });
  });
});
