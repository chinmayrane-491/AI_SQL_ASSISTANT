
import {
    checkSQLPermission
} from "../middleware/rbac.middleware.js";

const testCases = [
    ["admin", "select", true],
    ["admin", "insert", true],
    ["admin", "update", true],
    ["admin", "delete", true],
    ["admin", "create", true],
    ["admin", "alter", true],
    ["admin", "drop", true],
    ["admin", "truncate", true],

    ["user", "select", true],
    ["user", "insert", false],
    ["user", "update", false],
    ["user", "delete", false],
    ["user", "create", false],
    ["user", "alter", false],
    ["user", "drop", false],
    ["user", "truncate", false],

    ["unknown", "select", false]
];

for (const [role, operation, expected] of testCases) {

    const result = checkSQLPermission(role, operation);

    const passed = result.allowed === expected;

    console.log(
        `${passed ? "PASS" : "FAIL"} | ${role} | ${operation} | Expected: ${expected} | Actual: ${result.allowed}`
    );
}

