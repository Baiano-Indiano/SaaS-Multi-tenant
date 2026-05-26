import { Engine, RuleProperties } from "json-rules-engine";

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
 * Instantiates a new json-rules-engine instance configured with custom operators
 * to match exact filter-rule logic.
 */
function createEngineWithOperators(): Engine {
  const engine = new Engine();
  
  engine.addOperator("equals", (factValue, jsonValue) => {
    if (factValue === undefined || factValue === null) return false;
    return String(factValue) === String(jsonValue);
  });

  engine.addOperator("not_equals", (factValue, jsonValue) => {
    if (factValue === undefined || factValue === null) return false;
    return String(factValue) !== String(jsonValue);
  });

  engine.addOperator("contains", (factValue, jsonValue) => {
    if (factValue === undefined || factValue === null) return false;
    return String(factValue).toLowerCase().includes(String(jsonValue).toLowerCase());
  });

  engine.addOperator("not_contains", (factValue, jsonValue) => {
    if (factValue === undefined || factValue === null) return false;
    return !String(factValue).toLowerCase().includes(String(jsonValue).toLowerCase());
  });

  engine.addOperator("exists", (factValue) => {
    return factValue !== undefined && factValue !== null && factValue !== "";
  });

  engine.addOperator("not_exists", (factValue) => {
    return factValue === undefined || factValue === null || factValue === "";
  });
  
  return engine;
}

/**
 * Translates our AST FilterGroup or FilterRule recursively into json-rules-engine conditions format.
 */
function buildConditions(ruleOrGroup: FilterRule | FilterGroup): any {
  if ("combinator" in ruleOrGroup) {
    const combinatorKey = ruleOrGroup.combinator === "or" ? "any" : "all";
    return {
      [combinatorKey]: ruleOrGroup.rules.map(r => buildConditions(r))
    };
  } else {
    const rule = ruleOrGroup as FilterRule;
    // json-rules-engine expects a value property even for unary operators like 'exists'
    return {
      fact: "payload",
      path: `$.${rule.field}`,
      operator: rule.operator,
      value: rule.value || ""
    };
  }
}

/**
 * Evaluates a FilterGroup AST against the event payload facts using json-rules-engine.
 */
export async function evaluateWorkflowFilters(filtersJson: string | null | undefined, payload: any): Promise<boolean> {
  if (!filtersJson) return true; // No filters means evaluate to true (always trigger)
  
  try {
    const group = typeof filtersJson === "string" 
      ? JSON.parse(filtersJson) as FilterGroup 
      : filtersJson as FilterGroup;
      
    if (!group || !group.rules || !Array.isArray(group.rules) || group.rules.length === 0) {
      return true;
    }

    const conditions = buildConditions(group);
    
    const ruleProperties: RuleProperties = {
      conditions,
      event: {
        type: "workflow-match"
      }
    };
    
    const engine = createEngineWithOperators();
    engine.addRule(ruleProperties);
    
    const results = await engine.run({ payload });
    
    return results.events.length > 0;
  } catch (error) {
    console.error("[Workflow Evaluator] Failed to evaluate filters with json-rules-engine:", error);
    return false; // Fail-closed on error for safety
  }
}
