import { describe, it, expect } from "vitest";
import { evaluateWorkflowFilters, FilterGroup } from "../evaluator";

describe("Workflow Filter Evaluator (json-rules-engine)", () => {
  const payload = {
    name: "Enterprise Upgrade Project",
    status: "active",
    actor: {
      role: "admin",
      email: "admin@company.com"
    },
    value: 5000
  };

  it("should return true when filters are null or undefined", async () => {
    expect(await evaluateWorkflowFilters(null, payload)).toBe(true);
    expect(await evaluateWorkflowFilters(undefined, payload)).toBe(true);
  });

  it("should evaluate a simple 'equals' condition correctly", async () => {
    const filters: FilterGroup = {
      combinator: "and",
      rules: [
        {
          field: "status",
          operator: "equals",
          value: "active"
        }
      ]
    };

    expect(await evaluateWorkflowFilters(filters, payload)).toBe(true);

    const failingFilters: FilterGroup = {
      combinator: "and",
      rules: [
        {
          field: "status",
          operator: "equals",
          value: "archived"
        }
      ]
    };
    expect(await evaluateWorkflowFilters(failingFilters, payload)).toBe(false);
  });

  it("should evaluate nested fields correctly (e.g. actor.role)", async () => {
    const filters: FilterGroup = {
      combinator: "and",
      rules: [
        {
          field: "actor.role",
          operator: "equals",
          value: "admin"
        }
      ]
    };

    expect(await evaluateWorkflowFilters(filters, payload)).toBe(true);
  });

  it("should evaluate 'contains' and 'not_contains' operators correctly", async () => {
    const filtersContains: FilterGroup = {
      combinator: "and",
      rules: [
        {
          field: "name",
          operator: "contains",
          value: "upgrade"
        }
      ]
    };
    expect(await evaluateWorkflowFilters(filtersContains, payload)).toBe(true);

    const filtersNotContains: FilterGroup = {
      combinator: "and",
      rules: [
        {
          field: "name",
          operator: "not_contains",
          value: "mobile"
        }
      ]
    };
    expect(await evaluateWorkflowFilters(filtersNotContains, payload)).toBe(true);
  });

  it("should evaluate 'exists' and 'not_exists' operators correctly", async () => {
    const filtersExists: FilterGroup = {
      combinator: "and",
      rules: [
        {
          field: "actor.email",
          operator: "exists",
          value: ""
        }
      ]
    };
    expect(await evaluateWorkflowFilters(filtersExists, payload)).toBe(true);

    const filtersNotExists: FilterGroup = {
      combinator: "and",
      rules: [
        {
          field: "missing_field",
          operator: "not_exists",
          value: ""
        }
      ]
    };
    expect(await evaluateWorkflowFilters(filtersNotExists, payload)).toBe(true);
  });

  it("should evaluate complex nested groups (AND / OR) correctly", async () => {
    const complexFilters: FilterGroup = {
      combinator: "or",
      rules: [
        {
          combinator: "and",
          rules: [
            { field: "status", operator: "equals", value: "archived" },
            { field: "actor.role", operator: "equals", value: "admin" }
          ]
        },
        {
          combinator: "and",
          rules: [
            { field: "status", operator: "equals", value: "active" },
            { field: "value", operator: "equals", value: "5000" }
          ]
        }
      ]
    };

    expect(await evaluateWorkflowFilters(complexFilters, payload)).toBe(true);
  });
});
