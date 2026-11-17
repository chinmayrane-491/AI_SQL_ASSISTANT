
export const ROLE_PERMISSIONS = {
    admin: [
        "select",
        "insert",
        "update",
        "delete",
        "create",
        "alter",
        "drop",
        "truncate"
    ],

    writer: [
        "select",
        "insert",
        "update",
        "delete"
    ],

    reader: [
        "select"
    ],

    user: [
        "select"
    ]
};
