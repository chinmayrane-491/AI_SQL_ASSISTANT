
export const ROLE_PERMISSIONS = {
    admin: [
        "select",
        "show",
        "desc",
        "describe",
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
        "show",
        "desc",
        "describe",
        "insert",
        "update",
        "delete"
    ],

    reader: [
        "select",
        "show",
        "desc",
        "describe"
    ],

    user: [
        "select",
        "show",
        "desc",
        "describe"
    ]
};
