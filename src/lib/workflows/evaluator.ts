export type FilterOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'exists' | 'not_exists';

export interface FilterRule {
  field: string;
  operator: FilterOperator;
  value: string;
}

export interface FilterGroup {
  combinator: 'and' | 'or';
  rules: (FilterRule | FilterGroup)[];
}

/**
 * Safely extracts a nested value from a JSON object given a dot-separated path.
 * Supports accessing payload properties (e.g. "payload.name" or "actor.role").
 */
function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((acc, part) => {
    if (acc === null || acc === undefined) return undefined;
    if (part === "__proto__" || part === "constructor" || part === "prototype") {
      return undefined;
    }
    return Reflect.get(acc, part);
  }, obj);
}

/**
 * Evaluates a single filter rule against the event payload.
 */
function evaluateRule(rule: FilterRule, payload: any): boolean {
  const { field, operator, value } = rule;
  const actualValue = getNestedValue(payload, field);

  // Strict Fail-Closed for missing/null fields
  if (actualValue === undefined || actualValue === null) {
    if (operator === "not_exists") return true;
    return false; // All standard comparisons, including not_equals and not_contains, fail-closed
  }

  switch (operator) {
    case "equals":
      return String(actualValue) === String(value);
    case "not_equals":
      return String(actualValue) !== String(value);
    case "contains":
      return String(actualValue).toLowerCase().includes(String(value).toLowerCase());
    case "not_contains":
      return !String(actualValue).toLowerCase().includes(String(value).toLowerCase());
    case "exists":
      return actualValue !== "";
    case "not_exists":
      return actualValue === "";
    default:
      return false; // Unknown operator fails closed
  }
}

/**
 * Recursively evaluates a FilterGroup AST against the event payload.
 */
export function evaluateWorkflowFilters(filtersJson: string | null | undefined, payload: any): boolean {
  if (!filtersJson) return true; // No filters means evaluate to true (always trigger)
  
  try {
    const group = typeof filtersJson === "string" ? JSON.parse(filtersJson) as FilterGroup : filtersJson as FilterGroup;
    if (!group || !group.rules || !Array.isArray(group.rules) || group.rules.length === 0) {
      return true;
    }

    const results = group.rules.map((ruleOrGroup) => {
      if ("combinator" in ruleOrGroup) {
        // It's a nested group
        const subGroupJson = JSON.stringify(ruleOrGroup);
        return evaluateWorkflowFilters(subGroupJson, payload);
      } else {
        // It's a single rule
        return evaluateRule(ruleOrGroup as FilterRule, payload);
      }
    });

    if (group.combinator === "or") {
      return results.some((r) => r === true);
    } else {
      // Default to "and"
      return results.every((r) => r === true);
    }
  } catch (error) {
    console.error("[Workflow Evaluator] Failed to parse or evaluate filters:", error);
    return false; // Fail-closed on error for safety
  }
}
