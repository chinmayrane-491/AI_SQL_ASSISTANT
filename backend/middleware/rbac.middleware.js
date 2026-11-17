
import { ROLE_PERMISSIONS } from "../config/permissions.js";

export function checkSQLPermission(role, operation) {

    // 1. Check whether role exists
    const permissions = ROLE_PERMISSIONS[role];

    if (!permissions) {
        return {
            allowed: false,
            message: "Invalid or unauthorized role"
        };
    }

    // 2. Check whether operation is allowed
    if (!permissions.includes(operation)) {
        return {
            allowed: false,
            message: `Your ${role} role cannot execute ${operation.toUpperCase()} queries`
        };
    }

    // 3. Permission granted
    return {
        allowed: true,
        message: "Permission granted"
    };
}
